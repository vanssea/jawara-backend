import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../enum/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  nama: string;

  @ApiProperty({ example: 'budi@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '081234567890' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  confirm_password: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.KETUA_RT,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
