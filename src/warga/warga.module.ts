import { Module } from '@nestjs/common';
import { WargaService } from './warga.service';
import { WargaController } from './warga.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [WargaController],
  providers: [WargaService],
})
export class WargaModule {}
