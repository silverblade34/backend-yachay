import { Injectable, Logger } from '@nestjs/common';
import { AIProvider, AIProviderConfig } from '../services/ai-provider.service';
import { GeneratedQuestion } from '../../quiz/interfaces/generated-question.interface';
import { QuestionGenerationRequest } from '../../quiz/interfaces/question-generation-request.interface';
import { PromptBuilderService } from '../services/prompt-builder.service';
import { QuestionParserService } from '../services/question-parser.service';
@Injectable()
export class MistralProvider extends AIProvider {
  private readonly logger = new Logger(MistralProvider.name);
  private readonly apiKey = process.env.OPENROUTER_API_KEY;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  readonly config: AIProviderConfig = {
    name: 'mistral',
    priority: 5,
    maxConcurrent: 3
  };

  constructor(
    private promptBuilder: PromptBuilderService,
    private questionParser: QuestionParserService
  ) {
    super();
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generateSingleQuestion(
    request: QuestionGenerationRequest,
    questionNumber: number
  ): Promise<GeneratedQuestion | null> {
    if (!this.isAvailable()) return null;

    try {
      const prompt = request.fileContent
        ? this.promptBuilder.buildFileBasedPrompt(request, questionNumber)
        : this.promptBuilder.buildStandardPrompt(request, questionNumber);

      const response = await this.callAPI(prompt);
      const questions = this.questionParser.parseQuestions(response, request, this.config.name);

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
      this.logger.error(
        `Error generating question ${questionNumber} with ${this.config.name}:`,
        error.message
      );
      return null;
    }
  }

  private async callAPI(prompt: string): Promise<string> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Quiz Generator'
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'Eres un generador de preguntas de quiz. Siempre responde con JSON válido que contenga exactamente una pregunta en el formato especificado.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Empty response from API');
    }

    return content;
  }
}