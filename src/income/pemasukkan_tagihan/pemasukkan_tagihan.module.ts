import { Module } from '@nestjs/common';
import { PemasukkanTagihanService } from './pemasukkan_tagihan.service';
import { PemasukkanTagihanController } from './pemasukkan_tagihan.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [PemasukkanTagihanController],
  providers: [PemasukkanTagihanService],
})
export class PemasukkanTagihanModule {}
