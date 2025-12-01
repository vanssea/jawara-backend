import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateKegiatanDto {
  @ApiProperty({ example: 'Kegiatan Bakti Sosial' })
  @IsString()
  @IsNotEmpty()
  nama: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  kategori_id: number;

  @ApiProperty({ example: 'Deskripsi kegiatan', required: false })
  @IsString()
  @IsOptional()
  deskripsi?: string;

  @ApiProperty({ example: '2025-11-23T10:00:00+07:00' })
  @IsDateString()
  @IsNotEmpty()
  tanggal: Date;

  @ApiProperty({ example: 'Balai RW 01' })
  @IsString()
  @IsNotEmpty()
  lokasi: string;

  @ApiProperty({ example: '5795b3b9-d8c0-4de5-9c6e-f7253456c79e' })
  @IsString()
  @IsNotEmpty()
  penanggung_jawab: string;

  @ApiProperty({ example: 'https://dokumentasi.example.com', required: false })
  @IsString()
  @IsOptional()
  link_dokumentasi?: string;
}
