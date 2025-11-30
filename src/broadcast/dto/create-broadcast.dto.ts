import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({ example: 'https://example.com/gambar.jpg', required: false })
  @IsString()
  @IsOptional()
  link_lampiran_gambar?: string;

  @ApiProperty({ example: 'https://example.com/dokumen.pdf', required: false })
  @IsString()
  @IsOptional()
  link_lampiran_dokumen?: string;
}
