import { Controller, Get, Post, Body, Logger, HttpException, HttpStatus, HttpCode, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { LearningService } from './learning.service';
import { CreateQuizDto, CreateQuizFileDto } from './dto/create-quiz.dto';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QuickExamDto } from './dto/quick-exam.dto';
import { DifficultyLevel } from './enum/difficulty-level.enum';
import { QuestionType } from './enum/question-type.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuestionGenerationRequest } from '../quiz/interfaces/question-generation-request.interface';
import { QuizService } from '../quiz/quiz.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileContentService } from './file-content.service';

@ApiTags('🎓 Yachay Quiz Generator')
@UseGuards(JwtAuthGuard)
@Controller('learning')
export class LearningController {
  private readonly logger = new Logger(LearningController.name);

  constructor(
    private readonly learningService: LearningService,
    private readonly quizService: QuizService,
    private readonly fileContentService: FileContentService
  ) { }

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
  async generateQuiz(@Body() createQuizDto: CreateQuizDto, @Req() req: any) {
    try {
      const { userId } = req.user;
      console.log(JSON.stringify(req.user))
      this.logger.log(`Usuario ${userId} solicitando generación de quiz`);
      if (userId == undefined) this.logger.log("El id del usuario es nulo");
      // Validar porcentajes
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

      const questions = await this.learningService.generateQuestions(enhancedRequest);

      // Validar que todas las preguntas tengan IDs válidos
      const questionIds = questions.map(q => q.id);
      const invalidIds = questionIds.filter(id => !this.isValidUUID(id));

      if (invalidIds.length > 0) {
        this.logger.error(`IDs inválidos encontrados: ${invalidIds.join(', ')}`);
        throw new HttpException(
          'Error: Algunas preguntas no tienen IDs válidos',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      this.logger.log(`Generadas ${questions.length} preguntas con IDs válidos`);

      // Guardar el quiz
      const savedQuiz = await this.quizService.createQuiz(
        createQuizDto,
        "",
        false,
        userId,
        questionIds
      );

      return {
        id: savedQuiz.id,
        title: savedQuiz.title,
        topic: savedQuiz.topic,
        description: savedQuiz.description,
        difficulty: savedQuiz.difficulty,
        totalQuestions: savedQuiz.totalQuestions,
        timeLimit: savedQuiz.timeLimit,
        ispublic: savedQuiz.ispublic,
        allowComments: savedQuiz.allowComments,
        allowRetries: savedQuiz.allowRetries,
        showResults: savedQuiz.showResults,
        questions: questions,
        metadata: {
          createdAt: savedQuiz.createdAt.toISOString(),
          language: savedQuiz.language,
          categoryId: savedQuiz.categoryId,
          courseModuleId: savedQuiz.courseModuleId
        }
      };
    } catch (error) {
      this.logger.error('Error generating quiz:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al generar el quiz personalizado',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('generate-quiz-from-file')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Generar quiz desde archivo',
    description: 'Crea un quiz personalizado analizando el contenido de un archivo PDF, DOCX o PPTX'
  })
  @ApiResponse({
    status: 200,
    description: 'Quiz generado exitosamente desde el archivo'
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación o tipo de archivo no soportado'
  })
  async generateQuizFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createQuizDto: CreateQuizFileDto,
    @Req() req: any
  ) {
    try {
      const { userId } = req.user;
      this.logger.log(`Usuario ${userId} solicitando generación de quiz desde archivo`);

      // Validar archivo
      if (!file) {
        throw new HttpException(
          'Debe proporcionar un archivo',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validar tipo de archivo
      const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint'
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new HttpException(
          'Tipo de archivo no soportado. Use PDF, DOCX o PPTX',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 100 * 1024 * 1024) {
        throw new HttpException(
          'El archivo es demasiado grande. Máximo 10MB',
          HttpStatus.BAD_REQUEST
        );
      }

      // Extraer contenido del archivo
      this.logger.log(`Extrayendo contenido del archivo: ${file.originalname}`);
      const fileContent = await this.fileContentService.extractContent(file);

      // Validar que el contenido sea suficiente
      if (!this.fileContentService.validateContent(fileContent, 100)) {
        throw new HttpException(
          'El contenido del archivo es insuficiente para generar preguntas (mínimo 100 palabras)',
          HttpStatus.BAD_REQUEST
        );
      }

      // Truncar contenido si es necesario
      const processedContent = this.fileContentService.truncateContent(fileContent);

      this.logger.log(`Contenido extraído: ${processedContent.length} caracteres`);

      const types = createQuizDto.questionTypes.split(',').map(t => t.trim()).filter(t => t);

      const questionTypes: Array<{
        type: QuestionType;
        percentage: number;
        priority: number;
      }> = types.map((type, index) => ({
        type: type as QuestionType,
        percentage: Math.floor(100 / types.length),
        priority: types.length - index
      }));

      // Preparar request para generación
      const enhancedRequest: QuestionGenerationRequest = {
        topic: createQuizDto.topic || 'Contenido del documento',
        description: `Preguntas basadas en el contenido proporcionado: ${createQuizDto.description || ''}`,
        difficulty: createQuizDto.difficulty,
        questionCount: createQuizDto.questionCount,
        questionTypes: questionTypes,
        language: createQuizDto.language || 'español',
        focusAreas: [],
      };

      // Generar preguntas desde el contenido
      const questions = await this.learningService.generateQuestionsFromFileContent(
        processedContent,
        enhancedRequest
      );

      // Validar IDs
      const questionIds = questions.map(q => q.id);
      const invalidIds = questionIds.filter(id => !this.isValidUUID(id));

      if (invalidIds.length > 0) {
        this.logger.error(`IDs inválidos encontrados: ${invalidIds.join(', ')}`);
        throw new HttpException(
          'Error: Algunas preguntas no tienen IDs válidos',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      this.logger.log(`Generadas ${questions.length} preguntas desde archivo con IDs válidos`);

      // Guardar el quiz
      const savedQuiz = await this.quizService.createQuiz(
        {
          ...createQuizDto,
          questionTypes,
          topic: createQuizDto.topic || 'Contenido del documento',
          description: `Preguntas basadas en el contenido proporcionado`
        },
        file.originalname,
        true,
        userId,
        questionIds
      );

      return {
        id: savedQuiz.id,
        title: savedQuiz.title,
        topic: savedQuiz.topic,
        description: savedQuiz.description,
        difficulty: savedQuiz.difficulty,
        totalQuestions: savedQuiz.totalQuestions,
        timeLimit: savedQuiz.timeLimit,
        ispublic: savedQuiz.ispublic,
        allowComments: savedQuiz.allowComments,
        allowRetries: savedQuiz.allowRetries,
        showResults: savedQuiz.showResults,
        questions: questions,
        metadata: {
          createdAt: savedQuiz.createdAt.toISOString(),
          language: savedQuiz.language,
          categoryId: savedQuiz.categoryId,
          courseModuleId: savedQuiz.courseModuleId,
          sourceFile: file.originalname,
          fileType: file.mimetype
        }
      };

    } catch (error) {
      this.logger.error('Error generando quiz desde archivo:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al generar el quiz desde el archivo',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Método auxiliar para validar UUIDs
  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
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

      const questions = await this.learningService.generateQuestions(quickRequest);

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
      [QuestionType.SELECT_TEXT]: 'Seleccionar Texto',
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
      [QuestionType.SELECT_TEXT]: 'Seleccionar parte correcta de un texto',
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
      [QuestionType.SELECT_TEXT]: 'Medio',
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