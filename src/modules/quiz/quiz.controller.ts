import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Req } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateQuizResultDto } from './dto/create-quiz-result.dto';

@UseGuards(JwtAuthGuard)
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) { }

  @Post('registered')
  async createQuizResult(
    @Body() createQuizResultDto: CreateQuizResultDto,
    @Req() req: any // O usar tu decorador personalizado para obtener el usuario
  ) {
    const userId = req.user?.id; // Ajusta según tu implementación de auth
    return this.quizService.createQuizResult(createQuizResultDto, userId);
  }

  @Get('all')
  findAll(@Req() req: any) {
    return this.quizService.findAll(req.user?.id);
  }
}
