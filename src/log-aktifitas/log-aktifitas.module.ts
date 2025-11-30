import { Module } from '@nestjs/common';
import { LogAktifitasService } from './log-aktifitas.service';
import { LogAktifitasController } from './log-aktifitas.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [LogAktifitasController],
  providers: [LogAktifitasService],
})
export class LogAktifitasModule {}
