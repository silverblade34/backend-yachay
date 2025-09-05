import { Career } from 'src/modules/careers/entities/career.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('academic')
export class Academic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => Career, career => career.academic, { cascade: true })
  careers: Career[];
}