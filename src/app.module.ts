import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WargaModule } from './warga/warga.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { BroadcastModule } from './broadcast/broadcast.module';
import { ExpensesModule } from './expenses/expenses.module';
import { MutasiModule } from './mutasi/mutasi.module';
import { LogAktifitasModule } from './log-aktifitas/log-aktifitas.module';
import { TransferChannelModule } from './transfer-channel/transfer-channel.module';
import { FamiliesModule } from './families/families.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    WargaModule,
    BroadcastModule,
    ExpensesModule,
    MutasiModule,
    LogAktifitasModule,
    TransferChannelModule,
    FamiliesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
