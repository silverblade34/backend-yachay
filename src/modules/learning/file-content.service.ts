import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import * as AdmZip from 'adm-zip';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class FileContentService {
  private readonly logger = new Logger(FileContentService.name);

  /**
   * Extrae el contenido de texto de un archivo según su tipo
   */
  async extractContent(file: Express.Multer.File): Promise<string> {
    const mimeType = file.mimetype;
    
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractPdfContent(file.buffer);
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractWordContent(file.buffer);
        
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        case 'application/vnd.ms-powerpoint':
          return await this.extractPptContent(file.buffer);
        
        default:
          throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
      }
    } catch (error) {
      this.logger.error(`Error extrayendo contenido del archivo:`, error.message);
      throw error;
    }
  }

  /**
   * Extrae texto de un PDF usando pdf-parse
   */
  private async extractPdfContent(buffer: Buffer): Promise<string> {
    try {
      // Convertir Buffer a Uint8Array
      const uint8Array = new Uint8Array(buffer);
      
      // Crear instancia del parser
      const parser = new PDFParse({ data: uint8Array });
      
      // Extraer el texto
      const result = await parser.GetText();
      
      if (!result.text || result.text.trim().length === 0) {
        throw new Error('El PDF no contiene texto extraíble');
      }
      
      return this.cleanText(result.text);
    } catch (error) {
      this.logger.error('Error extrayendo contenido del PDF:', error.message);
      throw new Error('No se pudo extraer el contenido del PDF');
    }
  }

  /**
   * Extrae texto de un documento Word
   */
  private async extractWordContent(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return this.cleanText(result.value);
    } catch (error) {
      this.logger.error('Error extrayendo contenido de Word:', error.message);
      throw new Error('No se pudo extraer el contenido del documento Word');
    }
  }

  /**
   * Extrae texto de una presentación PowerPoint
   */
  private async extractPptContent(buffer: Buffer): Promise<string> {
    try {
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();
      
      let content = '';
      let slideNumber = 0;
      
      // Ordenar las slides por nombre para mantener el orden correcto
      const slideEntries = zipEntries
        .filter(entry => 
          entry.entryName.startsWith('ppt/slides/slide') && 
          entry.entryName.endsWith('.xml')
        )
        .sort((a, b) => a.entryName.localeCompare(b.entryName));
      
      slideEntries.forEach(entry => {
        slideNumber++;
        const slideContent = entry.getData().toString('utf8');
        
        content += `\n\n=== Slide ${slideNumber} ===\n`;
        
        // Extraer texto entre tags <a:t> (texto en PowerPoint)
        const textMatches = slideContent.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
        if (textMatches) {
          textMatches.forEach(match => {
            const text = match.replace(/<a:t[^>]*>|<\/a:t>/g, '');
            // Decodificar entidades HTML
            const decodedText = this.decodeHtmlEntities(text);
            content += decodedText + '\n';
          });
        }
      });
      
      if (content.trim().length === 0) {
        throw new Error('No se encontró texto en la presentación');
      }
      
      return this.cleanText(content);
    } catch (error) {
      this.logger.error('Error extrayendo contenido de PowerPoint:', error.message);
      throw new Error('No se pudo extraer el contenido de la presentación PowerPoint');
    }
  }

  /**
   * Decodifica entidades HTML comunes
   */
  private decodeHtmlEntities(text: string): string {
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&apos;': "'",
      '&nbsp;': ' '
    };
    
    return text.replace(/&[^;]+;/g, match => entities[match] || match);
  }

  /**
   * Limpia y normaliza el texto extraído
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalizar saltos de línea
      .replace(/\n{3,}/g, '\n\n') // Reducir múltiples saltos de línea
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  }

  /**
   * Valida que el contenido extraído sea suficiente para generar preguntas
   */
  validateContent(content: string, minWords: number = 50): boolean {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    return wordCount >= minWords;
  }

  /**
   * Trunca el contenido si es demasiado largo para la IA
   */
  truncateContent(content: string, maxTokens: number = 6000): string {
    // Aproximadamente 4 caracteres por token
    const maxChars = maxTokens * 4;
    
    if (content.length <= maxChars) {
      return content;
    }

    // Truncar pero intentar mantener párrafos completos
    const truncated = content.substring(0, maxChars);
    const lastParagraph = truncated.lastIndexOf('\n\n');
    
    if (lastParagraph > maxChars * 0.8) {
      return truncated.substring(0, lastParagraph);
    }
    
    return truncated;
  }

  /**
   * Obtiene información del archivo
   */
  getFileInfo(file: Express.Multer.File): {
    name: string;
    size: number;
    type: string;
    sizeInMB: string;
  } {
    return {
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    };
  }
}