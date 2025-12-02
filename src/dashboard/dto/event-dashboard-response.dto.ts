export class EventDashboardResponseDto {
  totalKegiatan: number;
  kegiatanPerKategori: Array<{
    kategori: string;
    jumlah: number;
    persentase: number;
  }>;
  kegiatanBerdasarkanWaktu: {
    sudahLewat: number;
    hariIni: number;
    akanDatang: number;
  };
  penanggungJawabTerbanyak: Array<{
    nama: string;
    jumlah: number;
  }>;
  kegiatanPerBulan: Array<{
    bulan: string;
    jumlah: number;
  }>;
  tingkatPartisipasi: {
    persentase: number;
    totalPeserta: number;
    totalUndangan: number;
  };
}
