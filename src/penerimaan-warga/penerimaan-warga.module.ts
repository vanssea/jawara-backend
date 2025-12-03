import { Module } from '@nestjs/common';
import { PenerimaanWargaService } from './penerimaan-warga.service';
import { PenerimaanWargaController } from './penerimaan-warga.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [PenerimaanWargaController],
  providers: [PenerimaanWargaService],
  exports: [PenerimaanWargaService],
})
export class PenerimaanWargaModule {}
