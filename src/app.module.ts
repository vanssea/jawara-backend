import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WargaModule } from './warga/warga.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { BroadcastModule } from './broadcast/broadcast.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    WargaModule,
    BroadcastModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
