import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionMongo, PublicacionSchema } from './publicacion.schema';
import { PublicacionesController } from './publicaciones.controller';
import { PublicacionesService } from './publicaciones.service';
import { PortadasService } from './portadas.service';
import { PortadasInterceptor } from './portadas.interceptor';
import { UsuarioMongo, UsuarioSchema } from '../auth/usuario.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PublicacionMongo.name, schema: PublicacionSchema },
      { name: 'UsuarioMongo', schema: UsuarioSchema }, // Registramos el string exacto que busca Mongoose
      { name: UsuarioMongo.name, schema: UsuarioSchema },
    ]),
  ],
  controllers: [PublicacionesController],
  providers: [PublicacionesService, PortadasService, PortadasInterceptor],
  exports: [PublicacionesService],
})
export class PublicacionesModule {}