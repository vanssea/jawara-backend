import { ApiProperty } from '@nestjs/swagger';

export class CreatePemasukkanNonIuranDto {
  @ApiProperty({ example: 'Donasi Warga' })
  nama: string;

  @ApiProperty({ example: '2025-11-01T08:00:00+07:00' })
  tanggal_pemasukan: Date;

  @ApiProperty({ example: 'Donasi' })
  kategori_pemasukan: string;

  @ApiProperty({ example: 150000 })
  nominal: number;

  @ApiProperty({ example: 'https://example.com/bukti/donasi.jpg' })
  link_bukti_pemasukan: string;
}
