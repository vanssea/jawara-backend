import { PartialType } from '@nestjs/swagger';
import { CreatePesanAspirasiDto } from './create-pesan_warga.dto';

export class UpdatePesanAspirasiDto extends PartialType(CreatePesanAspirasiDto) {}