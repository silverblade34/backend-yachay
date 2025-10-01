import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseModule } from './entities/course-module.entity';
import { Quiz } from '../quiz/entities/quiz.entity';
import { CreateCourseModuleDto } from './dto/create-course-module.dto';
import { UpdateCourseModuleDto } from './dto/update-course-module.dto';

@Injectable()
export class CourseModulesService {
  private readonly logger = new Logger(CourseModulesService.name);

  constructor(
    @InjectRepository(CourseModule)
    private readonly courseModuleRepository: Repository<CourseModule>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>
  ) {}

  async create(
    createDto: CreateCourseModuleDto,
    userId: string
  ): Promise<CourseModule> {
    try {
      const courseModule = this.courseModuleRepository.create({
        ...createDto,
        userId,
        isPublic: createDto.isPublic ?? false,
        allowCollaboration: createDto.allowCollaboration ?? true
      });

      return await this.courseModuleRepository.save(courseModule);
    } catch (error) {
      this.logger.error('Error creating course module:', error);
      throw error;
    }
  }

  async findAll(userId?: string, isPublic?: boolean): Promise<CourseModule[]> {
    const queryBuilder = this.courseModuleRepository
      .createQueryBuilder('cm')
      .leftJoinAndSelect('cm.creator', 'creator')
      .leftJoinAndSelect('cm.category', 'category')
      .leftJoinAndSelect('cm.quizzes', 'quizzes');

    if (userId) {
      queryBuilder.where('cm.userId = :userId', { userId });
    }

    if (isPublic !== undefined) {
      queryBuilder.andWhere('cm.isPublic = :isPublic', { isPublic });
    }

    return await queryBuilder
      .orderBy('cm.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string, userId?: string): Promise<CourseModule> {
    const courseModule = await this.courseModuleRepository.findOne({
      where: { id },
      relations: ['creator', 'category', 'quizzes', 'quizzes.questions']
    });

    if (!courseModule) {
      throw new NotFoundException('Módulo no encontrado');
    }

    // Si no es público, verificar que sea del usuario
    if (!courseModule.isPublic && userId && courseModule.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a este módulo');
    }

    return courseModule;
  }

  async update(
    id: string,
    updateDto: UpdateCourseModuleDto,
    userId: string
  ): Promise<CourseModule> {
    const courseModule = await this.findOne(id, userId);

    if (courseModule.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para editar este módulo');
    }

    Object.assign(courseModule, updateDto);
    return await this.courseModuleRepository.save(courseModule);
  }

  async delete(id: string, userId: string): Promise<void> {
    const courseModule = await this.findOne(id, userId);

    if (courseModule.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar este módulo');
    }

    // Desvincular quizzes (no eliminarlos)
    await this.quizRepository.update(
      { courseModuleId: id },
      { courseModuleId: '' }
    );

    await this.courseModuleRepository.remove(courseModule);
  }

  async addQuiz(
    moduleId: string,
    quizId: string,
    userId: string
  ): Promise<CourseModule> {
    const courseModule = await this.findOne(moduleId, userId);
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });

    if (!quiz) {
      throw new NotFoundException('Quiz no encontrado');
    }

    // Verificar permisos
    if (courseModule.userId !== userId && !courseModule.allowCollaboration) {
      throw new ForbiddenException('Este módulo no permite colaboración');
    }

    // Verificar que el quiz pertenezca al usuario o sea público
    if (quiz.userId !== userId && !quiz.ispublic) {
      throw new ForbiddenException('No tienes acceso a este quiz');
    }

    // Verificar que el quiz no esté ya en otro módulo
    if (quiz.courseModuleId && quiz.courseModuleId !== moduleId) {
      throw new BadRequestException('Este quiz ya pertenece a otro módulo');
    }

    quiz.courseModuleId = moduleId;
    await this.quizRepository.save(quiz);

    // Actualizar estadísticas del módulo
    await this.updateModuleStats(moduleId);

    return await this.findOne(moduleId, userId);
  }

  async removeQuiz(
    moduleId: string,
    quizId: string,
    userId: string
  ): Promise<CourseModule> {
    const courseModule = await this.findOne(moduleId, userId);

    if (courseModule.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar este módulo');
    }

    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });

    if (!quiz || quiz.courseModuleId !== moduleId) {
      throw new NotFoundException('Quiz no encontrado en este módulo');
    }

    quiz.courseModuleId = '';
    await this.quizRepository.save(quiz);

    await this.updateModuleStats(moduleId);

    return await this.findOne(moduleId, userId);
  }

  async updateModuleStats(moduleId: string): Promise<void> {
    const result = await this.quizRepository
      .createQueryBuilder('q')
      .select('COUNT(q.id)', 'totalQuizzes')
      .addSelect('SUM(q.totalQuestions)', 'totalQuestions')
      .where('q.moduleId = :moduleId', { moduleId })
      .getRawOne();

    await this.courseModuleRepository.update(moduleId, {
      totalQuizzes: parseInt(result.totalQuizzes) || 0,
      totalQuestions: parseInt(result.totalQuestions) || 0
    });
  }

  async incrementViews(moduleId: string): Promise<void> {
    await this.courseModuleRepository.increment({ id: moduleId }, 'views', 1);
  }

  async followModule(moduleId: string, userId: string): Promise<void> {
    // Aquí podrías crear una tabla de seguimiento si quieres
    await this.courseModuleRepository.increment({ id: moduleId }, 'followers', 1);
  }

  async rateModule(
    moduleId: string,
    rating: number,
    userId: string
  ): Promise<CourseModule> {
    const courseModule = await this.findOne(moduleId, userId);

    const currentTotal = (courseModule.averageRating || 0) * courseModule.totalRatings;
    const newTotal = currentTotal + rating;
    const newCount = courseModule.totalRatings + 1;

    courseModule.averageRating = newTotal / newCount;
    courseModule.totalRatings = newCount;

    return await this.courseModuleRepository.save(courseModule);
  }

  async getPublicModules(limit: number = 20): Promise<CourseModule[]> {
    return await this.courseModuleRepository.find({
      where: { isPublic: true },
      relations: ['creator', 'category'],
      order: { views: 'DESC', createdAt: 'DESC' },
      take: limit
    });
  }

  async searchModules(query: string): Promise<CourseModule[]> {
    return await this.courseModuleRepository
      .createQueryBuilder('cm')
      .leftJoinAndSelect('cm.creator', 'creator')
      .leftJoinAndSelect('cm.category', 'category')
      .where('cm.isPublic = :isPublic', { isPublic: true })
      .andWhere(
        '(cm.name ILIKE :query OR cm.description ILIKE :query OR :query = ANY(cm.tags))',
        { query: `%${query}%` }
      )
      .orderBy('cm.views', 'DESC')
      .take(50)
      .getMany();
  }
}