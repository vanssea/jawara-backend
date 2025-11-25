import { ApiProperty } from '@nestjs/swagger';

export class CreateKegiatanDto {
  @ApiProperty({ example: 'Kegiatan Bakti Sosial' })
  nama: string;

  @ApiProperty({ example:  1})
  kategori_id: number;

  @ApiProperty({ example: 'Deskripsi kegiatan' })
  deskripsi: string;

  @ApiProperty({ example: '2025-11-23T10:00:00+07:00' })
  tanggal: Date;

  @ApiProperty({ example: 'Balai RW 01' })
  lokasi: string;

  @ApiProperty({ example: '5795b3b9-d8c0-4de5-9c6e-f7253456c79e' })
  penanggung_jawab: string;

  @ApiProperty({ example: 'https://dokumentasi.example.com' })
  link_dokumentasi: string;
}
