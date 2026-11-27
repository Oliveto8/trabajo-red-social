import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from '../auth/usuario.schema';
import { VisitaPerfil, VisitaPerfilSchema } from './visita-perfil.schema';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Usuario.name, schema: UsuarioSchema },
      { name: VisitaPerfil.name, schema: VisitaPerfilSchema },
    ]),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService, MongooseModule],
})
export class UsuariosModule {}