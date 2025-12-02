import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  nama: string;

  @IsUUID()
  @IsOptional()
  kepala_keluarga_id?: string;

  @IsUUID()
  @IsOptional()
  rumah_id?: string;

  @IsString()
  status_kepemilikan: string;

  @IsString()
  status_keluarga: string;
}
