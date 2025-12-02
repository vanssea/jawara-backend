export class PopulationDashboardResponseDto {
  totalWarga: number;
  totalKeluarga: number;
  jenisKelamin: Array<{
    label: string;
    jumlah: number;
    persentase: number;
  }>;
  usiaKelompok: Array<{
    label: string;
    jumlah: number;
  }>;
  agama: Array<{
    label: string;
    jumlah: number;
  }>;
  pendidikan: Array<{
    label: string;
    jumlah: number;
  }>;
  pekerjaanTeratas: Array<{
    label: string;
    jumlah: number;
  }>;
  wargaPerBulan: Array<{
    bulan: string;
    jumlah: number;
  }>;
  statusKeluarga: Array<{
    label: string;
    jumlah: number;
  }>;
}
