import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import { CreateCourseModuleDto } from './dto/create-course-module.dto';
import { AddQuizToModuleDto, UpdateCourseModuleDto } from './dto/update-course-module.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CourseModulesService } from './course-modules.service';

@Controller('course-modules')
@UseGuards(JwtAuthGuard)
export class CourseModulesController {
  constructor(private readonly courseModulesService: CourseModulesService) {}

  @Post()
  async create(@Body() createDto: CreateCourseModuleDto, @Req() req: any) {
    try {
      const userId = req.user?.id;
      return await this.courseModulesService.create(createDto, userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al crear el módulo',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  async findAll(@Query('public') isPublic?: string, @Req() req?: any) {
    const userId = req.user?.id;
    const publicFilter = isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
    
    return await this.courseModulesService.findAll(
      publicFilter === undefined ? userId : undefined,
      publicFilter
    );
  }

  @Get('my-modules')
  async getMyModules(@Req() req: any) {
    const userId = req.user?.id;
    return await this.courseModulesService.findAll(userId);
  }

  @Get('public')
  async getPublicModules(@Query('limit') limit?: number) {
    return await this.courseModulesService.getPublicModules(limit);
  }

  @Get('search')
  async searchModules(@Query('q') query: string) {
    if (!query) {
      throw new HttpException('Query parameter is required', HttpStatus.BAD_REQUEST);
    }
    return await this.courseModulesService.searchModules(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    const module = await this.courseModulesService.findOne(id, userId);
    
    // Incrementar vistas
    await this.courseModulesService.incrementViews(id);
    
    return module;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCourseModuleDto,
    @Req() req: any
  ) {
    const userId = req.user?.id;
    return await this.courseModulesService.update(id, updateDto, userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    await this.courseModulesService.delete(id, userId);
    return { message: 'Módulo eliminado exitosamente' };
  }

  @Post(':id/quizzes')
  async addQuiz(
    @Param('id') moduleId: string,
    @Body() addQuizDto: AddQuizToModuleDto,
    @Req() req: any
  ) {
    const userId = req.user?.id;
    return await this.courseModulesService.addQuiz(
      moduleId,
      addQuizDto.quizId,
      userId
    );
  }

  @Delete(':id/quizzes/:quizId')
  async removeQuiz(
    @Param('id') moduleId: string,
    @Param('quizId') quizId: string,
    @Req() req: any
  ) {
    const userId = req.user?.id;
    return await this.courseModulesService.removeQuiz(moduleId, quizId, userId);
  }

  @Post(':id/follow')
  async followModule(@Param('id') moduleId: string, @Req() req: any) {
    const userId = req.user?.id;
    await this.courseModulesService.followModule(moduleId, userId);
    return { message: 'Módulo seguido exitosamente' };
  }

  @Post(':id/rate')
  async rateModule(
    @Param('id') moduleId: string,
    @Body('rating') rating: number,
    @Req() req: any
  ) {
    if (rating < 1 || rating > 5) {
      throw new HttpException(
        'La calificación debe estar entre 1 y 5',
        HttpStatus.BAD_REQUEST
      );
    }

    const userId = req.user?.id;
    return await this.courseModulesService.rateModule(moduleId, rating, userId);
  }
}