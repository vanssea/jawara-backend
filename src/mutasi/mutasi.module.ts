import { Module } from '@nestjs/common';
import { MutasiService } from './mutasi.service';
import { MutasiController } from './mutasi.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [MutasiController],
  providers: [MutasiService],
})
export class MutasiModule {}
