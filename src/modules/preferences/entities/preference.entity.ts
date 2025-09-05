import { Category } from 'src/modules/category/entities/category.entity';
import { UserProfile } from 'src/modules/user/entities/user-profile';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, Index } from 'typeorm';

@Entity()
export class Preference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index({ unique: true })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  popularity: number;

  @ManyToMany(() => Category, category => category.preferences)
  @JoinTable({
    name: 'preference_categories',
    joinColumn: { name: 'preference_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' }
  })
  categories: Category[];

  @ManyToMany(() => UserProfile, user => user.preferences)
  usersProfile: UserProfile[];
}
