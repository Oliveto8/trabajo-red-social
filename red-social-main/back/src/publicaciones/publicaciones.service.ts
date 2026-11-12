import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isObjectIdOrHexString, Types } from 'mongoose';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto';
import { ActualizarPublicacionDto } from './dto/actualizar-publicacion.dto';
import { PublicacionMongo, PublicacionDocument } from './publicacion.schema';
import { PortadasService } from './portadas.service';

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(PublicacionMongo.name) private readonly modelo: Model<PublicacionDocument>,
    private readonly portadas: PortadasService,
  ) {}

  async crear(
    datos: CrearPublicacionDto,
    usuarioId: string,
    archivo?: Express.Multer.File,
  ) {
    let imagen_url = datos.imagen_url || '';
    let imagen_public_id = datos.imagen_public_id;

    if (archivo) {
      if (datos.imagen_url) {
        throw new BadRequestException('Enviá la imagen como archivo o imagen_url, no ambos');
      }
      const buffer = await this.portadas.normalizar(archivo);
      const subida = await this.portadas.subir(buffer);
      imagen_url = subida.url;
      imagen_public_id = subida.publicId;
    }

    try {
      const nueva = await this.modelo.create({
        ...datos,
        imagen_url,
        imagen_public_id,
        autor: new Types.ObjectId(usuarioId),
        likes: [],
        comentarios: [],
        activo: true,
      });
      return nueva
        .populate('autor', 'nombre apellido username avatar')
        .then(doc => doc.populate('comentarios.autor', 'nombre apellido username avatar'));
    } catch (error) {
      if (imagen_public_id) {
        await this.portadas.eliminar(imagen_public_id);
      }
      throw error;
    }
  }

  async listar(query: {
    orden?: 'fecha' | 'likes';
    usuarioId?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = query.limit || 10;
    const offset = query.offset || 0;
    const filtro: any = { activo: true }; // Baja lógica

    if (query.usuarioId) {
      this.validarId(query.usuarioId);
      filtro.autor = new Types.ObjectId(query.usuarioId);
    }

    let queryBuilder = this.modelo
      .find(filtro)
      .populate('autor', 'nombre apellido username avatar')
      .populate('comentarios.autor', 'nombre apellido username avatar')
      .skip(offset)
      .limit(limit);

    if (query.orden === 'likes') {
      queryBuilder = queryBuilder.sort({ likes: -1, createdAt: -1 });
    } else {
      queryBuilder = queryBuilder.sort({ createdAt: -1 });
    }

    return queryBuilder.exec();
  }

  async buscar(id: string) {
    this.validarId(id);
    const pub = await this.modelo
      .findOne({ _id: id, activo: true })
      .populate('autor', 'nombre apellido username avatar')
      .populate('comentarios.autor', 'nombre apellido username avatar')
      .exec();
    if (!pub) throw new NotFoundException('No existe la publicación');
    return pub;
  }

  async actualizar(id: string, datos: ActualizarPublicacionDto, usuarioActual: { userId: string; rol?: string }) {
    this.validarId(id);
    const pub = await this.modelo.findById(id);
    if (!pub || !pub.activo) throw new NotFoundException('No existe la publicación');

    const esDueño = pub.autor.toString() === usuarioActual.userId;
    const esAdmin = usuarioActual.rol === 'admin';
    if (!esDueño && !esAdmin) {
      throw new ForbiddenException('No tienes permisos para modificar esta publicación');
    }

    const cambios = Object.fromEntries(
      Object.entries(datos).filter(([, valor]) => valor !== undefined),
    );

    return this.modelo
      .findByIdAndUpdate(id, { $set: cambios }, { new: true, runValidators: true })
      .populate('autor', 'nombre apellido username avatar')
      .populate('comentarios.autor', 'nombre apellido username avatar')
      .exec();
  }

  async eliminar(id: string, usuarioActual: { userId: string; rol?: string }) {
    this.validarId(id);
    const pub = await this.modelo.findById(id);
    if (!pub || !pub.activo) throw new NotFoundException('No existe la publicación');

    const esDueño = pub.autor.toString() === usuarioActual.userId;
    const esAdmin = usuarioActual.rol === 'admin';
    if (!esDueño && !esAdmin) {
      throw new ForbiddenException('No tienes permisos para eliminar esta publicación');
    }

    // Baja lógica exigida por el TP
    pub.activo = false;
    await pub.save();

    if (pub.imagen_public_id) {
      await this.portadas.eliminar(pub.imagen_public_id);
    }
  }

  async toggleLike(id: string, usuarioId: string) {
    this.validarId(id);
    this.validarId(usuarioId);

    const pub = await this.modelo.findOne({ _id: id, activo: true });
    if (!pub) throw new NotFoundException('No existe la publicación');

    const usrObjectId = new Types.ObjectId(usuarioId);
    const yaDioLike = pub.likes.some((idLike) => idLike.equals(usrObjectId));

    const updateQuery = yaDioLike
      ? { $pull: { likes: usrObjectId } }
      : { $addToSet: { likes: usrObjectId } };

    return this.modelo
      .findByIdAndUpdate(id, updateQuery, { new: true })
      .populate('autor', 'nombre apellido username avatar')
      .populate('comentarios.autor', 'nombre apellido username avatar')
      .exec();
  }

  async agregarComentario(id: string, texto: string, usuarioId: string) {
    this.validarId(id);
    this.validarId(usuarioId);

    if (!texto || !texto.trim()) {
      throw new BadRequestException('El texto del comentario es obligatorio');
    }

    const pub = await this.modelo.findOne({ _id: id, activo: true });
    if (!pub) throw new NotFoundException('No existe la publicación');

    const nuevoComentario = {
      autor: new Types.ObjectId(usuarioId),
      texto: texto.trim(),
    };

    return this.modelo
      .findByIdAndUpdate(
        id,
        { $push: { comentarios: nuevoComentario } },
        { new: true, runValidators: true },
      )
      .populate('autor', 'nombre apellido username avatar')
      .populate('comentarios.autor', 'nombre apellido username avatar')
      .exec();
  }

  private validarId(id: string): void {
    if (!isObjectIdOrHexString(id))
      throw new BadRequestException('ID inválido');
  }
}