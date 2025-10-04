import { Injectable, Logger, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { LearningService } from '../../learning/learning.service';
import { QuizService } from '../quiz.service';
import { CreateQuizDto } from '../../learning/dto/create-quiz.dto';
import { QuestionGenerationRequest } from '../interfaces/question-generation-request.interface';
import { GeneratedQuestion } from '../interfaces/generated-question.interface';
import { Quiz } from '../entities/quiz.entity';

export interface QuizGenerationResult {
  id: string;
  title: string;
  topic: string;
  description: string;
  difficulty: string;
  totalQuestions: number;
  timeLimit?: number;
  ispublic: boolean;
  allowComments: boolean;
  allowRetries: boolean;
  showResults: boolean;
  questions: GeneratedQuestion[];
  metadata: {
    createdAt: string;
    language: string;
    categoryId?: string;
    courseModuleId?: string;
    sourceFile?: string;
    fileType?: string;
  };
}

@Injectable()
export class QuizGenerationOrchestratorService {
  private readonly logger = new Logger(QuizGenerationOrchestratorService.name);

  constructor(
    @Inject(forwardRef(() => LearningService))
    private learningService: LearningService,
    private quizService: QuizService
  ) { }

  async generateStandardQuiz(
    createQuizDto: CreateQuizDto,
    userId: string
  ): Promise<QuizGenerationResult> {
    // 1. Validar porcentajes
    this.validateQuestionTypePercentages(createQuizDto.questionTypes);

    // 2. Preparar request
    const request = this.buildGenerationRequest(createQuizDto);

    // 3. Generar preguntas
    const questions = await this.learningService.generateQuestions(request);

    // 4. Validar IDs
    this.validateQuestionIds(questions);

    this.logger.log(`Generadas ${questions.length} preguntas con IDs válidos`);

    // 5. Guardar quiz
    const savedQuiz = await this.quizService.createQuiz(
      createQuizDto,
      '',
      false,
      userId,
      questions.map(q => q.id)
    );

    // 6. Formatear respuesta
    return this.formatQuizResponse(savedQuiz, questions);
  }

  async generateQuizFromFile(
    createQuizDto: CreateQuizDto,
    fileContent: string,
    fileName: string,
    fileMimeType: string,
    userId: string
  ): Promise<QuizGenerationResult> {
    // 1. Preparar request
    const request = this.buildGenerationRequest(createQuizDto);

    // 2. Generar preguntas desde contenido
    const questions = await this.learningService.generateQuestionsFromFileContent(
      fileContent,
      request
    );

    // 3. Validar IDs
    this.validateQuestionIds(questions);

    this.logger.log(`Generadas ${questions.length} preguntas desde archivo con IDs válidos`);

    // 4. Guardar quiz
    const savedQuiz = await this.quizService.createQuiz(
      createQuizDto,
      fileName,
      true,
      userId,
      questions.map(q => q.id)
    );

    // 5. Formatear respuesta con metadata del archivo
    return this.formatQuizResponse(savedQuiz, questions, {
      sourceFile: fileName,
      fileType: fileMimeType
    });
  }

  private validateQuestionTypePercentages(
    questionTypes: Array<{ percentage: number }>
  ): void {
    const totalPercentage = questionTypes.reduce((sum, qt) => sum + qt.percentage, 0);

    if (Math.abs(totalPercentage - 100) > 0.1) {
      throw new HttpException(
        'Los porcentajes de tipos de pregunta deben sumar 100%',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  private buildGenerationRequest(dto: CreateQuizDto): QuestionGenerationRequest {
    return {
      topic: dto.topic,
      description: dto.description,
      difficulty: dto.difficulty,
      questionCount: dto.questionCount,
      questionTypes: dto.questionTypes,
      language: dto.language || 'español',
      focusAreas: dto.focusAreas || []
    };
  }

  private validateQuestionIds(questions: GeneratedQuestion[]): void {
    const questionIds = questions.map(q => q.id);
    const invalidIds = questionIds.filter(id => !this.isValidUUID(id));

    if (invalidIds.length > 0) {
      this.logger.error(`IDs inválidos encontrados: ${invalidIds.join(', ')}`);
      throw new HttpException(
        'Error: Algunas preguntas no tienen IDs válidos',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  private formatQuizResponse(
    quiz: Quiz,
    questions: GeneratedQuestion[],
    extraMetadata?: { sourceFile?: string; fileType?: string }
  ): QuizGenerationResult {
    return {
      id: quiz.id,
      title: quiz.title,
      topic: quiz.topic,
      description: quiz.description || '',
      difficulty: quiz.difficulty,
      totalQuestions: quiz.totalQuestions,
      timeLimit: quiz.timeLimit,
      ispublic: quiz.ispublic,
      allowComments: quiz.allowComments,
      allowRetries: quiz.allowRetries,
      showResults: quiz.showResults,
      questions,
      metadata: {
        createdAt: quiz.createdAt.toISOString(),
        language: quiz.language,
        categoryId: quiz.categoryId,
        courseModuleId: quiz.courseModuleId,
        ...extraMetadata
      }
    };
  }
}