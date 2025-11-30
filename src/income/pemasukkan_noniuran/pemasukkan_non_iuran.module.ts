import { Module } from '@nestjs/common';
import { PemasukkanNonIuranService } from './pemasukkan_non_iuran.service';
import { PemasukanNonIuranController } from './pemasukkan_non_iuran.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [PemasukanNonIuranController],
  providers: [PemasukkanNonIuranService],
})
export class ExpensesModule {}