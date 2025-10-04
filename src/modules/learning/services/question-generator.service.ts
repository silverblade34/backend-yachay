import { Injectable, Logger } from '@nestjs/common';
import { GeneratedQuestion } from '../../quiz/interfaces/generated-question.interface';
import { QuestionGenerationRequest } from '../../quiz/interfaces/question-generation-request.interface';
import { AIProviderService } from './ai-provider.service';
import { TopicGeneratorService } from './topic-generator.service';

@Injectable()
export class QuestionGeneratorService {
  private readonly logger = new Logger(QuestionGeneratorService.name);

  constructor(
    private aiProviderService: AIProviderService,
    private topicGenerator: TopicGeneratorService
  ) {}

  async generateQuestions(
    request: QuestionGenerationRequest,
    count: number
  ): Promise<GeneratedQuestion[]> {
    this.logger.log(`Generando ${count} preguntas nuevas`);

    const specificTopics = await this.topicGenerator.generateDiverseTopics({
      ...request,
      questionCount: count
    });

    const questions: GeneratedQuestion[] = [];

    for (let i = 0; i < count; i++) {
      const specificTopic = specificTopics[i % specificTopics.length];
      const singleRequest = {
        ...request,
        questionCount: 1,
        specificTopic
      };

      const generated = await this.aiProviderService.generateQuestions(singleRequest, 1);
      questions.push(...generated);
    }

    this.logger.log(`Generadas ${questions.length}/${count} preguntas`);
    return questions;
  }

  async generateQuestionsFromFile(
    fileContent: string,
    request: QuestionGenerationRequest
  ): Promise<GeneratedQuestion[]> {
    this.logger.log(`Generando ${request.questionCount} preguntas desde archivo`);

    const specificTopics = await this.topicGenerator.extractTopicsFromContent(
      fileContent,
      request.questionCount
    );

    const questions: GeneratedQuestion[] = [];

    for (let i = 0; i < request.questionCount; i++) {
      const specificTopic = specificTopics[i % specificTopics.length];
      const singleRequest = {
        ...request,
        questionCount: 1,
        specificTopic,
        fileContent
      };

      const generated = await this.aiProviderService.generateQuestions(singleRequest, 1);
      questions.push(...generated);
    }

    this.logger.log(`Generadas ${questions.length} preguntas desde archivo`);
    return questions;
  }
}