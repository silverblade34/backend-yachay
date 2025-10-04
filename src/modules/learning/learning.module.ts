import { Module, forwardRef } from '@nestjs/common';
import { LearningService } from './learning.service';
import { LearningController } from './learning.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsBank } from '../quiz/entities/question-banks.entity';
import { QuizModule } from '../quiz/quiz.module';
import { AuthModule } from '../auth/auth.module';
import { FileContentService } from './services/file-content.service';
import { QuestionCacheService } from './services/question-cache.service';
import { QuestionGeneratorService } from './services/question-generator.service';
import { AIProviderService } from './services/ai-provider.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { QuestionParserService } from './services/question-parser.service';
import { TopicGeneratorService } from './services/topic-generator.service';
import { GeminiProvider } from './providers/gemini.provider';
import { MistralProvider } from './providers/mistral.provider';
import { QuizResult } from '../quiz/entities/quiz-result.entity';
import { CourseModule } from '../course-module/entities/course-module.entity';

@Module({
  imports: [
    forwardRef(() => QuizModule),
    AuthModule,
    TypeOrmModule.forFeature([QuestionsBank, QuizResult, CourseModule])
  ],
  controllers: [LearningController],
  providers: [
    LearningService,
    FileContentService,
    QuestionCacheService,
    QuestionGeneratorService,
    AIProviderService,
    PromptBuilderService,
    QuestionParserService,
    TopicGeneratorService,
    GeminiProvider,
    MistralProvider,
    {
      provide: 'AI_PROVIDER_INIT',
      useFactory: (
        aiProviderService: AIProviderService,
        geminiProvider: GeminiProvider,
        mistralProvider: MistralProvider
      ) => {
        aiProviderService.registerProvider(geminiProvider);
        aiProviderService.registerProvider(mistralProvider);
        return null;
      },
      inject: [AIProviderService, GeminiProvider, MistralProvider]
    }
  ],
  exports: [LearningService, TypeOrmModule]
})
export class LearningModule {}