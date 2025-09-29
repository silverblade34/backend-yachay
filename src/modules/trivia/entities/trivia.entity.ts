import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('trivias')
export class Trivia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  sPregunta: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true  })
  sOpcionA: string;

  @Column({ type: 'varchar', length: 500, nullable: true  })
  sOpcionB: string;

  @Column({ type: 'varchar', length: 500, nullable: true  })
  sOpcionC: string;

  @Column({ type: 'varchar', length: 500, nullable: true  })
  sOpcionD: string;

  @Column({ type: 'int' })
  nRespuestaCorrecta: number;

  @Column({ type: 'varchar', length: 100, nullable: true  })
  sCategoria: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  sDatoInteresante: string;

  @Column({ type: 'varchar', length: 50, default: 'FACIL' })
  sDificultad: string; // FACIL, MEDIO, DIFICIL

  @Column({ type: 'int', default: 1 })
  nEstado: number; // 1=Activo, 0=Inactivo

  @CreateDateColumn()
  dFechaCreacion: Date;
}
