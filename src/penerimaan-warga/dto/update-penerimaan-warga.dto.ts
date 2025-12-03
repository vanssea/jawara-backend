import { PartialType } from '@nestjs/swagger';
import { CreatePenerimaanWargaDto } from './create-penerimaan-warga.dto';

export class UpdatePenerimaanWargaDto extends PartialType(CreatePenerimaanWargaDto) {}
