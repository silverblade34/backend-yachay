import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizResult } from './entities/quiz-result.entity';
import { User } from '../user/entities/user.entity';
import { Category } from '../category/entities/category.entity';
import { QuestionResult } from './entities/question-result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuizResult, Category, QuestionResult, User])
  ],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule { }
