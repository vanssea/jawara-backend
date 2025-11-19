import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guards/auth.guard';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    CommonModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        return {
          global: true,
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: 40000 },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthGuard, SupabaseStrategy, AuthService, AuthService],
  exports: [AuthGuard, JwtModule],
  controllers: [AuthController],
})
export class AuthModule {}
