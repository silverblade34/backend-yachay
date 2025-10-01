import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizResult } from './entities/quiz-result.entity';
import { User } from '../user/entities/user.entity';
import { Category } from '../category/entities/category.entity';
import { QuestionResult } from './entities/question-result.entity';
import { Quiz } from './entities/quiz.entity';
import { QuestionsBank } from './entities/question-banks.entity';
import { QuestionsBankService } from './question-bank.service';
import { CourseModule } from '../course-module/entities/course-module.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuizResult,
      CourseModule,
      QuestionsBank,
      Category,
      QuestionResult,
      User,
      Quiz
    ])
  ],
  controllers: [QuizController],
  providers: [QuizService, QuestionsBankService],
  exports: [QuizModule, QuestionsBankService, QuizService, TypeOrmModule]
})
export class QuizModule { }
