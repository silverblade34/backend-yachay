import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    JoinColumn
} from 'typeorm';
import { Quiz } from '../../quiz/entities/quiz.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Category } from 'src/modules/category/entities/category.entity';

@Entity('course_modules')
@Index(['userId', 'createdAt'])
@Index(['isPublic', 'createdAt'])
@Index(['categoryId'])
export class CourseModule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    coverImage: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    color: string;

    @Column({ type: 'boolean', default: false })
    isPublic: boolean;

    @Column({ type: 'boolean', default: true })
    allowCollaboration: boolean;

    @Column({ type: 'simple-array', nullable: true })
    tags: string[];

    @Column({ type: 'int', default: 0 })
    totalQuizzes: number;

    @Column({ type: 'int', default: 0 })
    totalQuestions: number;

    @Column({ type: 'int', default: 0 })
    views: number;

    @Column({ type: 'int', default: 0 })
    followers: number;

    @Column({ type: 'int', default: 0 })
    completions: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    averageRating: number;

    @Column({ type: 'int', default: 0 })
    totalRatings: number;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    creator: User;

    @Column({ type: 'uuid', nullable: true })
    categoryId: string;

    @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'categoryId' })
    category: Category;

    @OneToMany(() => Quiz, quiz => quiz.courseModule)
    quizzes: Quiz[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}