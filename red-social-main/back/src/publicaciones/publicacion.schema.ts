import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class Comentario {
  @Prop({ type: Types.ObjectId, ref: 'UsuarioMongo', required: true })
  autor!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 300 })
  texto!: string;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);

@Schema({ collection: 'publicaciones', versionKey: false, timestamps: true })
export class PublicacionMongo {
  @Prop({ required: true, trim: true })
  titulo!: string;

  @Prop({ required: true, trim: true })
  descripcion!: string;

  @Prop({ default: '' })
  imagen_url!: string;

  @Prop()
  imagen_public_id?: string;

  // Relación con el usuario autenticado (ObjectId que referencia a la colección de usuarios)
  @Prop({ type: Types.ObjectId, ref: 'UsuarioMongo', required: true })
  autor!: Types.ObjectId;

  // Lista de usuarios que dieron "Me gusta"
  @Prop({ type: [{ type: Types.ObjectId, ref: 'UsuarioMongo' }], default: [] })
  likes!: Types.ObjectId[];

  // Lista de comentarios integrados
  @Prop({ type: [ComentarioSchema], default: [] })
  comentarios!: Comentario[];

  // Baja lógica para cumplir con el TP
  @Prop({ default: true })
  activo!: boolean;
}

export type PublicacionDocument = HydratedDocument<PublicacionMongo>;
export const PublicacionSchema = SchemaFactory.createForClass(PublicacionMongo);