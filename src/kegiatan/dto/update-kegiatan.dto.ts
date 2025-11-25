import { PartialType } from '@nestjs/swagger';
import { CreateKegiatanDto } from './create-kegiatan.dto';

export class UpdateKegiatanDto extends PartialType(CreateKegiatanDto) {}
