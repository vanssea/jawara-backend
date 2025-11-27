import { IsNotEmpty, IsUUID, IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateMutasiDto {
  @IsNumber()
  jenis_id: number;

  @IsUUID()
  keluarga_id: string;

  @IsOptional()
  @IsString()
  alasan?: string;

  @IsDateString()
  tanggal_mutasi: string; 
}

