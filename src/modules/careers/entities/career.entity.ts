import { Academic } from 'src/modules/academic/entities/academic.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity('careers')
export class Career {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Academic, academic => academic.careers, { onDelete: 'CASCADE' })
  academic: Academic;

  @Column()
  academicId: string; // FK explícita si deseas consultarla fácilmente
}
