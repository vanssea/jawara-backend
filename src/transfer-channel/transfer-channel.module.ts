import { Module } from '@nestjs/common';
import { TransferChannelService } from './transfer-channel.service';
import { TransferChannelController } from './transfer-channel.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [TransferChannelController],
  providers: [TransferChannelService],
})
export class TransferChannelModule {}
