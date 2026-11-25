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
import { Usuario } from '../auth/usuario.schema';
import { PortadasService } from './portadas.service';

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(PublicacionMongo.name)
    private readonly modelo: Model<PublicacionDocument>,
    @InjectModel(Usuario.name)
    private readonly usuariosModelo: Model<Usuario>,
    private readonly portadas: PortadasService,
  ) {}

  // =========================================================================
  // SPRINT 1: CRUD de Publicaciones, Multimedia y Baja Lógica
  // =========================================================================

  async crear(
    datos: CrearPublicacionDto,
    usuarioId: string,
    archivo?: Express.Multer.File,
  ) {
    let imagen_url = datos.imagen_url || '';
    let imagen_public_id = datos.imagen_public_id;

    if (archivo) {
      if (datos.imagen_url) {
        throw new BadRequestException(
          'Enviá la imagen como archivo o imagen_url, no ambos',
        );
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

      return this.poblarPublicacion(nueva);
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
    const filtro: any = { activo: true };

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

  async actualizar(
    id: string,
    datos: ActualizarPublicacionDto,
    usuarioActual: { userId: string; rol?: string },
  ) {
    this.validarId(id);

    const pub = await this.modelo.findById(id);
    if (!pub || !pub.activo) {
      throw new NotFoundException('No existe la publicación');
    }

    this.verificarPermisos(
      pub.autor.toString(),
      usuarioActual,
      'No tienes permisos para modificar esta publicación',
    );

    const cambios = Object.fromEntries(
      Object.entries(datos).filter(([, valor]) => valor !== undefined),
    );

    return this.modelo
      .findByIdAndUpdate(
        id,
        { $set: cambios },
        { new: true, runValidators: true },
      )
      .populate('autor', 'nombre apellido username avatar')
      .populate('comentarios.autor', 'nombre apellido username avatar')
      .exec();
  }

  async eliminar(id: string, usuarioActual: { userId: string; rol?: string }) {
    this.validarId(id);

    const pub = await this.modelo.findById(id);
    if (!pub || !pub.activo) {
      throw new NotFoundException('No existe la publicación');
    }

    this.verificarPermisos(
      pub.autor.toString(),
      usuarioActual,
      'No tienes permisos para eliminar esta publicación',
    );

    pub.activo = false;
    await pub.save();

    if (pub.imagen_public_id) {
      await this.portadas.eliminar(pub.imagen_public_id);
    }
  }

  // =========================================================================
  // SPRINT 2: Interacciones Sociales (Likes y Alta de Comentarios)
  // =========================================================================

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
      modificado: false,
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

  // =========================================================================
  // SPRINT 3: Paginación, Ordenamiento y Edición de Comentarios
  // =========================================================================

  async obtenerComentarios(
    postId: string,
    limit: number = 10,
    offset: number = 0,
  ) {
    this.validarId(postId);

    const pub = await this.modelo
      .findOne({ _id: postId, activo: true })
      .populate('comentarios.autor', 'nombre apellido username avatar')
      .exec();

    if (!pub) throw new NotFoundException('No existe la publicación');

    const comentariosOrdenados = [...pub.comentarios].sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = comentariosOrdenados.length;
    const comentariosPaginados = comentariosOrdenados.slice(
      offset,
      offset + limit,
    );

    return {
      total,
      comentarios: comentariosPaginados,
    };
  }

  async modificarComentario(
    postId: string,
    comentarioId: string,
    nuevoTexto: string,
    usuarioActual: { userId: string; rol?: string },
  ) {
    this.validarId(postId);
    this.validarId(comentarioId);

    if (!nuevoTexto || !nuevoTexto.trim()) {
      throw new BadRequestException('El texto del comentario es obligatorio');
    }

    const pub = await this.modelo.findOne({ _id: postId, activo: true });
    if (!pub) throw new NotFoundException('No existe la publicación');

    const comentario: any = pub.comentarios.find(
      (c: any) => c._id && c._id.toString() === comentarioId,
    );
    if (!comentario) throw new NotFoundException('No existe el comentario');

    const autorId = comentario.autor?._id
      ? comentario.autor._id.toString()
      : comentario.autor.toString();

    this.verificarPermisos(
      autorId,
      usuarioActual,
      'No tienes permisos para modificar este comentario',
    );

    comentario.texto = nuevoTexto.trim();
    comentario.modificado = true;

    await pub.save();

    return this.modelo
      .findById(postId)
      .populate('autor', 'nombre apellido username avatar')
      .populate('comentarios.autor', 'nombre apellido username avatar')
      .exec();
  }

  // =========================================================================
  // SPRINT 4: Estadísticas para Administrador
  // =========================================================================

  async estadisticasPublicacionesPorUsuario(desde?: string, hasta?: string) {
    const rango = this.construirRangoFechas(desde, hasta);
    const matchEtapa: any = { activo: { $ne: false } };

    if (rango) {
      matchEtapa.createdAt = rango;
    }

    return this.modelo
      .aggregate([
        { $match: matchEtapa },
        {
          $group: {
            _id: '$autor',
            totalPublicaciones: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: this.usuariosModelo.collection.name,
            localField: '_id',
            foreignField: '_id',
            as: 'usuario',
          },
        },
        {
          $unwind: {
            path: '$usuario',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            usuarioId: '$_id',
            nombre: { $ifNull: ['$usuario.nombre', ''] },
            apellido: { $ifNull: ['$usuario.apellido', ''] },
            username: { $ifNull: ['$usuario.username', 'Sin usuario'] },
            email: { $ifNull: ['$usuario.email', ''] },
            totalPublicaciones: 1,
          },
        },
        { $sort: { totalPublicaciones: -1 } },
      ])
      .exec();
  }

  async estadisticasTotalComentarios(desde?: string, hasta?: string) {
    const rango = this.construirRangoFechas(desde, hasta);
    const pipeline: any[] = [
      { $match: { activo: { $ne: false } } },
      { $unwind: '$comentarios' },
    ];

    if (rango) {
      pipeline.push({
        $match: {
          'comentarios.createdAt': rango,
        },
      });
    }

    pipeline.push({
      $count: 'totalComentarios',
    });

    const resultado = await this.modelo.aggregate(pipeline).exec();
    return {
      totalComentarios: resultado[0]?.totalComentarios ?? 0,
    };
  }

  async estadisticasComentariosPorPublicacion(desde?: string, hasta?: string) {
    const rango = this.construirRangoFechas(desde, hasta);
    const matchPub: any = { activo: { $ne: false } };

    if (rango) {
      matchPub.createdAt = rango;
    }

    return this.modelo
      .aggregate([
        { $match: matchPub },
        {
          $lookup: {
            from: this.usuariosModelo.collection.name,
            localField: 'autor',
            foreignField: '_id',
            as: 'autorDoc',
          },
        },
        {
          $unwind: {
            path: '$autorDoc',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            publicacionId: '$_id',
            titulo: '$titulo',
            autorUsername: { $ifNull: ['$autorDoc.username', ''] },
            createdAt: '$createdAt',
            totalComentarios: { $size: { $ifNull: ['$comentarios', []] } },
          },
        },
        { $sort: { totalComentarios: -1, createdAt: -1 } },
      ])
      .exec();
  }

  // =========================================================================
  // Helpers Internos
  // =========================================================================

  private construirRangoFechas(
    desde?: string,
    hasta?: string,
  ): { $gte?: Date; $lte?: Date } | null {
    const rango: { $gte?: Date; $lte?: Date } = {};

    if (desde) {
      const fechaDesde = new Date(desde);
      if (Number.isNaN(fechaDesde.getTime())) {
        throw new BadRequestException('Parámetro "desde" inválido');
      }
      fechaDesde.setHours(0, 0, 0, 0);
      rango.$gte = fechaDesde;
    }

    if (hasta) {
      const fechaHasta = new Date(hasta);
      if (Number.isNaN(fechaHasta.getTime())) {
        throw new BadRequestException('Parámetro "hasta" inválido');
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
        fechaHasta.setHours(23, 59, 59, 999);
      }
      rango.$lte = fechaHasta;
    }

    if (rango.$gte && rango.$lte && rango.$gte > rango.$lte) {
      throw new BadRequestException(
        'La fecha "desde" no puede ser mayor que "hasta"',
      );
    }

    return Object.keys(rango).length > 0 ? rango : null;
  }

  private validarId(id: string): void {
    if (!isObjectIdOrHexString(id)) {
      throw new BadRequestException('ID inválido');
    }
  }

  private verificarPermisos(
    duenioId: string,
    usuarioActual: { userId: string; rol?: string },
    mensajeError: string,
  ): void {
    const esDueño = duenioId === usuarioActual.userId;
    const esAdmin = usuarioActual.rol === 'admin';

    if (!esDueño && !esAdmin) {
      throw new ForbiddenException(mensajeError);
    }
  }

  private async poblarPublicacion(doc: PublicacionDocument) {
    await doc.populate('autor', 'nombre apellido username avatar');
    await doc.populate('comentarios.autor', 'nombre apellido username avatar');
    return doc;
  }
}