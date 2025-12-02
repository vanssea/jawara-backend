import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { KegiatanKategoriService } from './kegiatan-kategori.service';
import { KegiatanKategoriController } from './kegiatan-kategori.controller';

@Module({
  imports: [CommonModule],
  providers: [KegiatanKategoriService],
  controllers: [KegiatanKategoriController],
})
export class KegiatanKategoriModule {}
