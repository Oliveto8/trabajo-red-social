import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './usuario.schema';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarios: Model<UsuarioDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userPayload = request.user;

    if (!userPayload) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    const userId = userPayload.sub || userPayload.userId || userPayload.id;
    if (!userId) {
      throw new UnauthorizedException('Token sin identificador de usuario');
    }

    const usuario = await this.usuarios.findById(userId).exec();
    if (!usuario) {
      throw new UnauthorizedException('El usuario no existe');
    }

    // Si luego agregás `activo` en Usuario, esto también bloquea admins deshabilitados
    if ((usuario as any).activo === false) {
      throw new ForbiddenException('El usuario se encuentra deshabilitado');
    }

    if (usuario.rol !== 'admin') {
      throw new ForbiddenException(
        'Acceso denegado: se requiere perfil administrador',
      );
    }

    // Dejamos el usuario verificado disponible en la request por si el controlador lo necesita
    request.usuarioAdmin = usuario;
    return true;
  }
}