import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Query,
    Put,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { TriviaService } from './trivia.service';
import { CreateTriviaDto } from './dto/create-trivia.dto';
import { GetTriviasDto } from './dto/get-trivias.dto';

@Controller('trivias')
export class TriviaController {
    constructor(private readonly triviaService: TriviaService) { }

    @Get()
    async findAll(@Query() filters: GetTriviasDto) {
        return await this.triviaService.findAll(filters);
    }

    @Get('random')
    async findRandom(@Query('cantidad', ParseIntPipe) cantidad: number = 10) {
        return await this.triviaService.findRandom(cantidad);
    }

    @Get('categorias')
    async getCategories() {
        return await this.triviaService.getCategories();
    }

    @Get('estadisticas')
    async getStats() {
        return await this.triviaService.getStats();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: string) {
        return await this.triviaService.findOne(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createTriviaDtos: CreateTriviaDto[]) {
        return await this.triviaService.createMany(createTriviaDtos);
    }

    @Post('seed')
    @HttpCode(HttpStatus.OK)
    async seed() {
        await this.triviaService.seed();
        return { message: 'Trivias inicializadas correctamente' };
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: string,
        @Body() updateTriviaDto: Partial<CreateTriviaDto>,
    ) {
        return await this.triviaService.update(id, updateTriviaDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: string) {
        await this.triviaService.remove(id);
    }
}
