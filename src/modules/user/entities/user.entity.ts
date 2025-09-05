import { QuizResult } from 'src/modules/quiz/entities/quiz-result.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ default: false })
  isConfigured: boolean;

  @Column({ default: false })
  hasAvatar: boolean;

  @Column({ nullable: true, unique: true })
  firebaseUid?: string;

  @Column({ default: 'email' }) // 'email', 'google', 'facebook', etc.
  provider: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => QuizResult, quizResult => quizResult.user)
  quizResults: QuizResult[];
}
