import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt'; // 👈 1. Importar JwtService
import { RegistroDto } from './registro.dto';
import { AuthService } from './auth.service';
import { CredencialesDto } from './credenciales.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwtService: JwtService, // 👈 2. Inyectar JwtService
  ) {}

  @Post('register')
  @Throttle({ default: { ttl: 15 * 60 * 1000, limit: 10 } })
  registrar(@Body() datos: RegistroDto) {
    return this.auth.registrar(datos);
  }

  @Post('login')
  @Throttle({ default: { ttl: 15 * 60 * 1000, limit: 10 } })
  @HttpCode(200)
  login(@Body() datos: CredencialesDto) {
    return this.auth.login(datos);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  perfil(@Req() req: Request & { user: { sub: string } }) {
    return this.auth.perfil(req.user.sub);
  }

  // SPRINT 3: Ruta para validar si el token es válido (Splash Screen / Pantalla de Carga)
  @Post('autorizar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  autorizar(@Req() req: any) {
    return {
      valido: true,
      usuario: req.user,
    };
  }

  // SPRINT 3: Ruta para refrescar el token y dar 15 minutos más de sesión
  @Post('refrescar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  refrescar(@Req() req: any) {
    const payload = {
      sub: req.user.sub || req.user.userId || req.user.id,
      email: req.user.email,
      username: req.user.username,
      rol: req.user.rol,
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '2m' })
    };
  }
}