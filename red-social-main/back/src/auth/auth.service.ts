import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, mongo, Types } from 'mongoose';
import { Usuario } from './usuario.schema';
import { LoginLog, LoginLogDocument } from './login-log.schema';
import { CredencialesDto } from './credenciales.dto';
import { RegistroDto } from './registro.dto';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarios: Model<Usuario>,
    @InjectModel(LoginLog.name)
    private readonly loginLogs: Model<LoginLogDocument>,
    private readonly jwt: JwtService,
  ) {}

  async registrar(datos: RegistroDto) {
    try {
      const usuario = await this.usuarios.create({
        email: datos.email,
        passwordHash: await bcrypt.hash(datos.password, 10),
        nombre: datos.nombre,
        apellido: datos.apellido,
        username: datos.username,
        fechaNacimiento: datos.fechaNacimiento
          ? new Date(datos.fechaNacimiento)
          : undefined,
        bio: datos.bio ?? '',
        avatar: datos.avatar ?? '',
        activo: true,
      });
      return this.token(
        usuario.id as string,
        usuario.email,
        usuario.rol ?? 'user',
      );
    } catch (error) {
      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0];
        if (field === 'username') {
          throw new ConflictException('El nombre de usuario ya está en uso');
        }
        throw new ConflictException('El email ya está registrado');
      }
      throw error;
    }
  }

  async login(datos: CredencialesDto) {
    const usuario = await this.usuarios
      .findOne({ email: datos.email })
      .select('+passwordHash')
      .exec();
    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    const passwordValida = await bcrypt.compare(
      datos.password,
      usuario.passwordHash,
    );
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (usuario.activo === false) {
      throw new ForbiddenException(
        'Tu cuenta está deshabilitada y no está autorizada para ingresar',
      );
    }

    await this.loginLogs.create({
      usuarioId: new Types.ObjectId(usuario._id),
      fecha: new Date(),
    });

    return this.token(
      usuario.id as string,
      usuario.email,
      usuario.rol ?? 'user',
    );
  }

  private async token(id: string, email: string, rol: string) {
    return {
      access_token: await this.jwt.signAsync({ sub: id, email, rol }),
      token_type: 'Bearer',
      expires_in: 120,
    };
  }

  async perfil(id: string) {
    const usuario = await this.usuarios.findById(id).exec();
    if (!usuario) throw new UnauthorizedException('El usuario no existe');
    return {
      id: usuario.id as string,
      email: usuario.email,
      nombre: usuario.nombre ?? '',
      apellido: usuario.apellido ?? '',
      username: usuario.username ?? '',
      fechaNacimiento: usuario.fechaNacimiento ?? null,
      bio: usuario.bio ?? '',
      avatar: usuario.avatar ?? '',
      rol: usuario.rol ?? 'user',
      activo: usuario.activo ?? true,
    };
  }
}