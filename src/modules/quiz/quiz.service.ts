import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizResult } from './entities/quiz-result.entity';
import { QuestionResult } from './entities/question-result.entity';
import { User } from '../user/entities/user.entity';
import { CreateQuizResultDto } from './dto/create-quiz-result.dto';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(QuizResult)
    private quizResultRepo: Repository<QuizResult>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) { }

  async createQuizResult(dto: CreateQuizResultDto, userId: string): Promise<QuizResult> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }
    let category: Category | null = null;
    if (dto.categoryId) {
      category = await this.categoryRepo.findOneBy({ id: dto.categoryId });
      if (!category) {
        throw new NotFoundException(`Categoría con ID ${dto.categoryId} no encontrada`);
      }
    }

    // Crear los resultados de las preguntas
    const questionResults = dto.questionResults.map(qr => {
      const questionResult = new QuestionResult();
      questionResult.questionId = qr.questionId;
      questionResult.isCorrect = qr.isCorrect;
      questionResult.userAnswer = qr.userAnswer;
      questionResult.correctAnswer = qr.correctAnswer;
      questionResult.timeSpent = qr.timeSpent;

      // Datos adicionales que podrías querer guardar
      questionResult.additionalData = {
        originalQuestionId: qr.questionId,
        timestamp: new Date().toISOString()
      };

      return questionResult;
    });

    // Crear el resultado del quiz
    const quizResult = this.quizResultRepo.create({
      quiz: dto.quiz,
      finalScore: dto.finalScore,
      maxScore: dto.maxScore,
      hintsUsed: dto.hintsUsed,
      totalTime: dto.totalTime,
      user,
      questionResults,
      ...(category ? { category } : {}),
      title: dto.title
    });

    try {
      return await this.quizResultRepo.save(quizResult);
    } catch (error) {
      throw new Error(`Error al guardar el resultado del quiz: ${error.message}`);
    }
  }

  // Método para obtener resultados con estadísticas
  async getQuizResultById(id: string): Promise<QuizResult> {
    const result = await this.quizResultRepo.findOne({
      where: { id },
      relations: ['user', 'questionResults'],
    });

    if (!result) {
      throw new NotFoundException(`Resultado de quiz con ID ${id} no encontrado`);
    }

    return result;
  }

  // Método para obtener estadísticas del usuario
  async getUserQuizStats(userId: string) {
    const results = await this.quizResultRepo.find({
      where: { user: { id: userId } },
      relations: ['questionResults'],
      order: { createdAt: 'DESC' }
    });

    return {
      totalQuizzes: results.length,
      averageScore: results.reduce((acc, r) => acc + (r.finalScore / r.maxScore), 0) / results.length,
      totalTime: results.reduce((acc, r) => acc + r.totalTime, 0),
      totalHintsUsed: results.reduce((acc, r) => acc + r.hintsUsed, 0),
    };
  }

  findAll(userId: string) {
    return this.quizResultRepo.find({
      where: { user: { id: userId } },
    });
  }
}