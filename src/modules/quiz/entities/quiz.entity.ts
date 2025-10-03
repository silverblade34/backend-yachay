import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn
} from 'typeorm';
import { DifficultyLevel } from '../../learning/enum/difficulty-level.enum';
import { User } from 'src/modules/user/entities/user.entity';
import { Category } from 'src/modules/category/entities/category.entity';
import { QuestionsBank } from './question-banks.entity';
import { CourseModule } from 'src/modules/course-module/entities/course-module.entity';

@Entity('quizzes')
@Index(['userId', 'createdAt'])
@Index(['categoryId'])
@Index(['courseModuleId'])
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  topic: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false, nullable: true })
  generatedFromDocument?: boolean;

  @Column({ type: 'text', nullable: true })
  filename?: string;

  @Column({
    type: 'enum',
    enum: DifficultyLevel,
    default: DifficultyLevel.INTERMEDIATE
  })
  difficulty: DifficultyLevel;

  @Column({ type: 'varchar', length: 50, default: 'español' })
  language: string;

  @Column({ type: 'int' })
  totalQuestions: number;

  @Column({ type: 'int', nullable: true })
  timeLimit?: number;

  @Column({ type: 'boolean', default: false })
  ispublic: boolean;

  @Column({ type: 'boolean', default: true })
  allowComments: boolean;

  @Column({ type: 'boolean', default: true })
  allowRetries: boolean;

  @Column({ type: 'boolean', default: true })
  showResults: boolean;

  @Column({ type: 'simple-array', nullable: true })
  focusAreas?: string[];

  @Column({ type: 'jsonb', nullable: true })
  questionTypesConfig?: any;

  @Column({ type: 'int', default: 0 })
  timesUsed: number;

  @Column({ type: 'int', default: 0 })
  timesCompleted: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  averageScore?: number;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'uuid', nullable: true })
  courseModuleId?: string;

  @ManyToOne(() => CourseModule, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'courseModuleId' })
  courseModule?: CourseModule;

  @ManyToMany(() => QuestionsBank)
  @JoinTable({
    name: 'quiz_questions',
    joinColumn: { name: 'quizId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'questionId', referencedColumnName: 'id' }
  })
  questions: QuestionsBank[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}