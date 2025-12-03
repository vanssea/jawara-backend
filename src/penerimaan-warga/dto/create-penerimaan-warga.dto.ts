import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePenerimaanWargaDto {
  @ApiProperty({ example: 'Budi Santoso', description: 'Nama lengkap warga' })
  @IsString()
  nama: string;

  @ApiPropertyOptional({ example: 'Jakarta', description: 'Tempat lahir warga' })
  @IsOptional()
  @IsString()
  tempat_lahir?: string;

  @ApiPropertyOptional({ example: '2000-01-15', description: 'Tanggal lahir (ISO date string YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  tanggal_lahir?: string;

  @ApiPropertyOptional({ example: '081234567890', description: 'Nomor telepon' })
  @IsOptional()
  @IsString()
  no_telp?: string;

  @ApiPropertyOptional({ example: 'laki-laki', description: 'Jenis kelamin' })
  @IsOptional()
  @IsString()
  jenis_kelamin?: string;

  @ApiPropertyOptional({ example: 'Islam', description: 'Agama' })
  @IsOptional()
  @IsString()
  agama?: string;

  @ApiPropertyOptional({ example: 'O', description: 'Golongan darah' })
  @IsOptional()
  @IsString()
  golongan_darah?: string;

  @ApiPropertyOptional({ example: 'S1', description: 'Pendidikan terakhir' })
  @IsOptional()
  @IsString()
  pendidikan_terakhir?: string;

  @ApiPropertyOptional({ example: 'Karyawan Swasta', description: 'Pekerjaan' })
  @IsOptional()
  @IsString()
  pekerjaan?: string;

  @ApiPropertyOptional({ example: 'Ketua RT', description: 'Peran di lingkungan' })
  @IsOptional()
  @IsString()
  peran?: string;

  @ApiPropertyOptional({ example: 'penerimaan-warga/identitas/ktp.jpg', description: 'URL foto identitas' })
  @IsOptional()
  @IsString()
  foto_identitas?: string;

  @ApiPropertyOptional({ example: 'pending', description: 'Status penerimaan warga (pending/diterima/ditolak)' })
  @IsOptional()
  @IsString()
  status_penerimaan?: string;
}
