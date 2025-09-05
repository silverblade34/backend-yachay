import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { QuestionResult } from './question-result.entity';
import { Category } from 'src/modules/category/entities/category.entity';

@Entity('quiz_results')
export class QuizResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  title: string;

  @Column('jsonb')
  quiz: any; // Toda la información del quiz

  @Column({ type: 'int' })
  finalScore: number;

  @Column({ type: 'int' })
  maxScore: number;

  @Column({ type: 'int' })
  hintsUsed: number;

  @Column('bigint')
  totalTime: number; // Tiempo total en milisegundos

  @ManyToOne(() => User, user => user.quizResults)
  user: User;

  @ManyToOne(() => Category, { nullable: true })
  category: Category;

  @OneToMany(() => QuestionResult, qr => qr.quizResult, { cascade: true })
  questionResults: QuestionResult[];

  @CreateDateColumn()
  createdAt: Date;
}
