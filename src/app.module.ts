import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AcademicModule } from './modules/academic/academic.module';
import { CareersModule } from './modules/careers/careers.module';
import { UploadModule } from './modules/upload/upload.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { CategoryModule } from './modules/category/category.module';
import { CharactersModule } from './modules/characters/characters.module';
import { LearningModule } from './modules/learning/learning.module';
import { QuizModule } from './modules/quiz/quiz.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true}),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    UserModule,
    AcademicModule,
    CareersModule,
    CharactersModule,
    UploadModule,
    PreferencesModule,
    CategoryModule,
    LearningModule,
    QuizModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
