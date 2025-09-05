import { Preference } from 'src/modules/preferences/entities/preference.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, Index } from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToMany(() => Preference, preference => preference.categories)
  preferences: Preference[];
}
