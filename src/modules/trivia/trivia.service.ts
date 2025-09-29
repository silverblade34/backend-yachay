import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trivia } from './entities/trivia.entity';
import { CreateTriviaDto } from './dto/create-trivia.dto';
import { GetTriviasDto } from './dto/get-trivias.dto';

@Injectable()
export class TriviaService {
    private readonly logger = new Logger(TriviaService.name);

    constructor(
        @InjectRepository(Trivia)
        private readonly triviaRepository: Repository<Trivia>,
    ) { }

    // Crear varias trivias
    async createMany(createTriviaDtos: CreateTriviaDto[]): Promise<Trivia[]> {
        this.logger.log(`Guardando ${createTriviaDtos.length} trivias`);

        const trivias = this.triviaRepository.create(createTriviaDtos);
        return await this.triviaRepository.save(trivias);
    }

    // Obtener todas las trivias con filtros
    async findAll(filters: GetTriviasDto): Promise<Trivia[]> {
        this.logger.log(`Buscando trivias con filtros: ${JSON.stringify(filters)}`);

        const query = this.triviaRepository.createQueryBuilder('trivia');

        // Filtro por categoría
        if (filters.sCategoria) {
            query.andWhere('trivia.sCategoria = :categoria', {
                categoria: filters.sCategoria
            });
        }

        // Filtro por dificultad
        if (filters.sDificultad) {
            query.andWhere('trivia.sDificultad = :dificultad', {
                dificultad: filters.sDificultad
            });
        }

        // Filtro por estado (por defecto solo activos)
        const estado = filters.nEstado !== undefined ? filters.nEstado : 1;
        query.andWhere('trivia.nEstado = :estado', { estado });

        // Orden aleatorio
        query.orderBy('RANDOM()');

        // Limitar cantidad
        if (filters.nCantidad) {
            query.limit(filters.nCantidad);
        }

        return await query.getMany();
    }

    // Obtener trivias aleatorias
    async findRandom(cantidad: number = 10): Promise<Trivia[]> {
        this.logger.log(`Obteniendo ${cantidad} trivias aleatorias`);

        return await this.triviaRepository
            .createQueryBuilder('trivia')
            .where('trivia.nEstado = :estado', { estado: 1 })
            .orderBy('RANDOM()')
            .limit(cantidad)
            .getMany();
    }

    // Obtener una trivia por ID
    async findOne(id: string): Promise<Trivia> {
        this.logger.log(`Buscando trivia con ID: ${id}`);

        const trivia = await this.triviaRepository.findOne({
            where: { id },
        });

        if (!trivia) {
            throw new NotFoundException(`Trivia con ID ${id} no encontrada`);
        }

        return trivia;
    }

    // Obtener categorías disponibles
    async getCategories(): Promise<string[]> {
        this.logger.log('Obteniendo categorías de trivias');

        const result = await this.triviaRepository
            .createQueryBuilder('trivia')
            .select('DISTINCT trivia.sCategoria', 'categoria')
            .where('trivia.nEstado = :estado', { estado: 1 })
            .getRawMany();

        return result.map(r => r.categoria);
    }

    // Obtener estadísticas
    async getStats() {
        this.logger.log('Obteniendo estadísticas de trivias');

        const total = await this.triviaRepository.count();
        const activas = await this.triviaRepository.count({
            where: { nEstado: 1 }
        });

        const porCategoria = await this.triviaRepository
            .createQueryBuilder('trivia')
            .select('trivia.sCategoria', 'categoria')
            .addSelect('COUNT(*)', 'cantidad')
            .where('trivia.nEstado = :estado', { estado: 1 })
            .groupBy('trivia.sCategoria')
            .getRawMany();

        const porDificultad = await this.triviaRepository
            .createQueryBuilder('trivia')
            .select('trivia.sDificultad', 'dificultad')
            .addSelect('COUNT(*)', 'cantidad')
            .where('trivia.nEstado = :estado', { estado: 1 })
            .groupBy('trivia.sDificultad')
            .getRawMany();

        return {
            total,
            activas,
            inactivas: total - activas,
            porCategoria,
            porDificultad,
        };
    }

