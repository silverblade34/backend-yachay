import { Injectable, Logger } from '@nestjs/common';
import { GeneratedQuestion } from '../../quiz/interfaces/generated-question.interface';
import { QuestionGenerationRequest } from '../../quiz/interfaces/question-generation-request.interface';
import { QuestionHint } from '../interfaces/question-hint.interface';

@Injectable()
export class QuestionParserService {
  private readonly logger = new Logger(QuestionParserService.name);

  parseQuestions(
    text: string,
    request: QuestionGenerationRequest,
    source: string
  ): GeneratedQuestion[] {
    try {
      const cleanJson = this.extractJSON(text);

      if (!cleanJson) {
        this.logger.warn(`No JSON válido encontrado en respuesta de ${source}`);
        return [];
      }

      const parsed = JSON.parse(cleanJson);

      if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        this.logger.warn(`Estructura JSON inválida en respuesta de ${source}`);
        return [];
      }

      return parsed.questions.map((q: any, index: number) => 
        this.sanitizeQuestion(q, request, index)
      );

    } catch (error) {
      this.logger.error(`Error parsing questions from ${source}:`, error.message);
      return [];
    }
  }

  private extractJSON(text: string): string | null {
    if (!text?.trim()) return null;

    try {
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch && this.isValidQuestionJSON(codeBlockMatch[1].trim())) {
        return codeBlockMatch[1].trim();
      }

      const braceMatch = text.match(/\{[\s\S]*"questions"[\s\S]*\}/);
      if (braceMatch) {
        const candidate = this.extractBalancedBraces(braceMatch[0]);
        if (candidate && this.isValidQuestionJSON(candidate)) {
          return candidate;
        }
      }

      if (this.isValidQuestionJSON(text.trim())) {
        return text.trim();
      }

      const questionsIndex = text.indexOf('"questions"');
      if (questionsIndex > -1) {
        const candidate = this.extractFromKeyword(text, questionsIndex);
        if (candidate && this.isValidQuestionJSON(candidate)) {
          return candidate;
        }
      }

    } catch (error) {
      this.logger.debug('Error during JSON extraction:', error.message);
    }

    return null;
  }

  private isValidQuestionJSON(str: string): boolean {
    try {
      const parsed = JSON.parse(str);
      return !!(parsed?.questions && Array.isArray(parsed.questions));
    } catch {
      return false;
    }
  }

  private extractBalancedBraces(text: string): string | null {
    let braces = 0;
    let start = -1;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        if (start === -1) start = i;
        braces++;
      } else if (text[i] === '}') {
        braces--;
        if (braces === 0 && start !== -1) {
          return text.slice(start, i + 1);
        }
      }
    }
    return null;
  }

  private extractFromKeyword(text: string, keywordIndex: number): string | null {
    let start = keywordIndex;
    while (start > 0 && text[start] !== '{') start--;
    if (text[start] !== '{') return null;
    return this.extractBalancedBraces(text.slice(start));
  }

  private sanitizeQuestion(
    q: any,
    request: QuestionGenerationRequest,
    index: number
  ): GeneratedQuestion {
    return {
      id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      question: q.question || `Pregunta ${index + 1}`,
      type: q.type || 'multiple_choice',
      difficulty: q.difficulty || request.difficulty,
      topic: q.topic || request.topic,
      language: q.language || request.language,
      options: this.sanitizeOptions(q.options, index),
      correctAnswers: this.sanitizeCorrectAnswers(q.correctAnswers, q.options),
      hints: this.sanitizeHints(q.hints),
      explanation: this.sanitizeExplanation(q.explanation),
      tags: Array.isArray(q.tags) ? q.tags : []
    };
  }

  private sanitizeOptions(options: any, questionIndex: number): any[] {
    if (!Array.isArray(options)) return [];

    return options.map((opt, i) => ({
      id: opt?.id || `opt_${questionIndex}_${i + 1}`,
      text: opt?.text || `Opción ${i + 1}`,
      isCorrect: Boolean(opt?.isCorrect),
      order: opt?.order ?? i + 1,
      explanation: opt?.explanation || ''
    }));
  }

  private sanitizeCorrectAnswers(correctAnswers: any, options: any[]): string[] {
    if (Array.isArray(correctAnswers)) return correctAnswers;

    return Array.isArray(options)
      ? options.filter(opt => opt?.isCorrect).map(opt => opt.id || opt.text)
      : [];
  }

  private sanitizeHints(hints: any): QuestionHint[] {
    if (Array.isArray(hints) && hints.length > 0) {
      return hints.map(hint => ({
        level: hint?.level || 'moderate',
        text: hint?.text || 'Pista no disponible',
        pointsDeduction: hint?.pointsDeduction ?? 10
      }));
    }

    return [
      { level: 'subtle', text: 'Considera los conceptos clave del tema', pointsDeduction: 5 },
      { level: 'moderate', text: 'Elimina las opciones menos probables', pointsDeduction: 15 },
      { level: 'obvious', text: 'Revisa las definiciones básicas', pointsDeduction: 25 }
    ];
  }

  private sanitizeExplanation(explanation: any): any {
    if (explanation && typeof explanation === 'object') {
      return {
        brief: explanation.brief || 'Sin explicación',
        detailed: explanation.detailed || explanation.brief || 'Sin explicación detallada',
        relatedConcepts: Array.isArray(explanation.relatedConcepts) ? explanation.relatedConcepts : []
      };
    }

    return {
      brief: 'Sin explicación',
      detailed: 'Sin explicación detallada',
      relatedConcepts: []
    };
  }
}