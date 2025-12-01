import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransferChannelDto {
  @ApiProperty({ example: 'BRI Rekening Utama' })
  nama_channel: string;

  @ApiProperty({ example: 'BANK_TRANSFER' })
  tipe_channel: string;

  @ApiProperty({ example: '32a3d6ce-0a92-4e9e-b64e-88e7e2c1afaa' })
  pemilik: string;

  @ApiPropertyOptional({ example: 'Digunakan untuk pembayaran utama' })
  catatan?: string;

  @ApiPropertyOptional({
    example: 'transfer-channel/thumbnails/123.png',
  })
  thumbnail_path?: string;

  @ApiPropertyOptional({
    example: 'transfer-channel/qrs/123.png',
  })
  qr_path?: string;
}
