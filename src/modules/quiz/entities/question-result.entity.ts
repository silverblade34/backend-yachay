import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { QuizResult } from './quiz-result.entity';

@Entity('question_results')
export class QuestionResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  questionId: string; // ID temporal de la pregunta del frontend

  @Column('boolean')
  isCorrect: boolean;

  @Column('text')
  userAnswer: string; // ID de la opción seleccionada

  @Column('text')
  correctAnswer: string; // ID de la opción correcta

  @Column('bigint')
  timeSpent: number; // Tiempo en milisegundos

  @Column('jsonb', { nullable: true })
  additionalData: any; // Para datos extra si los necesitas

  @ManyToOne(() => QuizResult, qr => qr.questionResults)
  quizResult: QuizResult;

  @CreateDateColumn()
  createdAt: Date;
}
