import { Injectable, Logger } from '@nestjs/common';
import { GeneratedQuestion } from '../../quiz/interfaces/generated-question.interface';
import { QuestionGenerationRequest } from '../../quiz/interfaces/question-generation-request.interface';

export interface AIProviderConfig {
  name: string;
  priority: number;
  maxConcurrent: number;
}

export abstract class AIProvider {
  abstract readonly config: AIProviderConfig;
  abstract generateSingleQuestion(
    request: QuestionGenerationRequest,
    questionNumber: number
  ): Promise<GeneratedQuestion | null>;
  abstract isAvailable(): boolean;
}

interface QuestionGenerationAttempt {
  questionNumber: number;
  request: QuestionGenerationRequest;
  result: GeneratedQuestion | null;
  provider: string;
}

@Injectable()
export class AIProviderService {
  private readonly logger = new Logger(AIProviderService.name);
  private providers: AIProvider[] = [];

  registerProvider(provider: AIProvider): void {
    this.providers.push(provider);
    // Ordenar por prioridad: mayor prioridad primero
    this.providers.sort((a, b) => b.config.priority - a.config.priority);
  }

  getAvailableProviders(): AIProvider[] {
    return this.providers.filter(p => p.isAvailable());
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.find(p => p.config.name === name);
  }

  /**
   * Genera preguntas con estrategia de fallback garantizado:
   * 1. Intenta generar TODAS con el provider de mayor prioridad (Gemini)
   * 2. Si alguna falla, reintenta con el siguiente provider (Mistral)
   * 3. Garantiza que se generen exactamente 'count' preguntas
   */
  async generateQuestions(
    request: QuestionGenerationRequest,
    count: number
  ): Promise<GeneratedQuestion[]> {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No AI providers available');
    }

    this.logger.log(
      `Iniciando generación de ${count} preguntas con ${availableProviders.length} providers disponibles`
    );

    // Fase 1: Intentar generar TODAS con el provider de mayor prioridad
    const primaryProvider = availableProviders[0];
    this.logger.log(`Intentando generar ${count} preguntas con ${primaryProvider.config.name}`);
    
    const primaryAttempts = await this.generateWithProvider(
      primaryProvider,
      request,
      count
    );

    const successfulQuestions = primaryAttempts.filter(a => a.result !== null);
    const failedAttempts = primaryAttempts.filter(a => a.result === null);

    this.logger.log(
      `${primaryProvider.config.name}: ${successfulQuestions.length}/${count} preguntas generadas exitosamente`
    );

    // Si se generaron todas las preguntas, retornar
    if (failedAttempts.length === 0) {
      return successfulQuestions.map(a => a.result!);
    }

    // Fase 2: Completar preguntas fallidas con providers de fallback
    this.logger.warn(
      `Faltan ${failedAttempts.length} preguntas. Intentando con providers de fallback...`
    );

    const fallbackProviders = availableProviders.slice(1);
    const retriedQuestions = await this.retryFailedQuestions(
      failedAttempts,
      fallbackProviders
    );

    // Combinar resultados
    const allQuestions = [
      ...successfulQuestions.map(a => a.result!),
      ...retriedQuestions
    ];

    this.logger.log(
      `Generación completada: ${allQuestions.length}/${count} preguntas (${successfulQuestions.length} con ${primaryProvider.config.name}, ${retriedQuestions.length} con fallback)`
    );

    if (allQuestions.length < count) {
      this.logger.error(
        `⚠️ ADVERTENCIA: Solo se generaron ${allQuestions.length}/${count} preguntas solicitadas`
      );
    }

    return allQuestions;
  }

  /**
   * Genera preguntas con un provider específico
   */
  private async generateWithProvider(
    provider: AIProvider,
    request: QuestionGenerationRequest,
    count: number
  ): Promise<QuestionGenerationAttempt[]> {
    const promises = Array.from({ length: count }, (_, i) =>
      this.attemptGeneration(provider, request, i + 1)
    );

    const results = await Promise.allSettled(promises);

    return results.map((result, index) => ({
      questionNumber: index + 1,
      request: { ...request, questionCount: 1 },
      result: result.status === 'fulfilled' ? result.value : null,
      provider: provider.config.name
    }));
  }

  /**
   * Intenta generar una pregunta con un provider
   */
  private async attemptGeneration(
    provider: AIProvider,
    request: QuestionGenerationRequest,
    questionNumber: number
  ): Promise<GeneratedQuestion | null> {
    try {
      return await provider.generateSingleQuestion(
        { ...request, questionCount: 1 },
        questionNumber
      );
    } catch (error) {
      this.logger.error(
        `Error al generar pregunta ${questionNumber} con ${provider.config.name}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Reintenta generar las preguntas fallidas con providers de fallback
   */
  private async retryFailedQuestions(
    failedAttempts: QuestionGenerationAttempt[],
    fallbackProviders: AIProvider[]
  ): Promise<GeneratedQuestion[]> {
    if (fallbackProviders.length === 0) {
      this.logger.error('No hay providers de fallback disponibles');
      return [];
    }

    const retriedQuestions: GeneratedQuestion[] = [];

    for (const attempt of failedAttempts) {
      let questionGenerated = false;

      // Intentar con cada provider de fallback hasta que uno funcione
      for (const provider of fallbackProviders) {
        this.logger.log(
          `Reintentando pregunta ${attempt.questionNumber} con ${provider.config.name}`
        );

        const result = await this.attemptGeneration(
          provider,
          attempt.request,
          attempt.questionNumber
        );

        if (result) {
          retriedQuestions.push(result);
          questionGenerated = true;
          this.logger.log(
            `✓ Pregunta ${attempt.questionNumber} generada con ${provider.config.name}`
          );
          break;
        }
      }

      if (!questionGenerated) {
        this.logger.error(
          `✗ No se pudo generar la pregunta ${attempt.questionNumber} con ningún provider`
        );
      }
    }

    return retriedQuestions;
  }

  /**
   * Genera estadísticas de uso de providers
   */
  getGenerationStats(questions: GeneratedQuestion[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const question of questions) {
      const provider = (question as any).generatedBy || 'unknown';
      stats[provider] = (stats[provider] || 0) + 1;
    }

    return stats;
  }
}