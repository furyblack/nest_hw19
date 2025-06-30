import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersRepository } from './infrastructure/users.repository';
import { UsersSaController } from './api/users.sa.controller';
import { UsersService } from './application/users.service';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { AuthRepository } from './infrastructure/auth.repository';
import { EmailService } from '../notifications/email.service';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { SessionService } from './application/session.service';
import { SecurityDevicesController } from './api/security-devices.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: 'REFRESH_SECRET', // TODO return process.env.JWT_SECRET ||
      signOptions: { expiresIn: '20s' }, // Базовые настройки
    }),
  ],
  controllers: [UsersSaController, AuthController, SecurityDevicesController],
  providers: [
    UsersRepository,
    UsersService,
    AuthQueryRepository,
    AuthService,
    AuthRepository,
    EmailService,
    JwtStrategy,
    SessionService,
  ],

  exports: [
    UsersRepository,
    JwtModule,
    /* MongooseModule реэкспорт делаем, если хотим чтобы зарегистрированные здесь модельки могли
    инджектиться в сервисы других модулей, которые импортнут этот модуль */
  ],
})
export class UserAccountsModule {}
