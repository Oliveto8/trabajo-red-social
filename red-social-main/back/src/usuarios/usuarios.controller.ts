import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @UseGuards(AdminGuard)
  listar() {
    return this.usuariosService.listar();
  }

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(201)
  crear(@Body() datos: CrearUsuarioDto) {
    return this.usuariosService.crear(datos);
  }

  // Cualquier usuario autenticado puede ver el perfil de otro usuario
  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.usuariosService.obtenerPerfilPorId(id);
  }

  // Cualquier usuario autenticado puede registrar una visita (si no es su propio perfil)
  @Post(':id/visita')
  @HttpCode(204)
  registrarVisita(@Param('id') id: string, @Req() req: any) {
    return this.usuariosService.registrarVisita(id, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  deshabilitar(@Param('id') id: string) {
    return this.usuariosService.deshabilitar(id);
  }

  @Post(':id/habilitar')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  habilitar(@Param('id') id: string) {
    return this.usuariosService.habilitar(id);
  }
}