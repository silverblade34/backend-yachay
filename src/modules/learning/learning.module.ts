import { Module } from '@nestjs/common';
import { LearningService } from './learning.service';
import { LearningController } from './learning.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsBank } from '../quiz/entities/question-banks.entity';
import { QuestionsBankService } from '../quiz/question-bank.service';
import { QuizModule } from '../quiz/quiz.module';
import { QuizService } from '../quiz/quiz.service';
import { AuthModule } from '../auth/auth.module';
import { FileContentService } from './file-content.service';

@Module({
  imports: [
    QuizModule,
    AuthModule,
    TypeOrmModule.forFeature([QuestionsBank])
  ],
  controllers: [LearningController],
  providers: [LearningService, QuestionsBankService, QuizService, FileContentService],
  exports: [TypeOrmModule]
})
export class LearningModule { }
