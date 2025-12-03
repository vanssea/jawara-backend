import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreatePemasukkanTagihanDto {
  @ApiProperty({ example: 'Iuran Kebersihan Bulan November' })
  @IsString()
  @IsNotEmpty()
  nama: string;

  @ApiProperty({ example: '5795b3b9-d8c0-4de5-9c6e-f7253456c79e' })
  @IsString()
  @IsNotEmpty()
  kategori_id: string;

  @ApiProperty({ example: '2025-11-01T00:00:00+07:00' })
  @IsDateString()
  @IsNotEmpty()
  periode: Date;

  @ApiProperty({ example: 'belum_dibayar'})
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: '2a0c9d83-19fd-4dc8-8e29-5ced1c347b6d' })
  @IsString()
  @IsNotEmpty()
  keluarga_id: string;
} 