import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizResult } from './entities/quiz-result.entity';
import { QuestionResult } from './entities/question-result.entity';
import { User } from '../user/entities/user.entity';
import { CreateQuizResultDto } from './dto/create-quiz-result.dto';
import { Category } from '../category/entities/category.entity';
import { Quiz } from './entities/quiz.entity';
import { QuestionsBank } from './entities/question-banks.entity';
import { CreateQuizDto } from '../learning/dto/create-quiz.dto';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepo: Repository<Quiz>,
    @InjectRepository(QuestionsBank)
    private questionBankRepo: Repository<QuestionsBank>,
    @InjectRepository(QuizResult)
    private quizResultRepo: Repository<QuizResult>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) { }

  async createQuiz(
    createQuizDto: CreateQuizDto,
    userId: string,
    questionIds: string[]
  ): Promise<Quiz> {
    try {
      const questions = await this.questionBankRepo.findByIds(questionIds);

      if (questions.length !== questionIds.length) {
        throw new Error('Algunas preguntas no se encontraron en el banco');
      }

      const quiz = this.quizRepo.create({
        title: createQuizDto.title,
        topic: createQuizDto.topic,
        description: createQuizDto.description,
        difficulty: createQuizDto.difficulty,
        language: createQuizDto.language || 'español',
        totalQuestions: createQuizDto.questionCount,
        timeLimit: createQuizDto.timeLimit,
        ispublic: createQuizDto.ispublic ?? false,
        allowComments: createQuizDto.allowComments ?? true,
        allowRetries: createQuizDto.allowRetries ?? true,
        showResults: createQuizDto.showResults ?? true,
        focusAreas: createQuizDto.focusAreas,
        questionTypesConfig: createQuizDto.questionTypes,
        userId,
        categoryId: createQuizDto.categoryId,
        courseModuleId: createQuizDto.moduleId || undefined,
        questions
      });

      return await this.quizRepo.save(quiz);
    } catch (error) {
      throw error;
    }
  }

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

    const questionResults = dto.questionResults.map(qr => {
      const questionResult = new QuestionResult();
      questionResult.questionId = qr.questionId;
      questionResult.isCorrect = qr.isCorrect;
      questionResult.userAnswer = qr.userAnswer;
      questionResult.correctAnswer = qr.correctAnswer;
      questionResult.timeSpent = qr.timeSpent;

      questionResult.additionalData = {
        originalQuestionId: qr.questionId,
        timestamp: new Date().toISOString()
      };

      return questionResult;
    });

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