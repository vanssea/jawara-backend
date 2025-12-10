import { Module } from '@nestjs/common';
import { MutasiService } from './mutasi.service';
import { MutasiController } from './mutasi.controller';
import { MutasiJenisService } from './mutasi-jenis.service';
import { MutasiJenisController } from './mutasi-jenis.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [MutasiController, MutasiJenisController],
  providers: [MutasiService, MutasiJenisService],
})
export class MutasiModule {}
