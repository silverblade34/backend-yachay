export interface QuestionExplanation {
  brief: string;        // Explicación corta (1-2 líneas)
  detailed: string;     // Explicación completa con contexto
  relatedConcepts?: string[]; // Conceptos relacionados para profundizar
  sources?: string[];   // Fuentes adicionales opcionales
}