import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class FileValidationService {
  private readonly allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ];

  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB
  private readonly minWordCount = 100;

  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new HttpException(
        'Debe proporcionar un archivo',
        HttpStatus.BAD_REQUEST
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new HttpException(
        'Tipo de archivo no soportado. Use PDF, DOCX o PPTX',
        HttpStatus.BAD_REQUEST
      );
    }

    if (file.size > this.maxFileSize) {
      throw new HttpException(
        'El archivo es demasiado grande. Máximo 100MB',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  validateContent(content: string): void {
    const wordCount = content.split(/\s+/).length;
    
    if (wordCount < this.minWordCount) {
      throw new HttpException(
        `El contenido del archivo es insuficiente para generar preguntas (mínimo ${this.minWordCount} palabras)`,
        HttpStatus.BAD_REQUEST
      );
    }
  }
}