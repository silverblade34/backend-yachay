import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { QuestionsBank } from '../quiz/entities/question-banks.entity';
import { QuestionGenerationRequest } from './interfaces/question-generation-request.interface';
import { GeneratedQuestion } from './interfaces/generated-question.interface';
import { QuestionType } from '../learning/enum/question-type.enum';
import { DifficultyLevel } from '../learning/enum/difficulty-level.enum';
import { QuestionOption } from '../learning/interfaces/question-option.interface';
import { QuestionHint } from '../learning/interfaces/question-hint.interface';
import { QuestionExplanation } from '../learning/interfaces/question-explanation.interface';

@Injectable()
export class QuestionsBankService {
    private readonly logger = new Logger(QuestionsBankService.name);

    constructor(
        @InjectRepository(QuestionsBank)
        private questionsBankRepository: Repository<QuestionsBank>,
    ) { }

    /**
     * Busca preguntas existentes que coincidan con los criterios
     */
    async findMatchingQuestions(
        request: QuestionGenerationRequest,
        limit: number
    ): Promise<GeneratedQuestion[]> {
        try {
            const queryBuilder = this.questionsBankRepository.createQueryBuilder('qb');

            // Criterios básicos de búsqueda
            queryBuilder
                .where('qb.topic ILIKE :topic', { topic: `%${request.topic}%` })
                .andWhere('qb.difficulty = :difficulty', { difficulty: request.difficulty })
                .andWhere('qb.language = :language', { language: request.language });

            // Si hay tipos específicos de pregunta, filtrar por ellos
            if (request.questionTypes?.length > 0) {
                const types = request.questionTypes.map(qt => qt.type);
                queryBuilder.andWhere('qb.type IN (:...types)', { types });
            }

            // Si hay áreas de enfoque, buscar preguntas que las incluyan
            if (request.focusAreas != undefined && request.focusAreas.length > 0) {
                queryBuilder.andWhere('qb.focus_areas && :focusAreas', {
                    focusAreas: request.focusAreas
                });
            }

            // Búsqueda mejorada por descripción con tokenización
            if (request.description) {
                const keywords = this.extractKeywords(request.description);

                if (keywords.length > 0) {
                    // Crear condiciones OR para cada palabra clave
                    const descriptionConditions = keywords
                        .map((_, index) =>
                            `(qb.description ILIKE :keyword${index} OR qb.tags::text ILIKE :keyword${index})`
                        )
                        .join(' OR ');

                    queryBuilder.andWhere(`(${descriptionConditions})`);

                    // Añadir parámetros para cada palabra clave
                    keywords.forEach((keyword, index) => {
                        queryBuilder.setParameter(`keyword${index}`, `%${keyword}%`);
                    });
                }
            }

            // Ordenar por uso menos frecuente y más reciente para diversidad
            queryBuilder
                .orderBy('qb.usage_count', 'ASC')
                .addOrderBy('qb.created_at', 'DESC')
                .limit(limit);

            const questions = await queryBuilder.getMany();

            // Si hay descripción, filtrar por mínimo de coincidencias
            let filteredQuestions = questions;
            if (request.description && questions.length > 0) {
                const keywords = this.extractKeywords(request.description);
                filteredQuestions = this.filterByKeywordMatches(questions, keywords, 2);
            }

            // Convertir a formato GeneratedQuestion
            const generatedQuestions = filteredQuestions.map(this.convertToGeneratedQuestion);

            // Actualizar contadores de uso en paralelo
            if (filteredQuestions.length > 0) {
                this.updateUsageStats(filteredQuestions.map(q => q.id));
            }

            return generatedQuestions;
        } catch (error) {
            this.logger.error('Error finding matching questions:', error);
            return [];
        }
    }

