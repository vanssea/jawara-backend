import { Injectable, HttpException } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { EventDashboardResponseDto } from './dto/event-dashboard-response.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getEventDashboard(): Promise<EventDashboardResponseDto> {
    try {
      const client = this.supabaseService.getClient();

      // Fetch all kegiatan
      const { data: kegiatanData, error: kegiatanError } = await client
        .from('kegiatan')
        .select('*');

      if (kegiatanError) throw new HttpException(kegiatanError.message, 500);

      const totalKegiatan = kegiatanData?.length || 0;

      // Fetch kategori data
      const { data: kategoriData, error: kategoriError } = await client
        .from('kegiatan_kategori')
        .select('id, nama');

      if (kategoriError) throw new HttpException(kategoriError.message, 500);

      // Map kategori by id
      const kategoriMap = (kategoriData || []).reduce(
        (acc: Record<number, string>, row: any) => {
          acc[row.id] = row.nama;
          return acc;
        },
        {},
      );

      // Calculate kegiatan per kategori
      const kategoriCount: Record<string, number> = {};
      (kegiatanData || []).forEach((kegiatan: any) => {
        const kategoriName = kegiatan.kategori_id
          ? kategoriMap[kegiatan.kategori_id] || 'Lainnya'
          : 'Lainnya';
        kategoriCount[kategoriName] = (kategoriCount[kategoriName] || 0) + 1;
      });

      const kegiatanPerKategori = Object.entries(kategoriCount).map(
        ([kategori, jumlah]) => ({
          kategori,
          jumlah,
          persentase: totalKegiatan > 0 ? Math.round((jumlah / totalKegiatan) * 100) : 0,
        }),
      );

      // Calculate kegiatan berdasarkan waktu
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let sudahLewat = 0;
      let hariIni = 0;
      let akanDatang = 0;

      (kegiatanData || []).forEach((kegiatan: any) => {
        if (!kegiatan.tanggal) return;
        const tanggal = new Date(kegiatan.tanggal);
        tanggal.setHours(0, 0, 0, 0);

        if (tanggal < today) {
          sudahLewat++;
        } else if (tanggal.getTime() === today.getTime()) {
          hariIni++;
        } else {
          akanDatang++;
        }
      });

      // Calculate penanggung jawab terbanyak (top 5)
      const penanggungJawabCount: Record<string, number> = {};
      (kegiatanData || []).forEach((kegiatan: any) => {
        if (kegiatan.penanggung_jawab) {
          penanggungJawabCount[kegiatan.penanggung_jawab] =
            (penanggungJawabCount[kegiatan.penanggung_jawab] || 0) + 1;
        }
      });

      const topPenanggungJawabIds = Object.entries(penanggungJawabCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Fetch warga names for penanggung jawab
      const penanggungJawabTerbanyak: Array<{ nama: string; jumlah: number }> = [];
      for (const [wargaId, jumlah] of topPenanggungJawabIds) {
        const { data: warga, error: wargaError } = await client
          .from('data_warga')
          .select('nama')
          .eq('id', wargaId)
          .single();

        if (!wargaError && warga) {
          penanggungJawabTerbanyak.push({
            nama: warga.nama,
            jumlah,
          });
        }
      }

      // Calculate kegiatan per bulan (current year)
      const currentYear = new Date().getFullYear();
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      const kegiatanPerBulan = monthNames.map((bulan, index) => {
        const jumlah = (kegiatanData || []).filter((kegiatan: any) => {
          if (!kegiatan.tanggal) return false;
          const date = new Date(kegiatan.tanggal);
          return date.getFullYear() === currentYear && date.getMonth() === index;
        }).length;
        return { bulan, jumlah };
      });

      // Calculate tingkat partisipasi (mock data - adjust based on your schema)
      // Assuming you might have participant data in the future
      const totalUndangan = totalKegiatan * 10; // Mock: 10 invitations per event
      const totalPeserta = Math.floor(totalUndangan * 0.78); // Mock: 78% attendance
      const persentase = totalUndangan > 0 
        ? Math.round((totalPeserta / totalUndangan) * 100) 
        : 0;

      return {
        totalKegiatan,
        kegiatanPerKategori,
        kegiatanBerdasarkanWaktu: {
          sudahLewat,
          hariIni,
          akanDatang,
        },
        penanggungJawabTerbanyak,
        kegiatanPerBulan,
        tingkatPartisipasi: {
          persentase,
          totalPeserta,
          totalUndangan,
        },
      };
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
