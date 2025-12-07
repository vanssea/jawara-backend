import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreatePemasukkanNonIuranDto {
  @ApiProperty({ example: 'Donasi Acara Kampung' })
  @IsString()
  @IsNotEmpty()
  nama: string;

  @ApiProperty({ example: '2025-12-03T10:16:00+07:00' })
  @IsDateString()
  @IsNotEmpty()
  tanggal_pemasukan: string;

  @ApiProperty({ example: 'Donasi' })
  @IsString()
  @IsNotEmpty()
  kategori_pemasukan: string;

  @ApiProperty({ example: 1500000 })
  @IsNumber()
  @IsNotEmpty()
  nominal: number;

  @ApiPropertyOptional({
    example: 'pemasukan_non_iuran/bukti/123.jpg',
  })
  @IsString()
  @IsOptional()
  link_bukti_pemasukan?: string;
}