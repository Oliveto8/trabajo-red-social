import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsuarioDocument = Usuario & Document;

@Schema({ collection: 'usuarios', timestamps: true })
export class Usuario {
  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ required: true, trim: true })
  apellido!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username!: string;

  @Prop({ default: 'user', enum: ['user', 'admin'] })
  rol!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ type: Date })
  fechaNacimiento!: Date;

  @Prop({ default: '', maxlength: 250 })
  bio!: string;

  @Prop({ default: '' })
  avatar!: string;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);

// Definimos explícitamente ambos nombres por si acaso
export const UsuarioMongo = Usuario;