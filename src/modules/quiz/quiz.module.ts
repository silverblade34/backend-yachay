import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizService } from './quiz.service';
import { Quiz } from './entities/quiz.entity';
import { QuestionsBank } from './entities/question-banks.entity';
import { QuizResult } from './entities/quiz-result.entity';
import { Category } from '../category/entities/category.entity';
import { User } from '../user/entities/user.entity';
import { QuizDuplicateValidatorService } from './services/quiz-duplicate-validator.service';
import { QuizGenerationOrchestratorService } from './services/quiz-generation-orchestrator.service';
import { QuestionsBankService } from './services/question-bank.service';
import { FileValidationService } from './services/file-validation.service';
import { QuestionTypeMetadataService } from './services/question-type-metadata.service';
import { LearningModule } from '../learning/learning.module';
import { QuestionResult } from './entities/question-result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, QuestionsBank, QuizResult, QuestionResult, Category, User]),
    forwardRef(() => LearningModule)
  ],
  providers: [
    QuizService,
    QuestionsBankService,
    QuizDuplicateValidatorService,
    QuizGenerationOrchestratorService,
    FileValidationService,
    QuestionTypeMetadataService
  ],
  exports: [
    QuizService,
    QuestionsBankService,
    QuizGenerationOrchestratorService,
    FileValidationService,
    QuestionTypeMetadataService,
    TypeOrmModule
  ]
})
export class QuizModule { }