export class FinanceDashboardResponseDto {
  totalPemasukan: number;
  totalPemasukanTagihan: number;
  totalPemasukanNonIuran: number;
  totalPengeluaran: number;
  saldoBersih: number;
  totalTransaksi: number;
  pemasukanPerKategori: Array<{
    kategori: string;
    jumlahTransaksi: number;
    totalNominal: number;
  }>;
  pengeluaranPerKategori: Array<{
    kategori: string;
    jumlahTransaksi: number;
    totalNominal: number;
  }>;
  pemasukanPerBulan: Array<{
    bulan: string;
    totalNominal: number;
  }>;
  pengeluaranPerBulan: Array<{
    bulan: string;
    totalNominal: number;
  }>;
}
