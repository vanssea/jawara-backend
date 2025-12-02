import { Injectable, HttpException } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { EventDashboardResponseDto } from './dto/event-dashboard-response.dto';
import { PopulationDashboardResponseDto } from './dto/population-dashboard-response.dto';
import { FinanceDashboardResponseDto } from './dto/finance-dashboard-response.dto';

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

  async getPopulationDashboard(): Promise<PopulationDashboardResponseDto> {
    try {
      const client = this.supabaseService.getClient();

      // Fetch warga and keluarga data
      const { data: wargaData, error: wargaError } = await client
        .from('data_warga')
        .select('id, jenis_kelamin, tanggal_lahir, agama, pendidikan_terakhir, pekerjaan, created_at');
      if (wargaError) throw new HttpException(wargaError.message, 500);

      const { data: keluargaData, error: keluargaError } = await client
        .from('data_keluarga')
        .select('id, status_keluarga, created_at');
      if (keluargaError) throw new HttpException(keluargaError.message, 500);

      const totalWarga = wargaData?.length || 0;
      const totalKeluarga = keluargaData?.length || 0;

      // Jenis kelamin distribusi
      const jkCount: Record<string, number> = {};
      (wargaData || []).forEach((w: any) => {
        const raw = (w.jenis_kelamin || 'Tidak diketahui').toString().trim();
        const key = raw.length === 0 ? 'Tidak diketahui' : raw;
        jkCount[key] = (jkCount[key] || 0) + 1;
      });
      const jenisKelamin = Object.entries(jkCount).map(([label, jumlah]) => ({
        label,
        jumlah,
        persentase: totalWarga > 0 ? Math.round((jumlah / totalWarga) * 100) : 0,
      }));

      // Kelompok usia
      const ageBuckets: Record<string, number> = {
        '0-12': 0,
        '13-17': 0,
        '18-25': 0,
        '26-40': 0,
        '41-60': 0,
        '60+': 0,
      };
      const now = new Date();
      (wargaData || []).forEach((w: any) => {
        if (!w.tanggal_lahir) return;
        const dob = new Date(w.tanggal_lahir);
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
        if (age <= 12) ageBuckets['0-12']++;
        else if (age <= 17) ageBuckets['13-17']++;
        else if (age <= 25) ageBuckets['18-25']++;
        else if (age <= 40) ageBuckets['26-40']++;
        else if (age <= 60) ageBuckets['41-60']++;
        else ageBuckets['60+']++;
      });
      const usiaKelompok = Object.entries(ageBuckets).map(([label, jumlah]) => ({ label, jumlah }));

      // Agama distribusi
      const agamaCount: Record<string, number> = {};
      (wargaData || []).forEach((w: any) => {
        const key = (w.agama || 'Tidak diketahui').toString().trim() || 'Tidak diketahui';
        agamaCount[key] = (agamaCount[key] || 0) + 1;
      });
      const agama = Object.entries(agamaCount).map(([label, jumlah]) => ({ label, jumlah }));

      // Pendidikan distribusi
      const pendidikanCount: Record<string, number> = {};
      (wargaData || []).forEach((w: any) => {
        const key = (w.pendidikan_terakhir || 'Tidak diketahui').toString().trim() || 'Tidak diketahui';
        pendidikanCount[key] = (pendidikanCount[key] || 0) + 1;
      });
      const pendidikan = Object.entries(pendidikanCount).map(([label, jumlah]) => ({ label, jumlah }));

      // Pekerjaan teratas (top 5)
      const pekerjaanCount: Record<string, number> = {};
      (wargaData || []).forEach((w: any) => {
        const key = (w.pekerjaan || 'Tidak diketahui').toString().trim() || 'Tidak diketahui';
        pekerjaanCount[key] = (pekerjaanCount[key] || 0) + 1;
      });
      const pekerjaanTeratas = Object.entries(pekerjaanCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, jumlah]) => ({ label, jumlah }));

      // Warga per bulan (tahun berjalan) berdasarkan created_at
      const currentYear = new Date().getFullYear();
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des',
      ];
      const wargaPerBulan = monthNames.map((bulan, index) => {
        const jumlah = (wargaData || []).filter((w: any) => {
          if (!w.created_at) return false;
          const d = new Date(w.created_at);
          return d.getFullYear() === currentYear && d.getMonth() === index;
        }).length;
        return { bulan, jumlah };
      });

      // Status keluarga distribusi (opsional, dari data_keluarga)
      const statusKeluargaCount: Record<string, number> = {};
      (keluargaData || []).forEach((k: any) => {
        const key = (k.status_keluarga || 'Tidak diketahui').toString().trim() || 'Tidak diketahui';
        statusKeluargaCount[key] = (statusKeluargaCount[key] || 0) + 1;
      });
      const statusKeluarga = Object.entries(statusKeluargaCount).map(([label, jumlah]) => ({ label, jumlah }));

      return {
        totalWarga,
        totalKeluarga,
        jenisKelamin,
        usiaKelompok,
        agama,
        pendidikan,
        pekerjaanTeratas,
        wargaPerBulan,
        statusKeluarga,
      };
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async getFinanceDashboard(): Promise<FinanceDashboardResponseDto> {
    try {
      const client = this.supabaseService.getClient();

      const { data: tagihanData, error: tagihanError } = await client
        .from('pemasukan_tagihan')
        .select('id, kategori_id, created_at, status, periode')
        .eq('status', 'Lunas');
      if (tagihanError) throw new HttpException(tagihanError.message, 500);

      const { data: kategoriData, error: kategoriError } = await client
        .from('pemasukan_kategori_iuran')
        .select('id, nama, nominal');
      if (kategoriError) throw new HttpException(kategoriError.message, 500);

      const { data: nonIuranData, error: nonIuranError } = await client
        .from('pemasukan_non_iuran')
        .select('id, nominal, tanggal_pemasukan, kategori_pemasukan, created_at');
      if (nonIuranError) throw new HttpException(nonIuranError.message, 500);

      const { data: pengeluaranData, error: pengeluaranError } = await client
        .from('pengeluaran')
        .select('id, nama, tanggal_transaksi, nominal, kategori_id, created_at, tanggal_terverifikasi')
        .not('tanggal_terverifikasi', 'is', null);
      if (pengeluaranError) throw new HttpException(pengeluaranError.message, 500);

      const { data: pengeluaranKategoriData, error: pengeluaranKategoriError } = await client
        .from('pengeluaran_kategori')
        .select('id, nama');
      if (pengeluaranKategoriError) throw new HttpException(pengeluaranKategoriError.message, 500);

      const kategoriMap = new Map<string, { nama: string; nominal: number }>();
      (kategoriData || []).forEach((row: any) => {
        kategoriMap.set(row.id, {
          nama: row.nama || 'Tidak diketahui',
          nominal: Number(row.nominal) || 0,
        });
      });

      let totalPemasukanTagihan = 0;
      const kategoriSummary: Record<string, { totalNominal: number; jumlahTransaksi: number }> = {};
      const monthAgg: Record<number, number> = {};

      (tagihanData || []).forEach((row: any) => {
        const kategori = row.kategori_id ? kategoriMap.get(row.kategori_id) : undefined;
        if (!kategori) return;

        const nominal = kategori.nominal;
        totalPemasukanTagihan += nominal;

        const key = kategori.nama;
        if (!kategoriSummary[key]) {
          kategoriSummary[key] = { totalNominal: 0, jumlahTransaksi: 0 };
        }
        kategoriSummary[key].totalNominal += nominal;
        kategoriSummary[key].jumlahTransaksi += 1;

        const periodeDate = row.periode ? new Date(row.periode) : row.created_at ? new Date(row.created_at) : null;
        if (periodeDate && !Number.isNaN(periodeDate.getTime())) {
          const monthIndex = periodeDate.getMonth();
          monthAgg[monthIndex] = (monthAgg[monthIndex] || 0) + nominal;
        }
      });

      let totalPemasukanNonIuran = 0;
      (nonIuranData || []).forEach((row: any) => {
        const nominal = Number(row.nominal) || 0;
        totalPemasukanNonIuran += nominal;

        // Add to kategori summary
        const kategoriNama = row.kategori_pemasukan || 'Lainnya';
        if (!kategoriSummary[kategoriNama]) {
          kategoriSummary[kategoriNama] = { totalNominal: 0, jumlahTransaksi: 0 };
        }
        kategoriSummary[kategoriNama].totalNominal += nominal;
        kategoriSummary[kategoriNama].jumlahTransaksi += 1;

        const tanggal = row.tanggal_pemasukan || row.created_at;
        if (tanggal) {
          const date = new Date(tanggal);
          const monthIndex = date.getMonth();
          monthAgg[monthIndex] = (monthAgg[monthIndex] || 0) + nominal;
        }
      });

      // Create map for pengeluaran kategori
      const pengeluaranKategoriMap = new Map<number, string>();
      (pengeluaranKategoriData || []).forEach((row: any) => {
        pengeluaranKategoriMap.set(row.id, row.nama || 'Tidak diketahui');
      });

      // Process pengeluaran
      let totalPengeluaran = 0;
      const pengeluaranKategoriSummary: Record<string, { totalNominal: number; jumlahTransaksi: number }> = {};
      const pengeluaranMonthAgg: Record<number, number> = {};

      (pengeluaranData || []).forEach((row: any) => {
        const nominal = Number(row.nominal) || 0;
        totalPengeluaran += nominal;

        const kategoriNama = row.kategori_id 
          ? pengeluaranKategoriMap.get(row.kategori_id) || 'Lainnya'
          : 'Lainnya';
        
        if (!pengeluaranKategoriSummary[kategoriNama]) {
          pengeluaranKategoriSummary[kategoriNama] = { totalNominal: 0, jumlahTransaksi: 0 };
        }
        pengeluaranKategoriSummary[kategoriNama].totalNominal += nominal;
        pengeluaranKategoriSummary[kategoriNama].jumlahTransaksi += 1;

        const tanggal = row.tanggal_transaksi || row.created_at;
        if (tanggal) {
          const date = new Date(tanggal);
          const monthIndex = date.getMonth();
          pengeluaranMonthAgg[monthIndex] = (pengeluaranMonthAgg[monthIndex] || 0) + nominal;
        }
      });

      const totalTransaksi = (tagihanData?.length || 0) + (nonIuranData?.length || 0) + (pengeluaranData?.length || 0);
      const totalPemasukan = totalPemasukanTagihan + totalPemasukanNonIuran;
      const saldoBersih = totalPemasukan - totalPengeluaran;

      const pemasukanPerKategori = Object.entries(kategoriSummary)
        .map(([kategori, value]) => ({
          kategori,
          jumlahTransaksi: value.jumlahTransaksi,
          totalNominal: value.totalNominal,
        }))
        .sort((a, b) => b.totalNominal - a.totalNominal);

      const pengeluaranPerKategori = Object.entries(pengeluaranKategoriSummary)
        .map(([kategori, value]) => ({
          kategori,
          jumlahTransaksi: value.jumlahTransaksi,
          totalNominal: value.totalNominal,
        }))
        .sort((a, b) => b.totalNominal - a.totalNominal);

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des',
      ];
      const pemasukanPerBulan = monthNames.map((bulan, index) => ({
        bulan,
        totalNominal: monthAgg[index] || 0,
      }));

      const pengeluaranPerBulan = monthNames.map((bulan, index) => ({
        bulan,
        totalNominal: pengeluaranMonthAgg[index] || 0,
      }));

      return {
        totalPemasukan,
        totalPemasukanTagihan,
        totalPemasukanNonIuran,
        totalPengeluaran,
        saldoBersih,
        totalTransaksi,
        pemasukanPerKategori,
        pengeluaranPerKategori,
        pemasukanPerBulan,
        pengeluaranPerBulan,
      };
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
