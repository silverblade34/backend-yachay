import { Controller, Get, Post, Body, Logger, HttpException, HttpStatus, HttpCode } from '@nestjs/common';
import { LearningService } from './learning.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuestionGenerationRequest } from './interfaces/question-generation-request.interface';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QuickExamDto } from './dto/quick-exam.dto';
import { DifficultyLevel } from './enum/difficulty-level.enum';
import { QuestionType } from './enum/question-type.enum';

@ApiTags('🎓 Yachay Quiz Generator')
@Controller('learning')
export class LearningController {
  private readonly logger = new Logger(LearningController.name);

  constructor(private readonly geminiService: LearningService) { }

  @HttpCode(HttpStatus.OK)
  @Post('generate-quiz')
  @ApiOperation({
    summary: 'Generar quiz personalizado',
    description: 'Crea un quiz completamente personalizado con IA basado en parámetros específicos'
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz generado exitosamente'
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación en los parámetros'
  })
  async generateQuiz(@Body() createQuizDto: CreateQuizDto) {
    try {
      const totalPercentage = createQuizDto.questionTypes.reduce(
        (sum, qt) => sum + qt.percentage, 0
      );

      if (Math.abs(totalPercentage - 100) > 0.1) {
        throw new HttpException(
          'Los porcentajes de tipos de pregunta deben sumar 100%',
          HttpStatus.BAD_REQUEST
        );
      }

      const enhancedRequest: QuestionGenerationRequest = {
        topic: createQuizDto.topic,
        description: createQuizDto.description,
        difficulty: createQuizDto.difficulty,
        questionCount: createQuizDto.questionCount,
        questionTypes: createQuizDto.questionTypes,
        language: createQuizDto.language || 'español',
        focusAreas: createQuizDto.focusAreas,
      };

      const questions = await this.geminiService.generateQuestions(enhancedRequest);

      return {
        id: this.generateQuizId(),
        topic: createQuizDto.topic,
        difficulty: createQuizDto.difficulty,
        totalQuestions: questions.length,
        questions: questions,
        metadata: {
          createdAt: new Date().toISOString(),
          language: enhancedRequest.language,
        }
      };

    } catch (error) {
      this.logger.error('Error generating enhanced quiz:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          error: error.message,
          message: 'Error al generar el quiz personalizado'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('quick-exam')
  @ApiOperation({
    summary: 'Generar examen rápido',
    description: 'Crea un examen rápido con configuración predeterminada'
  })
  async generateQuickExam(@Body() quickExamDto: QuickExamDto) {
    try {
      const quickRequest: QuestionGenerationRequest = {
        topic: quickExamDto.topic,
        description: `Examen rápido sobre ${quickExamDto.topic}`,
        difficulty: quickExamDto.difficulty || DifficultyLevel.INTERMEDIATE,
        questionCount: quickExamDto.count || 5,
        questionTypes: [
          { type: QuestionType.MULTIPLE_CHOICE, percentage: 60, priority: 8 },
          { type: QuestionType.TRUE_FALSE, percentage: 40, priority: 7 }
        ],
        language: 'español',
      };

      const questions = await this.geminiService.generateQuestions(quickRequest);

      return {
        id: this.generateQuizId(),
        topic: quickRequest.topic,
        difficulty: quickRequest.difficulty,
        totalQuestions: questions.length,
        questions: questions,
        metadata: {
          createdAt: new Date().toISOString(),
          language: quickRequest.language,
        }
      };

    } catch (error) {
      this.logger.error('Error generating quick exam:', error);
      throw new HttpException(
        {
          success: false,
          error: error.message,
          message: 'Error al generar el examen rápido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('question-types')
  @ApiOperation({
    summary: 'Obtener tipos de pregunta disponibles',
    description: 'Lista todos los tipos de pregunta soportados por Yachay'
  })
  async getQuestionTypes() {
    const questionTypes = Object.values(QuestionType).map(type => ({
      type,
      name: this.getQuestionTypeName(type),
      description: this.getQuestionTypeDescription(type),
      difficulty: this.getQuestionTypeDifficulty(type),
      recommended: this.isRecommendedQuestionType(type)
    }));

    return questionTypes;
  }

  private generateQuizId(): string {
    return `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private getQuestionTypeName(type: QuestionType): string {
    const names = {
      [QuestionType.MULTIPLE_CHOICE]: 'Opción Múltiple',
      [QuestionType.MULTIPLE_SELECT]: 'Selección Múltiple',
      [QuestionType.TRUE_FALSE]: 'Verdadero/Falso',
      [QuestionType.FILL_BLANK]: 'Completar Espacios',
      [QuestionType.DRAG_DROP]: 'Arrastrar y Soltar',
      [QuestionType.SEQUENCE_ORDER]: 'Ordenar Secuencia',
      // [QuestionType.MATCH_PAIRS]: 'Emparejar Conceptos',
      [QuestionType.SELECT_TEXT]: 'Seleccionar Texto',
      // [QuestionType.CATEGORIZE]: 'Categorizar',
      // [QuestionType.SHORT_ANSWER]: 'Respuesta Corta'
    };
    return names[type] || type;
  }

  private getQuestionTypeDescription(type: QuestionType): string {
    const descriptions = {
      [QuestionType.MULTIPLE_CHOICE]: 'Pregunta con 4 opciones, una correcta',
      [QuestionType.MULTIPLE_SELECT]: 'Pregunta con múltiples respuestas correctas',
      [QuestionType.TRUE_FALSE]: 'Afirmación para evaluar como verdadera o falsa',
      [QuestionType.FILL_BLANK]: 'Completar espacios en blanco en el texto',
      [QuestionType.DRAG_DROP]: 'Arrastrar opciones a los espacios correctos',
      [QuestionType.SEQUENCE_ORDER]: 'Ordenar elementos en secuencia lógica',
      // [QuestionType.MATCH_PAIRS]: 'Conectar conceptos relacionados',
      [QuestionType.SELECT_TEXT]: 'Seleccionar parte correcta de un texto',
      //[QuestionType.CATEGORIZE]: 'Clasificar elementos en categorías',
      //[QuestionType.SHORT_ANSWER]: 'Respuesta breve de 1-3 palabras'
    };
    return descriptions[type] || 'Tipo de pregunta personalizado';
  }

  private getQuestionTypeDifficulty(type: QuestionType): string {
    const difficulties = {
      [QuestionType.TRUE_FALSE]: 'Fácil',
      [QuestionType.MULTIPLE_CHOICE]: 'Medio',
      [QuestionType.FILL_BLANK]: 'Medio',
      [QuestionType.MULTIPLE_SELECT]: 'Medio-Alto',
      [QuestionType.DRAG_DROP]: 'Medio-Alto',
      [QuestionType.SEQUENCE_ORDER]: 'Alto',
      // [QuestionType.MATCH_PAIRS]: 'Alto',
      // [QuestionType.CATEGORIZE]: 'Alto',
      [QuestionType.SELECT_TEXT]: 'Medio',
      // [QuestionType.SHORT_ANSWER]: 'Alto'
    };
    return difficulties[type] || 'Variable';
  }

  private isRecommendedQuestionType(type: QuestionType): boolean {
    const recommended = [
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.TRUE_FALSE,
      QuestionType.FILL_BLANK,
      QuestionType.DRAG_DROP
    ];
    return recommended.includes(type);
  }
}