import { Module } from '@nestjs/common';
import { LearningService } from './learning.service';
import { LearningController } from './learning.controller';
import { QuestionsBankService } from './question-bank.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsBank } from './entities/question-banks.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([QuestionsBank])
  ],
  controllers: [LearningController],
  providers: [LearningService, QuestionsBankService],
})
export class LearningModule { }
