import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('app_versions')
export class AppVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  platform: string; // 'android' | 'ios'

  @Column()
  minVersion: string; // Versión mínima requerida

  @Column()
  latestVersion: string; // Última versión disponible

  @Column({ type: 'text', nullable: true })
  updateUrl: string; // URL de descarga (S3, Play Store, App Store)

  @Column({ default: false })
  forceUpdate: boolean; // Si es true, la app NO puede usarse sin actualizar

  @Column({ type: 'text', nullable: true })
  releaseNotes: string; // Notas de la versión

  @CreateDateColumn()
  createdAt: Date;
}