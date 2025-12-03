import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreatePemasukanKategoriIuranDto {
  @ApiProperty({ example: 'Iuran Kebersihan' })
  @IsString()
  @IsNotEmpty()
  nama: string;

  @ApiProperty({ example: 'bulanan' })
  @IsString()
  @IsNotEmpty()
  jenis: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @IsNotEmpty()
  nominal: number;
}