import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateBroadcastDto {
  @ApiProperty({ example: 'Pengumuman Penting' })
  @IsString()
  @IsNotEmpty()
  judul: string;

  @ApiProperty({ example: 'Ini adalah pesan broadcast untuk semua warga' })
  @IsString()
  @IsNotEmpty()
  pesan: string;

  @ApiProperty({ example: '2025-11-19T10:16:00+07:00' })
  @IsDateString()
  @IsNotEmpty()
  tanggal_publikasi: Date;

  @ApiPropertyOptional({
    example: 'broadcast/images/123.jpg',
  })
  @IsString()
  @IsOptional()
  link_lampiran_gambar?: string;

  @ApiPropertyOptional({
    example: 'broadcast/documents/123.pdf',
  })
  @IsString()
  @IsOptional()
  link_lampiran_dokumen?: string;
}