    // Actualizar una trivia
    async update(id: string, updateTriviaDto: Partial<CreateTriviaDto>): Promise<Trivia> {
        this.logger.log(`Actualizando trivia con ID: ${id}`);

        const trivia = await this.findOne(id);
        Object.assign(trivia, updateTriviaDto);

        return await this.triviaRepository.save(trivia);
    }

    // Eliminar (soft delete)
    async remove(id: string): Promise<void> {
        this.logger.log(`Desactivando trivia con ID: ${id}`);

        const trivia = await this.findOne(id);
        trivia.nEstado = 0;
        await this.triviaRepository.save(trivia);
    }

    // Seed inicial de trivias
    async seed(): Promise<void> {
        this.logger.log('Iniciando seed de trivias');

        const count = await this.triviaRepository.count();
        if (count > 0) {
            this.logger.log('Ya existen trivias en la base de datos');
            return;
        }

        const trivias: CreateTriviaDto[] = [
            {
                sPregunta: '¿Cuál es el planeta más grande del sistema solar?',
                sOpcionA: 'Tierra',
                sOpcionB: 'Júpiter',
                sOpcionC: 'Saturno',
                sOpcionD: 'Neptuno',
                nRespuestaCorrecta: 1,
                sCategoria: 'Astronomía',
                sDatoInteresante: 'Júpiter es tan grande que podrían caber más de 1,000 Tierras dentro de él',
                sDificultad: 'FACIL',
            },
            {
                sPregunta: '¿En qué año llegó el hombre a la Luna?',
                sOpcionA: '1965',
                sOpcionB: '1969',
                sOpcionC: '1972',
                sOpcionD: '1975',
                nRespuestaCorrecta: 1,
                sCategoria: 'Historia',
                sDatoInteresante: 'Neil Armstrong fue el primero en pisar la Luna el 20 de julio de 1969',
                sDificultad: 'FACIL',
            },
            {
                sPregunta: '¿Cuál es el océano más grande?',
                sOpcionA: 'Atlántico',
                sOpcionB: 'Índico',
                sOpcionC: 'Ártico',
                sOpcionD: 'Pacífico',
                nRespuestaCorrecta: 3,
                sCategoria: 'Geografía',
                sDatoInteresante: 'El Océano Pacífico cubre más del 30% de la superficie terrestre',
                sDificultad: 'FACIL',
            },
            {
                sPregunta: '¿Cuántos huesos tiene el cuerpo humano adulto?',
                sOpcionA: '186',
                sOpcionB: '206',
                sOpcionC: '226',
                sOpcionD: '246',
                nRespuestaCorrecta: 1,
                sCategoria: 'Biología',
                sDatoInteresante: 'Los bebés nacen con aproximadamente 300 huesos, pero se fusionan con el tiempo',
                sDificultad: 'MEDIO',
            },
            {
                sPregunta: '¿Qué gas es más abundante en la atmósfera terrestre?',
                sOpcionA: 'Oxígeno',
                sOpcionB: 'Nitrógeno',
                sOpcionC: 'CO2',
                sOpcionD: 'Hidrógeno',
                nRespuestaCorrecta: 1,
                sCategoria: 'Ciencia',
                sDatoInteresante: 'El nitrógeno representa aproximadamente el 78% de nuestra atmósfera',
                sDificultad: 'MEDIO',
            },
            {
                sPregunta: '¿Cuál es el idioma más hablado del mundo?',
                sOpcionA: 'Inglés',
                sOpcionB: 'Español',
                sOpcionC: 'Mandarín',
                sOpcionD: 'Hindi',
                nRespuestaCorrecta: 2,
                sCategoria: 'Idiomas',
                sDatoInteresante: 'Más de 1,300 millones de personas hablan mandarín como lengua nativa',
                sDificultad: 'FACIL',
            },
            {
                sPregunta: '¿Quién pintó La Mona Lisa?',
                sOpcionA: 'Picasso',
                sOpcionB: 'Van Gogh',
                sOpcionC: 'Da Vinci',
                sOpcionD: 'Dalí',
                nRespuestaCorrecta: 2,
                sCategoria: 'Arte',
                sDatoInteresante: 'Leonardo da Vinci tardó aproximadamente 4 años en pintar La Mona Lisa',
                sDificultad: 'FACIL',
            },
            {
                sPregunta: '¿Cuál es el animal terrestre más rápido?',
                sOpcionA: 'León',
                sOpcionB: 'Guepardo',
                sOpcionC: 'Antílope',
                sOpcionD: 'Caballo',
                nRespuestaCorrecta: 1,
                sCategoria: 'Animales',
                sDatoInteresante: 'El guepardo puede alcanzar velocidades de hasta 120 km/h',
                sDificultad: 'FACIL',
            },
            {
                sPregunta: '¿Cuántos continentes hay en el mundo?',
                sOpcionA: '5',
                sOpcionB: '6',
                sOpcionC: '7',
                sOpcionD: '8',
                nRespuestaCorrecta: 2,
                sCategoria: 'Geografía',
                sDatoInteresante: 'Los 7 continentes son: África, América, Antártida, Asia, Europa, Oceanía',
                sDificultad: 'FACIL',
            },
            {
                sPregunta: '¿Qué planeta es conocido como el planeta rojo?',
                sOpcionA: 'Venus',
                sOpcionB: 'Marte',
                sOpcionC: 'Júpiter',
                sOpcionD: 'Mercurio',
                nRespuestaCorrecta: 1,
                sCategoria: 'Astronomía',
                sDatoInteresante: 'Marte debe su color rojo al óxido de hierro en su superficie',
                sDificultad: 'FACIL',
            },
            {
                sPregunta: '¿Cuál es la montaña más alta del mundo?',
                sOpcionA: 'K2',
                sOpcionB: 'Everest',
                sOpcionC: 'Kilimanjaro',
                sOpcionD: 'Aconcagua',
                nRespuestaCorrecta: 1,
                sCategoria: 'Geografía',
                sDatoInteresante: 'El Monte Everest mide 8,848 metros sobre el nivel del mar',
                sDificultad: 'FACIL',
            },
            {
                sPregunta: '¿Cuántos elementos tiene la tabla periódica actualmente?',
                sOpcionA: '108',
                sOpcionB: '118',
                sOpcionC: '128',
                sOpcionD: '138',
                nRespuestaCorrecta: 1,
                sCategoria: 'Química',
                sDatoInteresante: 'El último elemento añadido fue el Oganesón (Og) en 2016',
                sDificultad: 'MEDIO',
            },
            {
                sPregunta: '¿Qué invento se atribuye a Thomas Edison?',
                sOpcionA: 'Teléfono',
                sOpcionB: 'Bombilla',
                sOpcionC: 'Radio',
                sOpcionD: 'Televisión',
                nRespuestaCorrecta: 1,
                sCategoria: 'Historia',
                sDatoInteresante: 'Edison patentó más de 1,000 inventos durante su vida',
                sDificultad: 'FACIL',
            },
            {
                sPregunta: '¿Cuál es la velocidad de la luz?',
                sOpcionA: '299,792 km/s',
                sOpcionB: '199,792 km/s',
                sOpcionC: '399,792 km/s',
                sOpcionD: '99,792 km/s',
                nRespuestaCorrecta: 0,
                sCategoria: 'Física',
                sDatoInteresante: 'La luz tarda aproximadamente 8 minutos en llegar del Sol a la Tierra',
                sDificultad: 'MEDIO',
            },
            {
                sPregunta: '¿Quién escribió "Cien Años de Soledad"?',
                sOpcionA: 'Vargas Llosa',
                sOpcionB: 'García Márquez',
                sOpcionC: 'Borges',
                sOpcionD: 'Cortázar',
                nRespuestaCorrecta: 1,
                sCategoria: 'Literatura',
                sDatoInteresante: 'Gabriel García Márquez ganó el Premio Nobel de Literatura en 1982',
                sDificultad: 'MEDIO',
            },
        ];

        await this.createMany(trivias);
        this.logger.log(`Seed completado: ${trivias.length} trivias creadas`);
    }
}