import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AdminGuard } from './admin.guard';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Usuario, UsuarioSchema } from './usuario.schema';
import { LoginLog, LoginLogSchema } from './login-log.schema';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: Usuario.name, schema: UsuarioSchema },
      { name: LoginLog.name, schema: LoginLogSchema },
    ]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '2m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AdminGuard],
  exports: [AuthService, JwtStrategy, AdminGuard, MongooseModule],
})
export class AuthModule {}