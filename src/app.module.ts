import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WargaModule } from './warga/warga.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { BroadcastModule } from './broadcast/broadcast.module';
import { ExpensesModule } from './expenses/expenses.module';
import { MutasiModule } from './mutasi/mutasi.module';
import { LogAktifitasModule } from './log-aktifitas/log-aktifitas.module';
import { KegiatanModule } from './kegiatan/kegiatan.module';
import { TransferChannelModule } from './transfer-channel/transfer-channel.module';
import { FamiliesModule } from './families/families.module';
import { KegiatanKategoriModule } from './kegiatan-kategori/kegiatan-kategori.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './user/user.module';
import { PemasukanKategoriIuranModule } from './income/pemasukkan_kategori/pemasukkan_kategori_iuran.module';
import { PemasukkanNonIuranModule } from './income/pemasukkan_noniuran/pemasukkan_non_iuran.module';
import { PemasukkanTagihanModule } from './income/pemasukkan_tagihan/pemasukkan_tagihan.module';
import { PenerimaanWargaModule } from './penerimaan-warga/penerimaan-warga.module';
import { ReportModule } from './reports/reports.module';

import { PesanAspirasiModule } from './PesanWarga/pesan_warga.module';
import { RumahModule } from './rumah/rumah.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    WargaModule,
    BroadcastModule,
    ExpensesModule,
    MutasiModule,
    LogAktifitasModule,
    KegiatanModule,
    TransferChannelModule,
    FamiliesModule,
    KegiatanKategoriModule,
    DashboardModule,
    UsersModule,
    PemasukanKategoriIuranModule,
    PemasukkanNonIuranModule,
    PemasukkanTagihanModule,
    PenerimaanWargaModule,
    ReportModule,
    PesanAspirasiModule,
    RumahModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
