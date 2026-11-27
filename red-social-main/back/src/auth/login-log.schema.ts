import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LoginLogDocument = LoginLog & Document;

@Schema({ timestamps: true })
export class LoginLog {
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true, index: true })
  usuarioId!: Types.ObjectId;

  @Prop({ type: Date, default: () => new Date(), index: true })
  fecha!: Date;
}

export const LoginLogSchema = SchemaFactory.createForClass(LoginLog);