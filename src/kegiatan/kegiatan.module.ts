import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { KegiatanService } from './kegiatan.service';
import { KegiatanController } from './kegiatan.controller';

@Module({
  imports: [CommonModule],
  providers: [KegiatanService],
  controllers: [KegiatanController],
})
export class KegiatanModule {}
