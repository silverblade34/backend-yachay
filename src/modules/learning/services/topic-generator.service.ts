import { Injectable, Logger } from '@nestjs/common';
import { QuestionGenerationRequest } from '../../quiz/interfaces/question-generation-request.interface';

@Injectable()
export class TopicGeneratorService {
  private readonly logger = new Logger(TopicGeneratorService.name);
  private readonly apiKey = process.env.OPENROUTER_API_KEY;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  async generateDiverseTopics(request: QuestionGenerationRequest): Promise<string[]> {
    const focusContext = request.focusAreas?.length
      ? `\nFocus on: ${request.focusAreas.join(', ')}`
      : '';

    const prompt = `Create ${request.questionCount} specific subtopics for quiz questions about: ${request.topic}

${request.description}${focusContext}
Difficulty: ${request.difficulty} | Language: ${request.language}

IMPORTANT: Return ONLY a JSON array of strings (not an object). Example format:
["Subtopic 1", "Subtopic 2", "Subtopic 3"]

Generate exactly ${request.questionCount} subtopics as a JSON array:`;

    try {
      const topics = await this.callTopicAPI(prompt, request.questionCount);
      return this.cleanTopics(topics, request.questionCount);
    } catch (error) {
      this.logger.warn('Error generating topics with API, using fallback:', error.message);
      return this.generateFallbackTopics(request);
    }
  }

  async extractTopicsFromContent(content: string, count: number): Promise<string[]> {
    const prompt = `Analiza el siguiente contenido y extrae ${count} tópicos específicos para crear preguntas de quiz.

CONTENIDO:
${content.substring(0, 4000)}

Devuelve SOLO un array JSON de strings con los tópicos específicos:
["Tópico 1", "Tópico 2", "Tópico 3"]`;

    try {
      const topics = await this.callTopicAPI(prompt, count);
      return this.cleanTopics(topics, count);
    } catch (error) {
      this.logger.warn('Error extrayendo tópicos, usando fallback:', error.message);
      return this.extractTopicsFromContentFallback(content, count);
    }
  }

  private async callTopicAPI(prompt: string, count: number): Promise<string[]> {
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
            content: 'You are a quiz topic generator. Always respond with a JSON array of strings only, never an object. Format: ["topic1", "topic2", "topic3"]'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 400,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    return this.parseTopicsResponse(content, count);
  }

  private parseTopicsResponse(content: string, count: number): string[] {
    try {
      const parsed = JSON.parse(content);

      // Si es un objeto, convertir a array
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.values(parsed).map(v => String(v));
      }

      // Si es un array, retornar
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item));
      }

      throw new Error('Unexpected JSON format');
    } catch (parseError) {
      // Intentar extraer array con regex
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Intentar extraer objeto y convertir
      const objectMatch = content.match(/\{[\s\S]*?\}/);
      if (objectMatch) {
        const obj = JSON.parse(objectMatch[0]);
        return Object.values(obj).map(v => String(v));
      }

      // Último intento: parsear líneas
      return this.parseTopicsFromLines(content, count);
    }
  }

  private parseTopicsFromLines(content: string, count: number): string[] {
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('-') && !line.startsWith('*'))
      .map(line => line.replace(/^[\d\.\-\*\s]+/, '').replace(/['"]/g, ''))
      .slice(0, count);

    if (lines.length > 0) {
      return lines;
    }

    throw new Error('Could not extract topics from response');
  }

  private cleanTopics(topics: string[], maxCount: number): string[] {
    return topics
      .map(topic => typeof topic === 'string' ? topic.trim() : String(topic).trim())
      .filter(topic => topic.length > 3)
      .slice(0, maxCount);
  }

  private generateFallbackTopics(request: QuestionGenerationRequest): string[] {
    if (request.focusAreas?.length) {
      const expandedTopics: string[] = [];

      request.focusAreas.forEach(area => {
        expandedTopics.push(
          `Basic concepts in ${area}`,
          `Advanced applications of ${area}`,
          `Practical examples of ${area}`,
          `Common challenges in ${area}`
        );
      });

      const shuffled = expandedTopics.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, request.questionCount);
    }

    const baseTopics = [
      `Basic concepts of ${request.topic}`,
      `Advanced applications in ${request.topic}`,
      `Historical development of ${request.topic}`,
      `Current trends in ${request.topic}`,
      `Practical examples of ${request.topic}`,
      `Key principles of ${request.topic}`,
      `Common challenges in ${request.topic}`,
      `Best practices for ${request.topic}`,
      `Future perspectives on ${request.topic}`,
      `Case studies in ${request.topic}`
    ];

    return baseTopics.slice(0, request.questionCount);
  }

  private extractTopicsFromContentFallback(content: string, count: number): string[] {
    const sections = content.split('\n\n').filter(s => s.trim().length > 50);
    return sections.slice(0, count).map((section, i) =>
      `Sección ${i + 1}: ${section.substring(0, 100)}...`
    );
  }
}