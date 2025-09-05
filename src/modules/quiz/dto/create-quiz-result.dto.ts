import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsString,
  ValidateNested, IsBoolean
} from 'class-validator';

export class QuestionResultDto {
  @IsString()
  questionId: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsString()
  userAnswer: string;

  @IsString()
  correctAnswer: string;

  @IsNumber()
  timeSpent: number;
}

export class CreateQuizResultDto {
  @IsObject()
  quiz: {
    id: string;
    topic: string;
    difficulty: string;
    totalQuestions: number;
    questions: any[];
    metadata: any;
  };

  @IsString()
  title: string;

  @IsString()
  categoryId: string;

  @IsNumber()
  finalScore: number;

  @IsNumber()
  maxScore: number;

  @IsNumber()
  hintsUsed: number;

  @IsNumber()
  totalTime: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionResultDto)
  questionResults: QuestionResultDto[];
}