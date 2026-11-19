import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
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

  // =========================================================================
  // SPRINT 1: CRUD de Publicaciones y Carga de Imagen
  // =========================================================================

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
    return this.publicacionesService.crear(
      datos,
      this.extraerUsuarioId(req),
      archivo,
    );
  }

  @Get()
  listar(
    @Query('orden') orden?: 'fecha' | 'likes',
    @Query('usuarioId') usuarioId?: string,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    return this.publicacionesService.listar({
      orden,
      usuarioId,
      limit: +limit,
      offset: +offset,
    });
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
    return this.publicacionesService.actualizar(
      id,
      datos,
      this.extraerUsuarioActual(req),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  eliminar(@Param('id') id: string, @Req() req: any) {
    return this.publicacionesService.eliminar(
      id,
      this.extraerUsuarioActual(req),
    );
  }

  // =========================================================================
  // SPRINT 2: Interacciones Sociales (Likes y Alta de Comentarios)
  // =========================================================================

  @Post(':id/like')
  @HttpCode(200)
  toggleLike(@Param('id') id: string, @Req() req: any) {
    return this.publicacionesService.toggleLike(id, this.extraerUsuarioId(req));
  }

  @Post(':id/comentarios')
  @HttpCode(201)
  agregarComentario(
    @Param('id') id: string,
    @Body('texto') texto: string,
    @Req() req: any,
  ) {
    return this.publicacionesService.agregarComentario(
      id,
      texto,
      this.extraerUsuarioId(req),
    );
  }

  // =========================================================================
  // SPRINT 3: Paginación y Edición de Comentarios
  // =========================================================================

  @Get(':id/comentarios')
  @HttpCode(200)
  obtenerComentarios(
    @Param('id') id: string,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ) {
    return this.publicacionesService.obtenerComentarios(id, +limit, +offset);
  }

  @Put(':postId/comentarios/:comentarioId')
  @HttpCode(200)
  modificarComentario(
    @Param('postId') postId: string,
    @Param('comentarioId') comentarioId: string,
    @Body('texto') texto: string,
    @Req() req: any,
  ) {
    return this.publicacionesService.modificarComentario(
      postId,
      comentarioId,
      texto,
      this.extraerUsuarioActual(req),
    );
  }

  // =========================================================================
  // Helpers Internos
  // =========================================================================

  private extraerUsuarioId(req: any): string {
    return req.user.sub || req.user.userId || req.user.id;
  }

  private extraerUsuarioActual(req: any): { userId: string; rol?: string } {
    return {
      userId: this.extraerUsuarioId(req),
      rol: req.user.rol,
    };
  }
}