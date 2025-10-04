import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { CreateQuizDto } from '../../learning/dto/create-quiz.dto';

@Injectable()
export class QuizDuplicateValidatorService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepo: Repository<Quiz>
  ) {}

  /**
   * Retorna el quiz existente si es duplicado, null si no existe
   */
  async findDuplicate(dto: CreateQuizDto, userId: string): Promise<Quiz | null> {
    const existing = await this.quizRepo
      .createQueryBuilder('quiz')
      .where('quiz.userId = :userId', { userId })
      .andWhere('LOWER(quiz.title) = LOWER(:title)', { title: dto.title })
      .andWhere('LOWER(quiz.topic) = LOWER(:topic)', { topic: dto.topic })
      .andWhere('quiz.difficulty = :difficulty', { difficulty: dto.difficulty })
      .andWhere('quiz.totalQuestions = :count', { count: dto.questionCount })
      .leftJoinAndSelect('quiz.questions', 'questions')
      .getOne();

    return existing || null;
  }
}