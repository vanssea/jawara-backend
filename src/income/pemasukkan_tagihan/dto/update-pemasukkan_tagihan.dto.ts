import { PartialType } from '@nestjs/swagger';
import { CreatePemasukkanTagihanDto } from './create-pemasukkan_tagihan.dto';

export class UpdatePemasukkanTagihanDto extends PartialType(CreatePemasukkanTagihanDto) {}