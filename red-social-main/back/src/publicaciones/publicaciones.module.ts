import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionMongo, PublicacionSchema } from './publicacion.schema';
import { LikeLog, LikeLogSchema } from './like-log.schema';
import { PublicacionesController } from './publicaciones.controller';
import { PublicacionesService } from './publicaciones.service';
import { PortadasService } from './portadas.service';
import { PortadasInterceptor } from './portadas.interceptor';
import { Usuario, UsuarioSchema } from '../auth/usuario.schema';
import { VisitaPerfil, VisitaPerfilSchema } from '../usuarios/visita-perfil.schema';
import { AdminGuard } from '../auth/admin.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: PublicacionMongo.name, schema: PublicacionSchema },
      { name: LikeLog.name, schema: LikeLogSchema },
      { name: Usuario.name, schema: UsuarioSchema },
      { name: VisitaPerfil.name, schema: VisitaPerfilSchema },
    ]),
  ],
  controllers: [PublicacionesController],
  providers: [
    PublicacionesService,
    PortadasService,
    PortadasInterceptor,
    AdminGuard,
  ],
  exports: [PublicacionesService],
})
export class PublicacionesModule {}