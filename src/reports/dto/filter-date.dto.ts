import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FilterDateDto {
  @ApiProperty({ example: '2025-01-01', description: 'Start date (YYYY-MM-DD)' })
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2025-01-31', description: 'End date (YYYY-MM-DD)' })
  @IsString()
  endDate: string;
}
