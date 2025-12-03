import { Module } from '@nestjs/common';
import { PemasukanKategoriIuranService } from './pemasukkan_kategori_iuran.service';
import { PemasukanKategoriIuranController } from './pemasukkan_kategori_iuran.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [PemasukanKategoriIuranController],
  providers: [PemasukanKategoriIuranService],
})
export class PemasukanKategoriIuranModule {}
