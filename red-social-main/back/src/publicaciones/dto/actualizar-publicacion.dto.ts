import { ValidateIf } from 'class-validator';
import { CrearPublicacionDto } from './crear-publicacion.dto';

// Hereda las validaciones; PATCH solo valida los campos enviados.
export class ActualizarPublicacionDto extends CrearPublicacionDto {
  @ValidateIf((_obj, valor) => valor !== undefined)
  declare titulo: string;

  @ValidateIf((_obj, valor) => valor !== undefined)
  declare descripcion: string;

  @ValidateIf((_obj, valor) => valor !== undefined)
  declare imagen_url: string;

  @ValidateIf((_obj, valor) => valor !== undefined)
  declare imagen_public_id?: string;
}