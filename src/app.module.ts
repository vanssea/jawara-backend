import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WargaModule } from './warga/warga.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, WargaModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
