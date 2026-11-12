import { Transform } from 'class-transformer';
import {
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsUrl,
  ValidateIf,
  IsOptional,
} from 'class-validator';

export class CrearPublicacionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  @Matches(/\S/, { message: 'El título no puede estar vacío' })
  titulo!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  @Matches(/\S/, { message: 'La descripción no puede estar vacía' })
  descripcion!: string;

  @ValidateIf((_obj, valor) => valor !== undefined && valor !== '')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: 'La URL de la imagen no es válida' })
  imagen_url!: string;

  @IsOptional()
  @IsString()
  imagen_public_id?: string;
}