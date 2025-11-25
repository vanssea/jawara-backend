import { ApiProperty } from '@nestjs/swagger';

export class CreateExpensesDto {
  @ApiProperty({ example: 'Masukkan nama pengeluaran' })
  nama_pengeluaran: string;

  @ApiProperty({ example: '2025-11-19 10:16:00+07:00' })
  tanggal_pengeluaran: Date;

  @ApiProperty({ example: 1500000 })
  jumlah_pengeluaran: number;


  @ApiProperty({
    example: 'Makanan',
    description: 'Kategori pengeluaran yang dipilih dari daftar yang tersedia.',
    // Gunakan 'enum' untuk mendokumentasikan semua pilihan yang mungkin di Swagger
    enum: ['Transportasi', 'Makanan', 'Akomodasi', 'Lain-lain'], 
  })
  kategori: string;

  @ApiProperty({ example: '.jpg atau .png' })
  bukti_pengeluaran: string;
}
