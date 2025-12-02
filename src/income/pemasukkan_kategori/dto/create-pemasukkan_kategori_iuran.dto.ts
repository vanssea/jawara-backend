import { ApiProperty } from '@nestjs/swagger';

export class CreatePemasukanKategoriIuranDto {
  @ApiProperty({ example: 'Iuran Kebersihan' })
  nama: string;

  @ApiProperty({ example: 'bulanan' })
  jenis: string;

  @ApiProperty({ example: 50000 })
  nominal: number;
}
