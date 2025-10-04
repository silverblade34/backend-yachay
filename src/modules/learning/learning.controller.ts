import { Controller, Get, Post, Body, Logger, HttpException, HttpStatus, HttpCode, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateQuizDto, CreateQuizFileDto } from './dto/create-quiz.dto';
import { QuickExamDto } from './dto/quick-exam.dto';
import { QuizGenerationOrchestratorService } from '../quiz/services/quiz-generation-orchestrator.service';
import { FileContentService } from './services/file-content.service';
import { LearningService } from './learning.service';
import { QuestionGenerationRequest } from '../quiz/interfaces/question-generation-request.interface';
import { DifficultyLevel } from './enum/difficulty-level.enum';
import { QuestionType } from './enum/question-type.enum';
import { FileValidationService } from '../quiz/services/file-validation.service';
import { QuestionTypeMetadataService } from '../quiz/services/question-type-metadata.service';

@ApiTags('🎓 Yachay Quiz Generator')
@UseGuards(JwtAuthGuard)
@Controller('learning')
export class LearningController {
  private readonly logger = new Logger(LearningController.name);

  constructor(
    private readonly quizOrchestrator: QuizGenerationOrchestratorService,
    private readonly fileContentService: FileContentService,
    private readonly fileValidationService: FileValidationService,
    private readonly questionTypeMetadata: QuestionTypeMetadataService,
    private readonly learningService: LearningService
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('generate-quiz')
  @ApiOperation({
    summary: 'Generar quiz personalizado',
    description: 'Crea un quiz completamente personalizado con IA'
  })
  @ApiResponse({ status: 200, description: 'Quiz generado exitosamente' })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  async generateQuiz(@Body() createQuizDto: CreateQuizDto, @Req() req: any) {
    try {
      const { userId } = req.user;
      this.logger.log(`Usuario ${userId} solicitando generación de quiz`);

      return await this.quizOrchestrator.generateStandardQuiz(createQuizDto, userId);
    } catch (error) {
      this.logger.error('Error generating quiz:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Error al generar el quiz personalizado',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('generate-quiz-from-file')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Generar quiz desde archivo',
    description: 'Crea un quiz analizando contenido de PDF, DOCX o PPTX'
  })
  @ApiResponse({ status: 200, description: 'Quiz generado desde archivo' })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  async generateQuizFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createQuizDto: CreateQuizFileDto,
    @Req() req: any
  ) {
    try {
      const { userId } = req.user;
      this.logger.log(`Usuario ${userId} solicitando quiz desde archivo: ${file?.originalname}`);

      // Validar archivo
      this.fileValidationService.validateFile(file);

      // Extraer y validar contenido
      this.logger.log(`Extrayendo contenido del archivo: ${file.originalname}`);
      const fileContent = await this.fileContentService.extractContent(file);
      this.fileValidationService.validateContent(fileContent);

      const processedContent = this.fileContentService.truncateContent(fileContent);
      this.logger.log(`Contenido procesado: ${processedContent.length} caracteres`);

      // Parsear tipos de pregunta
      const questionTypes = this.parseQuestionTypes(createQuizDto.questionTypes);

      // Generar quiz
      return await this.quizOrchestrator.generateQuizFromFile(
        {
          ...createQuizDto,
          questionTypes,
          topic: createQuizDto.topic || 'Contenido del documento',
          description: createQuizDto.description || 'Preguntas basadas en el contenido proporcionado'
        },
        processedContent,
        file.originalname,
        file.mimetype,
        userId
      );
    } catch (error) {
      this.logger.error('Error generando quiz desde archivo:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Error al generar el quiz desde el archivo',
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
      const request: QuestionGenerationRequest = {
        topic: quickExamDto.topic,
        description: `Examen rápido sobre ${quickExamDto.topic}`,
        difficulty: quickExamDto.difficulty || DifficultyLevel.INTERMEDIATE,
        questionCount: quickExamDto.count || 5,
        questionTypes: [
          { type: QuestionType.MULTIPLE_CHOICE, percentage: 60, priority: 8 },
          { type: QuestionType.TRUE_FALSE, percentage: 40, priority: 7 }
        ],
        language: 'español'
      };

      const questions = await this.learningService.generateQuestions(request);

      return {
        id: this.generateQuizId(),
        topic: request.topic,
        difficulty: request.difficulty,
        totalQuestions: questions.length,
        questions,
        metadata: {
          createdAt: new Date().toISOString(),
          language: request.language
        }
      };
    } catch (error) {
      this.logger.error('Error generating quick exam:', error);
      throw new HttpException(
        'Error al generar el examen rápido',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @HttpCode(HttpStatus.OK)
  @Get('question-types')
  @ApiOperation({
    summary: 'Obtener tipos de pregunta disponibles',
    description: 'Lista todos los tipos de pregunta soportados'
  })
  async getQuestionTypes() {
    return this.questionTypeMetadata.getAllQuestionTypes();
  }

  // Helpers
  private parseQuestionTypes(typesString: string) {
    const types = typesString.split(',').map(t => t.trim()).filter(t => t);
    return types.map((type, index) => ({
      type: type as QuestionType,
      percentage: Math.floor(100 / types.length),
      priority: types.length - index
    }));
  }

  private generateQuizId(): string {
    return `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }
}