import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LikeLogDocument = LikeLog & Document;

@Schema({ timestamps: true })
export class LikeLog {
  @Prop({ type: Types.ObjectId, ref: 'PublicacionMongo', required: true, index: true })
  publicacionId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true, index: true })
  usuarioId!: Types.ObjectId;

  @Prop({ type: Date, default: () => new Date(), index: true })
  fecha!: Date;
}

export const LikeLogSchema = SchemaFactory.createForClass(LikeLog);
LikeLogSchema.index({ publicacionId: 1, usuarioId: 1 });