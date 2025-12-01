import { PartialType } from '@nestjs/swagger';
import { CreateTransferChannelDto } from './create-transfer-channel.dto';

export class UpdateTransferChannelDto extends PartialType(
  CreateTransferChannelDto,
) {}
