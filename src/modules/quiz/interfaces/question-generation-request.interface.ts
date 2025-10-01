import { DifficultyLevel, QuestionType } from "./generated-question.interface";

export interface QuestionGenerationRequest {
    // Básicos
    topic: string;
    description?: string;
    difficulty: DifficultyLevel;
    questionCount: number;
    language: string;

    // Tipos de preguntas con distribución
    questionTypes: Array<{
        type: QuestionType;
        percentage: number; // Porcentaje de este tipo en el quiz
        priority: number;   // Prioridad 1-10
    }>;

    // Personalización avanzada
    focusAreas?: string[];        // Áreas específicas a enfatizar

    specificTopic?: string; // Esto lo generara la IA
}