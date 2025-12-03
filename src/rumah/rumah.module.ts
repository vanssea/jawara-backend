import { Module } from '@nestjs/common';
import { RumahService } from './rumah.service';
import { RumahController } from './rumah.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [RumahController],
  providers: [RumahService],
})
export class RumahModule {}
