import { 
  IsString, 
  IsUUID, 
  IsOptional, 
  IsNumber, 
  IsDateString, 
  IsInt 
} from 'class-validator';

export class CreateExpensesDto {
  @IsString()
  nama: string;

  @IsInt()
  kategori_id: number;

  @IsDateString()
  tanggal_transaksi: string;

  @IsNumber()
  nominal: number;

  @IsOptional()
  @IsDateString()
  tanggal_terverifikasi?: string;

  @IsOptional()
  @IsUUID()
  verifikator?: string;
}
function IsNotEmpty(arg0: { message: string; }): (target: CreateExpensesDto, propertyKey: "nama") => void {
  throw new Error('Function not implemented.');
}

