export interface QuestionHint {
  level: 'subtle' | 'moderate' | 'obvious';
  text: string;
  pointsDeduction: number;
}
