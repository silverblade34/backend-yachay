import { Injectable } from '@nestjs/common';
import { QuestionType } from '../../learning/enum/question-type.enum';

export interface QuestionTypeMetadata {
  type: QuestionType;
  name: string;
  description: string;
  difficulty: string;
  recommended: boolean;
}

@Injectable()
export class QuestionTypeMetadataService {
  private readonly names: Record<QuestionType, string> = {
    [QuestionType.MULTIPLE_CHOICE]: 'Opción Múltiple',
    [QuestionType.MULTIPLE_SELECT]: 'Selección Múltiple',
    [QuestionType.TRUE_FALSE]: 'Verdadero/Falso',
    // [QuestionType.FILL_BLANK]: 'Completar Espacios',
    // [QuestionType.DRAG_DROP]: 'Arrastrar y Soltar',
    // [QuestionType.SEQUENCE_ORDER]: 'Ordenar Secuencia',
    [QuestionType.SELECT_TEXT]: 'Seleccionar Texto',
  };

  private readonly descriptions: Record<QuestionType, string> = {
    [QuestionType.MULTIPLE_CHOICE]: 'Pregunta con 4 opciones, una correcta',
    [QuestionType.MULTIPLE_SELECT]: 'Pregunta con múltiples respuestas correctas',
    [QuestionType.TRUE_FALSE]: 'Afirmación para evaluar como verdadera o falsa',
    // [QuestionType.FILL_BLANK]: 'Completar espacios en blanco en el texto',
    // [QuestionType.DRAG_DROP]: 'Arrastrar opciones a los espacios correctos',
    // [QuestionType.SEQUENCE_ORDER]: 'Ordenar elementos en secuencia lógica',
    [QuestionType.SELECT_TEXT]: 'Seleccionar parte correcta de un texto',
  };

  private readonly difficulties: Record<QuestionType, string> = {
    [QuestionType.TRUE_FALSE]: 'Fácil',
    [QuestionType.MULTIPLE_CHOICE]: 'Medio',
    [QuestionType.MULTIPLE_SELECT]: 'Medio-Alto',
    // [QuestionType.FILL_BLANK]: 'Medio',
    // [QuestionType.DRAG_DROP]: 'Medio-Alto',
    // [QuestionType.SEQUENCE_ORDER]: 'Alto',
    [QuestionType.SELECT_TEXT]: 'Medio',
  };

  private readonly recommended: QuestionType[] = [
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.TRUE_FALSE,
    // QuestionType.FILL_BLANK,
    // QuestionType.DRAG_DROP
  ];

  getAllQuestionTypes(): QuestionTypeMetadata[] {
    return Object.values(QuestionType).map(type => ({
      type,
      name: this.names[type] || type,
      description: this.descriptions[type] || 'Tipo de pregunta personalizado',
      difficulty: this.difficulties[type] || 'Variable',
      recommended: this.recommended.includes(type)
    }));
  }
}