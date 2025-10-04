import { Injectable, Logger } from '@nestjs/common';
import { QuestionsBankService } from '../quiz/services/question-bank.service';
import { GeneratedQuestion } from '../quiz/interfaces/generated-question.interface';
import { QuestionGenerationRequest } from '../quiz/interfaces/question-generation-request.interface';
import { QuestionCacheService } from './services/question-cache.service';
import { QuestionGeneratorService } from './services/question-generator.service';

@Injectable()
export class LearningService {
  private readonly logger = new Logger(LearningService.name);

  constructor(
    private questionsBankService: QuestionsBankService,
    private questionCache: QuestionCacheService,
    private questionGenerator: QuestionGeneratorService
  ) {}

  async generateQuestions(request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
    // 1. Verificar caché
    const cachedQuestions = this.questionCache.get(request);
    if (cachedQuestions) {
      this.logger.log('Retornando preguntas desde caché');
      return cachedQuestions;
    }

    // 2. Buscar en banco de preguntas
    const bankQuestions = await this.questionsBankService.findMatchingQuestions(
      request,
      request.questionCount
    );

    if (bankQuestions.length >= request.questionCount) {
      const selectedQuestions = bankQuestions.slice(0, request.questionCount);
      this.questionCache.set(request, selectedQuestions);
      return selectedQuestions;
    }

    // 3. Generar preguntas faltantes
    const questionsNeeded = request.questionCount - bankQuestions.length;
    this.logger.log(
      `Se necesitan ${questionsNeeded} preguntas nuevas. Ya tenemos ${bankQuestions.length} del banco.`
    );

    const newQuestions = await this.questionGenerator.generateQuestions(
      request,
      questionsNeeded
    );

    // 4. Guardar nuevas preguntas con UUIDs reales
    let savedNewQuestions: GeneratedQuestion[] = [];
    if (newQuestions.length > 0) {
      savedNewQuestions = await this.questionsBankService.saveQuestions(
        newQuestions,
        request
      );
      this.logger.log(`${savedNewQuestions.length} preguntas guardadas con UUIDs reales`);
    }

    // 5. Combinar y cachear
    const allQuestions = [...bankQuestions, ...savedNewQuestions].slice(0, request.questionCount);
    this.questionCache.set(request, allQuestions);

    return allQuestions;
  }

  async generateQuestionsFromFileContent(
    fileContent: string,
    request: QuestionGenerationRequest
  ): Promise<GeneratedQuestion[]> {
    this.logger.log(`Generando ${request.questionCount} preguntas desde contenido del archivo`);

    const newQuestions = await this.questionGenerator.generateQuestionsFromFile(
      fileContent,
      request
    );

    // Guardar preguntas en el banco
    if (newQuestions.length > 0) {
      const savedQuestions = await this.questionsBankService.saveQuestions(
        newQuestions,
        request
      );
      this.logger.log(`${savedQuestions.length} preguntas guardadas desde archivo`);
      return savedQuestions;
    }

    return newQuestions;
  }
}