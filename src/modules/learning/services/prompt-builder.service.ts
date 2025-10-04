import { Injectable } from '@nestjs/common';
import { QuestionGenerationRequest } from '../../quiz/interfaces/question-generation-request.interface';
import { QuestionType } from '../../quiz/interfaces/generated-question.interface';

@Injectable()
export class PromptBuilderService {
  buildStandardPrompt(request: QuestionGenerationRequest, questionNumber: number): string {
    const questionTypesText = this.formatQuestionTypes(request.questionTypes);
    const focusSection = this.buildFocusSection(request);

    return `🎓 YACHAY - Genera 1 pregunta de quiz en JSON.

📋 SPECS: "${request.topic}" | ${request.difficulty} | ${request.language}
Tipos: ${questionTypesText}

${focusSection}

${this.getQuestionTypesReference()}

🧠 NIVELES: Recordar(20%)→Comprender(25%)→Aplicar(25%)→Analizar(20%)→Evaluar(10%)

${this.getJSONTemplate(questionNumber)}

🚨 SOLO JSON válido. Exactamente 1 pregunta.`;
  }

  buildFileBasedPrompt(request: QuestionGenerationRequest, questionNumber: number): string {
    const questionTypesText = request.questionTypes
      .map(q => q.type)
      .join(' | ');

    const maxContentLength = 3000;
    const truncatedContent = request.fileContent && request.fileContent.length > maxContentLength
      ? request.fileContent.substring(0, maxContentLength) + '...'
      : request.fileContent;

    return `🎓 YACHAY - Genera 1 pregunta de quiz basada en el CONTENIDO PROPORCIONADO.

📄 CONTENIDO DEL DOCUMENTO:
${truncatedContent}

📋 SPECS: "${request.topic}" | ${request.difficulty} | ${request.language}
Tipos: ${questionTypesText}

${request.specificTopic ? `🎯 ENFOQUE ESPECÍFICO: "${request.specificTopic}"\n` : ''}

🚨 IMPORTANTE: 
- La pregunta DEBE estar basada en información EXPLÍCITA del contenido proporcionado
- NO inventes información que no esté en el documento
- Usa citas o referencias del contenido cuando sea relevante
- La respuesta correcta debe estar claramente respaldada por el contenido

${this.getQuestionTypesReference()}

${this.getJSONTemplate(questionNumber)}

🚨 SOLO JSON válido. Exactamente 1 pregunta basada en el contenido.`;
  }

  private formatQuestionTypes(types: Array<{ type: QuestionType; percentage: number }>): string {
    return types.map(t => `${t.type}(${t.percentage}%)`).join(', ');
  }

  private buildFocusSection(request: QuestionGenerationRequest): string {
    let section = '📍 ENFOQUE ESPECÍFICO:\n';

    if (request.description) {
      section += `Descripción: "${request.description}"\n`;
    }

    if (request.focusAreas?.length) {
      section += `🎯 Áreas prioritarias: ${request.focusAreas.join(', ')}\n`;
    }

    if (request.specificTopic) {
      section += `🤖 Enfoque específico: "${request.specificTopic}"\n`;
    }

    if (request.focusAreas?.length && request.specificTopic) {
      section += '⚠️ PRIORIDAD: Crear pregunta sobre el enfoque específico dentro del contexto de las áreas prioritarias\n';
    } else if (request.focusAreas?.length) {
      section += '⚠️ 70% de preguntas deben abordar las áreas prioritarias\n';
    } else if (request.specificTopic) {
      section += '⚠️ Crear pregunta específicamente sobre el enfoque proporcionado\n';
    }

    return section;
  }

  private getQuestionTypesReference(): string {
    return `🎯 TIPOS:
multiple_choice(4 opts,1 correcta)|multiple_select(4-6 opts,2-3 correctas)|true_false|fill_blank(1-3 espacios)|drag_drop|sequence_order(4-6 elementos)|match_pairs(4-6 pares)|select_text|categorize(6-8 elementos,2-3 categorías)|short_answer(1-3 palabras)`;
  }

  private getJSONTemplate(questionNumber: number): string {
    return `📊 JSON REQUERIDO:
{
  "questions": [{
    "id": "${questionNumber}_${Date.now()}",
    "question": "Texto pregunta",
    "type": "tipo_pregunta",
    "options": [{"id":"opt_1","text":"Texto","isCorrect":boolean,"order":1,"explanation":"Por qué"}],
    "correctAnswers": ["opt_1"],
    "hints": [
      {"level":"subtle","text":"Pista sutil"},
      {"level":"moderate","text":"Pista moderada"},
      {"level":"obvious","text":"Pista obvia"}
    ],
    "explanation": {"brief":"Breve","detailed":"Detallada","relatedConcepts":["concepto1"]},
    "tags": ["tag1","tag2"]
  }]
}`;
  }
}
