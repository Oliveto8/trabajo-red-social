import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_PORTADA_BYTES } from './portadas.service';
import { PortadasInterceptor } from './portadas.interceptor';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto';
import { ActualizarPublicacionDto } from './dto/actualizar-publicacion.dto';
import { PublicacionesService } from './publicaciones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('publicaciones')
@UseGuards(JwtAuthGuard)
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  @Post()
  @UseInterceptors(
    PortadasInterceptor,
    FileInterceptor('imagen', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_PORTADA_BYTES,
        files: 1,
        fields: 6,
        parts: 8,
        fieldSize: 4096,
        fieldNameSize: 100,
      },
    }),
  )
  crear(
    @Body() datos: CrearPublicacionDto,
    @Req() req: any,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    const usuarioId = req.user.sub || req.user.userId || req.user.id;
    return this.publicacionesService.crear(datos, usuarioId, archivo);
  }

  @Get()
  listar(
    @Query('orden') orden?: 'fecha' | 'likes',
    @Query('usuarioId') usuarioId?: string,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    return this.publicacionesService.listar({ orden, usuarioId, limit: +limit, offset: +offset });
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.publicacionesService.buscar(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() datos: ActualizarPublicacionDto,
    @Req() req: any,
  ) {
    const usuarioActual = {
      userId: req.user.sub || req.user.userId || req.user.id,
      rol: req.user.rol,
    };
    return this.publicacionesService.actualizar(id, datos, usuarioActual);
  }

  @Delete(':id')
  @HttpCode(204)
  eliminar(@Param('id') id: string, @Req() req: any) {
    const usuarioActual = {
      userId: req.user.sub || req.user.userId || req.user.id,
      rol: req.user.rol,
    };
    return this.publicacionesService.eliminar(id, usuarioActual);
  }

  @Post(':id/like')
  @HttpCode(200)
  toggleLike(@Param('id') id: string, @Req() req: any) {
    const usuarioId = req.user.sub || req.user.userId || req.user.id;
    return this.publicacionesService.toggleLike(id, usuarioId);
  }

  @Post(':id/comentarios')
  @HttpCode(201)
  agregarComentario(
    @Param('id') id: string,
    @Body('texto') texto: string,
    @Req() req: any,
  ) {
    const usuarioId = req.user.sub || req.user.userId || req.user.id;
    return this.publicacionesService.agregarComentario(id, texto, usuarioId);
  }
}