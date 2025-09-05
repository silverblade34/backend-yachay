import { QuestionExplanation } from "./question-explanation.interface";
import { QuestionHint } from "./question-hint.interface";
import { QuestionOption } from "./question-option.interface";

export type QuestionType =
    | 'multiple_choice'      // Opción múltiple tradicional
    | 'multiple_select'      // Múltiples respuestas correctas
    | 'true_false'          // Verdadero/Falso
    | 'fill_blank'          // Completar espacios
    | 'drag_drop'           // Arrastrar y soltar opciones en espacios
    | 'sequence_order'      // Ordenar elementos en secuencia correcta
    | 'match_pairs'         // Emparejar conceptos
    | 'select_text'         // Seleccionar texto correcto de un párrafo
    | 'categorize'          // Clasificar elementos en categorías
    | 'short_answer'        // Respuesta corta (validación por IA)
    | 'code_completion'     // Para temas de programación

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface GeneratedQuestion {
    id: string;
    question: string;
    type: QuestionType;
    topic: string;
    subtopic?: string;
    difficulty: DifficultyLevel;
    language: string;

    // Opciones y respuestas
    options: QuestionOption[];
    correctAnswers: string[];

    // Sistema de ayudas
    hints: QuestionHint[];
    explanation: QuestionExplanation;

    // Metadatos para personalización
    tags: string[];

}