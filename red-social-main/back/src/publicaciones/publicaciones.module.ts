import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionMongo, PublicacionSchema } from './publicacion.schema';
import { PublicacionesController } from './publicaciones.controller';
import { PublicacionesService } from './publicaciones.service';
import { PortadasService } from './portadas.service';
import { PortadasInterceptor } from './portadas.interceptor';
import { Usuario, UsuarioSchema } from '../auth/usuario.schema';
import { AdminGuard } from '../auth/admin.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicacionMongo.name, schema: PublicacionSchema },
      { name: Usuario.name, schema: UsuarioSchema },
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