    /**
     * Extrae palabras clave de un texto, removiendo stopwords y normalizando
     */
    private extractKeywords(text: string): string[] {
        // Stopwords comunes en español e inglés
        const stopwords = new Set([
            // Español
            'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
            'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
            'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
            'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy', 'sin',
            'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo', 'yo',
            'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
            'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella',
            'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa',
            'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte',
            'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar',
            // Inglés
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it',
            'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but',
            'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will',
            'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
            'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can',
            'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into',
            'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than'
        ]);

        // Normalizar: minúsculas, remover caracteres especiales, separar por espacios
        const normalized = text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^\w\s]/g, ' ') // Remover puntuación
            .split(/\s+/)
            .filter(word =>
                word.length > 2 && // Palabras de al menos 3 caracteres
                !stopwords.has(word) && // No es stopword
                !/^\d+$/.test(word) // No es solo números
            );

        // Remover duplicados
        return [...new Set(normalized)];
    }

    /**
     * Filtra preguntas que tengan al menos minMatches coincidencias de keywords
     */
    private filterByKeywordMatches(
        questions: any[],
        keywords: string[],
        minMatches: number
    ): any[] {
        if (keywords.length === 0) return questions;

        return questions.filter(question => {
            const questionText = `${question.description || ''} ${JSON.stringify(question.tags || [])}`.toLowerCase();

            const matches = keywords.filter(keyword =>
                questionText.includes(keyword)
            ).length;

            return matches >= minMatches;
        });
    }

    /**
     * Guarda nuevas preguntas en el banco
     */
    async saveQuestions(
        questions: GeneratedQuestion[],
        request: QuestionGenerationRequest
    ): Promise<GeneratedQuestion[]> {
        if (!questions.length) return [];

        try {
            const questionsToSave = questions.map(question => {
                const questionBank = new QuestionsBank();
                questionBank.questionId = question.id;
                questionBank.question = question.question;
                questionBank.type = question.type;
                questionBank.difficulty = question.difficulty;
                questionBank.topic = question.topic;
                questionBank.language = question.language;
                questionBank.options = question.options;
                questionBank.correctAnswers = question.correctAnswers;
                questionBank.hints = question.hints;
                questionBank.explanation = question.explanation;
                questionBank.tags = question.tags;
                questionBank.focusAreas = request.focusAreas || [];
                questionBank.description = request.description || "";
                return questionBank;
            });

            const savedQuestions = await this.questionsBankRepository.save(questionsToSave);

            this.logger.log(`Guardadas ${savedQuestions.length} preguntas. IDs: ${savedQuestions.map(q => q.id).slice(0, 3).join(', ')}...`);

            return savedQuestions.map(saved => ({
                id: saved.id,
                question: saved.question,
                type: saved.type as QuestionType,
                difficulty: saved.difficulty as DifficultyLevel,
                topic: saved.topic,
                language: saved.language,
                options: saved.options as QuestionOption[],
                correctAnswers: saved.correctAnswers,
                hints: saved.hints as QuestionHint[],
                explanation: saved.explanation as QuestionExplanation,
                tags: saved.tags
            }));
        } catch (error) {
            this.logger.error('Error saving questions to bank:', error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas del banco de preguntas
     */
    async getBankStats(): Promise<{
        totalQuestions: number;
        questionsByDifficulty: Record<string, number>;
        questionsByType: Record<string, number>;
        mostUsedTopics: Array<{ topic: string; count: number }>;
    }> {
        try {
            const [
                totalQuestions,
                difficultyStats,
                typeStats,
                topicStats
            ] = await Promise.all([
                this.questionsBankRepository.count(),
                this.questionsBankRepository
                    .createQueryBuilder('qb')
                    .select('qb.difficulty', 'difficulty')
                    .addSelect('COUNT(*)', 'count')
                    .groupBy('qb.difficulty')
                    .getRawMany(),
                this.questionsBankRepository
                    .createQueryBuilder('qb')
                    .select('qb.type', 'type')
                    .addSelect('COUNT(*)', 'count')
                    .groupBy('qb.type')
                    .getRawMany(),
                this.questionsBankRepository
                    .createQueryBuilder('qb')
                    .select('qb.topic', 'topic')
                    .addSelect('COUNT(*)', 'count')
                    .groupBy('qb.topic')
                    .orderBy('COUNT(*)', 'DESC')
                    .limit(10)
                    .getRawMany()
            ]);

            return {
                totalQuestions,
                questionsByDifficulty: Object.fromEntries(
                    difficultyStats.map(stat => [stat.difficulty, parseInt(stat.count)])
                ),
                questionsByType: Object.fromEntries(
                    typeStats.map(stat => [stat.type, parseInt(stat.count)])
                ),
                mostUsedTopics: topicStats.map(stat => ({
                    topic: stat.topic,
                    count: parseInt(stat.count)
                }))
            };
        } catch (error) {
            this.logger.error('Error getting bank stats:', error);
            return {
                totalQuestions: 0,
                questionsByDifficulty: {},
                questionsByType: {},
                mostUsedTopics: []
            };
        }
    }

    private convertToGeneratedQuestion(questionBank: QuestionsBank): GeneratedQuestion {
        return {
            id: questionBank.id,
            question: questionBank.question,
            type: questionBank.type as any,
            difficulty: questionBank.difficulty as any,
            topic: questionBank.topic,
            language: questionBank.language,
            options: questionBank.options,
            correctAnswers: questionBank.correctAnswers,
            hints: questionBank.hints,
            explanation: questionBank.explanation,
            tags: questionBank.tags
        };
    }

    private async updateUsageStats(questionIds: string[]): Promise<void> {
        try {
            await this.questionsBankRepository
                .createQueryBuilder()
                .update(QuestionsBank)
                .set({
                    usageCount: () => 'usage_count + 1',
                    lastUsedAt: new Date()
                })
                .whereInIds(questionIds)
                .execute();
        } catch (error) {
            this.logger.warn('Error updating usage stats:', error);
        }
    }
}