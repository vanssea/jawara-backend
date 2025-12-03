import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRumahDto {
  @ApiProperty({ example: 'Jalan Merdeka No. 1' })
  @IsString()
  @IsNotEmpty()
  alamat: string;

  @ApiProperty({ example: 'aktif' })
  @IsString()
  @IsNotEmpty()
  status: string;
}
