import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Types } from 'mongoose';

@Schema({ collection: 'visitas_perfil', versionKey: false, timestamps: true })
export class VisitaPerfil {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true, index: true })
  perfilId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true, index: true })
  visitanteId!: Types.ObjectId;
}

export type VisitaPerfilDocument = HydratedDocument<VisitaPerfil>;
export const VisitaPerfilSchema = SchemaFactory.createForClass(VisitaPerfil);