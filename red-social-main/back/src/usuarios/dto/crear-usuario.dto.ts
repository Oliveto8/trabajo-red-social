import { IsIn, IsOptional } from 'class-validator';
import { RegistroDto } from '../../auth/registro.dto';

export class CrearUsuarioDto extends RegistroDto {
  @IsOptional()
  @IsIn(['user', 'admin'], {
    message: 'El rol debe ser user o admin',
  })
  rol?: 'user' | 'admin';
}