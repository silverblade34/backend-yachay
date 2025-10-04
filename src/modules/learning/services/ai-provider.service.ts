import { Injectable } from '@nestjs/common';
import { GeneratedQuestion } from '../../quiz/interfaces/generated-question.interface';
import { QuestionGenerationRequest } from '../../quiz/interfaces/question-generation-request.interface';

export interface AIProviderConfig {
  name: string;
  priority: number;
  maxConcurrent: number;
}

export abstract class AIProvider {
  abstract readonly config: AIProviderConfig;
  
  abstract generateSingleQuestion(
    request: QuestionGenerationRequest,
    questionNumber: number
  ): Promise<GeneratedQuestion | null>;
  
  abstract isAvailable(): boolean;
}

@Injectable()
export class AIProviderService {
  private providers: AIProvider[] = [];

  registerProvider(provider: AIProvider): void {
    this.providers.push(provider);
    this.providers.sort((a, b) => b.config.priority - a.config.priority);
  }

  getAvailableProviders(): AIProvider[] {
    return this.providers.filter(p => p.isAvailable());
  }

  getProvider(name: string): AIProvider | undefined {
    return this.providers.find(p => p.config.name === name);
  }

  async generateQuestions(
    request: QuestionGenerationRequest,
    count: number
  ): Promise<GeneratedQuestion[]> {
    const availableProviders = this.getAvailableProviders();
    if (availableProviders.length === 0) {
      throw new Error('No AI providers available');
    }

    const promises: Promise<GeneratedQuestion | null>[] = [];
    
    for (let i = 0; i < count; i++) {
      const provider = availableProviders[i % availableProviders.length];
      promises.push(
        provider.generateSingleQuestion(
          { ...request, questionCount: 1 },
          i + 1
        )
      );
    }

    const results = await Promise.allSettled(promises);
    return results
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .filter((q): q is GeneratedQuestion => q !== null);
  }
}