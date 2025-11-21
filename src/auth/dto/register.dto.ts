import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'password' })
  password: string;

  @ApiProperty({ example: 'John' })
  name: string;
}
