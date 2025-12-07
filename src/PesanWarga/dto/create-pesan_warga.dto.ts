import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePesanAspirasiDto {
  @ApiProperty({ example: 'Perbaikan Jalan Utama' })
  @IsString()
  @IsNotEmpty()
  judul: string;

  @ApiProperty({ example: 'Jalan utama rusak parah dan perlu segera diperbaiki.' })
  @IsString()
  @IsNotEmpty()
  deskripsi: string;

  @ApiProperty({ example: 'pending' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: 'a12bc345-678d-90ef-ab12-34567890abcd' })
  @IsUUID()
  @IsNotEmpty()
  created_by: string;
}