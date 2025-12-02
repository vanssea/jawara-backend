import { PartialType } from '@nestjs/swagger';
import { CreatePemasukanKategoriIuranDto } from './create-pemasukkan_kategori_iuran.dto';

export class UpdatePemasukanKategoriIuranDto extends PartialType(CreatePemasukanKategoriIuranDto) {}