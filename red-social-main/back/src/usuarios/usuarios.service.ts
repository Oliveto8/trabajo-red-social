import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isObjectIdOrHexString, Model, mongo } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Usuario, UsuarioDocument } from '../auth/usuario.schema';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name)
    private readonly usuarios: Model<UsuarioDocument>,
  ) {}

  async listar() {
    return this.usuarios
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async crear(datos: CrearUsuarioDto) {
    try {
      const creado = await this.usuarios.create({
        email: datos.email,
        passwordHash: await bcrypt.hash(datos.password, 10),
        nombre: datos.nombre,
        apellido: datos.apellido,
        username: datos.username,
        rol: datos.rol ?? 'user',
        fechaNacimiento: datos.fechaNacimiento
          ? new Date(datos.fechaNacimiento)
          : undefined,
        bio: datos.bio ?? '',
        avatar: datos.avatar ?? '',
        activo: true,
      });

      const { passwordHash: _passwordHash, ...usuarioPlano } = creado.toObject();
      return usuarioPlano;
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

  async deshabilitar(id: string) {
    this.validarId(id);

    const usuario = await this.usuarios
      .findByIdAndUpdate(id, { $set: { activo: false } }, { new: true })
      .exec();

    if (!usuario) {
      throw new NotFoundException('El usuario no existe');
    }

    return usuario;
  }

  async habilitar(id: string) {
    this.validarId(id);

    const usuario = await this.usuarios
      .findByIdAndUpdate(id, { $set: { activo: true } }, { new: true })
      .exec();

    if (!usuario) {
      throw new NotFoundException('El usuario no existe');
    }

    return usuario;
  }

  private validarId(id: string): void {
    if (!isObjectIdOrHexString(id)) {
      throw new BadRequestException('ID de usuario inválido');
    }
  }
}