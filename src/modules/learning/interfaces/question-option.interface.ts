export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
  explanation?: string; // Explicación específica de por qué esta opción es correcta/incorrecta
}
