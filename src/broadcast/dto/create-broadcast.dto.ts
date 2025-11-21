import { ApiProperty } from '@nestjs/swagger';

export class CreateBroadcastDto {
  @ApiProperty({ example: 'Test judul' })
  judul: string;

  @ApiProperty({ example: 'Test pesan' })
  pesan: string;

  @ApiProperty({ example: '2025-11-19 10:16:00+07:00' })
  tanggal_publikasi: Date;

  @ApiProperty({ example: 'https://test_gambar.com' })
  link_lampiran_gambar: string;

  @ApiProperty({ example: 'https://test_dokumen.com' })
  link_lampiran_dokumen: string;
}
