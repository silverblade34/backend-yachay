import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { GeneratedQuestion } from '../../quiz/interfaces/generated-question.interface';
import { QuestionGenerationRequest } from '../../quiz/interfaces/question-generation-request.interface';

export interface CacheEntry {
  questions: GeneratedQuestion[];
  timestamp: number;
  hits: number;
}

@Injectable()
export class QuestionCacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly maxCacheSize = 1000;
  private readonly maxCacheAge = 24 * 60 * 60 * 1000; // 24 horas

  get(request: QuestionGenerationRequest): GeneratedQuestion[] | null {
    const key = this.generateKey(request);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.maxCacheAge) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.questions;
  }

  set(request: QuestionGenerationRequest, questions: GeneratedQuestion[]): void {
    const key = this.generateKey(request);

    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      questions,
      timestamp: Date.now(),
      hits: 0
    });
  }

  has(request: QuestionGenerationRequest): boolean {
    const key = this.generateKey(request);
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        questionCount: entry.questions.length,
        age: Date.now() - entry.timestamp,
        hits: entry.hits
      }))
    };
  }

  private generateKey(request: QuestionGenerationRequest): string {
    const keyObject = {
      topic: request.topic,
      description: request.description ?? '',
      focusAreas: request.focusAreas?.sort() ?? [],
    };

    const keyString = JSON.stringify(keyObject);
    return crypto.createHash('sha256').update(keyString).digest('hex');
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }
}