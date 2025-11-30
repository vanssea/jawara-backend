import { PartialType } from '@nestjs/swagger';
import { CreatePemasukkanNonIuranDto } from './create-pemasukkan_non_iuran.dto';

export class UpdatePemasukkanNonIuranDto extends PartialType(CreatePemasukkanNonIuranDto) {}