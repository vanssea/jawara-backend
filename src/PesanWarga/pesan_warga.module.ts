import { Module } from '@nestjs/common';
import { PesanAspirasiService } from './pesan_warga.service';
import { PesanAspirasiController } from './pesan_warga.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [PesanAspirasiController],
  providers: [PesanAspirasiService],
})
export class PesanAspirasiModule {}