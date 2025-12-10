// src/reports/dto/filter-pdf.dto.ts (Asumsi lokasi)

import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class FilterPdfDto {
  // WAJIB menggunakan 'reportType' agar cocok dengan Flutter body.reportType
  @IsNotEmpty()
  @IsString()
  @IsIn(['incoming', 'outgoing', 'all'])
  reportType: 'incoming' | 'outgoing' | 'all'; // <-- Perbaikan ini penting

  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsNotEmpty()
  @IsString()
  endDate: string;

  // ... tambahkan field filter lainnya di sini (misalnya kategoriIdKeluar, searchNama, dll.)
}