import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GeneratedQuestion } from './interfaces/generated-question.interface';
import { QuestionGenerationRequest } from './interfaces/question-generation-request.interface';
import { QuestionsBank } from './entities/question-banks.entity';

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

            // Si hay descripción, buscar en tags o descripción
            if (request.description) {
                queryBuilder.andWhere(
                    '(qb.description ILIKE :description OR qb.tags::text ILIKE :description)',
                    { description: `%${request.description}%` }
                );
            }

            // Ordenar por uso menos frecuente y más reciente para diversidad
            queryBuilder
                .orderBy('qb.usage_count', 'ASC')
                .addOrderBy('qb.created_at', 'DESC')
                .limit(limit);

            const questions = await queryBuilder.getMany();

            this.logger.log(`Found ${questions.length} matching questions in bank`);

            // Convertir a formato GeneratedQuestion y actualizar estadísticas de uso
            const generatedQuestions = questions.map(this.convertToGeneratedQuestion);

            // Actualizar contadores de uso en paralelo
            if (questions.length > 0) {
                this.updateUsageStats(questions.map(q => q.id));
            }

            return generatedQuestions;
        } catch (error) {
            this.logger.error('Error finding matching questions:', error);
            return [];
        }
    }

    /**
     * Guarda nuevas preguntas en el banco
     */
    async saveQuestions(
        questions: GeneratedQuestion[],
        request: QuestionGenerationRequest
    ): Promise<void> {
        if (!questions.length) return;

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

            // Usar upsert para evitar duplicados por questionId
            await this.questionsBankRepository.upsert(questionsToSave, ['questionId']);

            this.logger.log(`Saved ${questions.length} questions to bank`);
        } catch (error) {
            this.logger.error('Error saving questions to bank:', error);
            // No lanzamos el error para no afectar el flujo principal
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
            id: questionBank.questionId,
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