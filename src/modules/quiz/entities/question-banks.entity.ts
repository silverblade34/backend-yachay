import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('questions_bank')
@Index(['topic', 'difficulty', 'language', 'type'])
@Index(['topic'])
@Index(['difficulty'])
@Index(['type'])
@Index(['tags'])
@Index(['focusAreas'])
export class QuestionsBank {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'question_id', unique: true })
  questionId: string;

  @Column('text')
  question: string;

  @Column({ length: 50 })
  type: string;

  @Column({ length: 20 })
  difficulty: string;

  @Column()
  topic: string;

  @Column({ length: 10, default: 'es' })
  language: string;

  @Column('jsonb', { default: [] })
  options: any[];

  @Column('jsonb', { name: 'correct_answers', default: [] })
  correctAnswers: string[];

  @Column('jsonb', { default: [] })
  hints: any[];

  @Column('jsonb', { default: {} })
  explanation: any;

  @Column('text', { array: true, default: [] })
  tags: string[];

  @Column('text', { array: true, name: 'focus_areas', default: [] })
  focusAreas: string[];

  @Column('text', { nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column('int', { name: 'usage_count', default: 0 })
  usageCount: number;

  @Column('timestamp with time zone', { name: 'last_used_at', nullable: true })
  lastUsedAt: Date;
}