import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIProviderConfig } from '../services/ai-provider.service';
import { GeneratedQuestion } from '../../quiz/interfaces/generated-question.interface';
import { QuestionGenerationRequest } from '../../quiz/interfaces/question-generation-request.interface';
import { PromptBuilderService } from '../services/prompt-builder.service';
import { QuestionParserService } from '../services/question-parser.service';

@Injectable()
export class GeminiProvider extends AIProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly instances: GoogleGenerativeAI[];
  private readonly models: any[];
  private currentIndex = 0;

  readonly config: AIProviderConfig = {
    name: 'gemini',
    priority: 10,
    maxConcurrent: 5
  };

  constructor(
    private promptBuilder: PromptBuilderService,
    private questionParser: QuestionParserService
  ) {
    super();
    const apiKeys = [
      process.env.GEMINI_API_KEY_6,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
    ].filter(key => key);

    this.instances = apiKeys.map(key => new GoogleGenerativeAI(key!));
    this.models = this.instances.map(genAI =>
      genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        }
      })
    );
  }

  isAvailable(): boolean {
    return this.models.length > 0;
  }

  async generateSingleQuestion(
    request: QuestionGenerationRequest,
    questionNumber: number
  ): Promise<GeneratedQuestion | null> {
    if (!this.isAvailable()) return null;

    try {
      const model = this.getNextModel();
      const prompt = request.fileContent
        ? this.promptBuilder.buildFileBasedPrompt(request, questionNumber)
        : this.promptBuilder.buildStandardPrompt(request, questionNumber);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const questions = this.questionParser.parseQuestions(text, request, this.config.name);
      
      if (questions[0]) {
        // Agregar metadata del provider
        return {
          ...questions[0],
          generatedBy: this.config.name,
          generatedAt: new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      this.logger.warn(
        `Error generating question ${questionNumber} with ${this.config.name}:`,
        error.message
      );
      return null;
    }
  }

  private getNextModel(): any {
    const model = this.models[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.models.length;
    return model;
  }
}
