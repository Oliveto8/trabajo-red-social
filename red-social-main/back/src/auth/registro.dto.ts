import { IsOptional, IsString, MaxLength, MinLength, IsDateString } from 'class-validator';
import { CredencialesDto } from './credenciales.dto';

export class RegistroDto extends CredencialesDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @MinLength(2, { message: 'El nombre es muy corto' })
  @MaxLength(100)
  nombre!: string;

  @IsString({ message: 'El apellido debe ser un texto' })
  @MinLength(2, { message: 'El apellido es muy corto' })
  @MaxLength(100)
  apellido!: string;

  @IsString({ message: 'El nombre de usuario es obligatorio' })
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  @MaxLength(30)
  username!: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe tener un formato válido' })
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'La biografía no puede superar los 250 caracteres' })
  bio?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}