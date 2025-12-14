import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SupabaseService } from 'src/common/service/supabase.service';

type MockFn = jest.Mock;

describe('DashboardService', () => {
  let service: DashboardService;
  const mockFrom = jest.fn();
  const mockSupabaseService = {
    getClient: jest.fn().mockReturnValue({ from: mockFrom }),
  } as unknown as SupabaseService;

  beforeEach(async () => {
    jest.clearAllMocks();
    // resetMocks=true in jest config wipes implementations; reapply the chain here
    (mockFrom as MockFn).mockReset();
    (mockSupabaseService as any).getClient = jest
      .fn()
      .mockReturnValue({ from: mockFrom });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  describe('getEventDashboard', () => {
    it('returns aggregated event dashboard data', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-01-15T00:00:00Z'));

      const kegiatanData = [
        { id: 1, kategori_id: 10, tanggal: '2024-01-14', penanggung_jawab: 'w1' },
        { id: 2, kategori_id: 10, tanggal: '2024-01-15', penanggung_jawab: 'w1' },
        { id: 3, kategori_id: 99, tanggal: '2024-01-20', penanggung_jawab: 'w2' },
      ];
      const kategoriData = [{ id: 10, nama: 'Umum' }];

      const kegiatanSelect = jest.fn().mockResolvedValue({ data: kegiatanData, error: null });
      const kategoriSelect = jest.fn().mockResolvedValue({ data: kategoriData, error: null });
      const wargaSelect = jest.fn().mockReturnValue({
        eq: jest.fn((_, wargaId: string) => ({
          single: jest.fn().mockResolvedValue({
            data: { nama: wargaId === 'w1' ? 'Budi' : 'Wati' },
            error: null,
          }),
        })),
      });

      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'kegiatan') return { select: kegiatanSelect };
        if (table === 'kegiatan_kategori') return { select: kategoriSelect };
        if (table === 'data_warga') return { select: wargaSelect };
        return { select: jest.fn() };
      });

      const result = await service.getEventDashboard();

      expect(result.totalKegiatan).toBe(3);
      expect(result.kegiatanPerKategori).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kategori: 'Umum', jumlah: 2, persentase: 67 }),
          expect.objectContaining({ kategori: 'Lainnya', jumlah: 1, persentase: 33 }),
        ]),
      );
      expect(result.kegiatanBerdasarkanWaktu).toEqual({ sudahLewat: 1, hariIni: 1, akanDatang: 1 });
      expect(result.penanggungJawabTerbanyak).toEqual(
        expect.arrayContaining([
          { nama: 'Budi', jumlah: 2 },
          { nama: 'Wati', jumlah: 1 },
        ]),
      );
      expect(result.kegiatanPerBulan.find((m) => m.bulan === 'Jan')?.jumlah).toBe(3);

      jest.useRealTimers();
    });

    it('throws HttpException when supabase returns error', async () => {
      const kegiatanSelect = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
      (mockFrom as MockFn).mockImplementation(() => ({ select: kegiatanSelect }));

      await expect(service.getEventDashboard()).rejects.toThrow(HttpException);
    });
  });

  describe('getPopulationDashboard', () => {
    it('aggregates population data', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-01-15T00:00:00Z'));

      const wargaData = [
        { id: '1', jenis_kelamin: 'Pria', tanggal_lahir: '2000-01-01', agama: 'Islam', pendidikan_terakhir: 'S1', pekerjaan: 'Guru', created_at: '2024-01-02', status: 'aktif' },
        { id: '2', jenis_kelamin: 'Wanita', tanggal_lahir: '1980-05-01', agama: 'Kristen', pendidikan_terakhir: 'SMA', pekerjaan: 'Dokter', created_at: '2024-02-03', status: 'nonaktif' },
      ];
      const keluargaData = [{ id: 'kel-1', created_at: '2024-01-01' }];

      const wargaOr = jest.fn().mockResolvedValue({ data: wargaData, error: null });
      const wargaSelect = jest.fn().mockReturnValue({ or: wargaOr });
      const keluargaSelect = jest.fn().mockResolvedValue({ data: keluargaData, error: null });

      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'data_warga') return { select: wargaSelect };
        if (table === 'data_keluarga') return { select: keluargaSelect };
        return { select: jest.fn() };
      });

      const result = await service.getPopulationDashboard();

      expect(result.totalWarga).toBe(2);
      expect(result.totalKeluarga).toBe(1);
      expect(result.jenisKelamin).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: 'Pria', jumlah: 1 }),
          expect.objectContaining({ label: 'Wanita', jumlah: 1 }),
        ]),
      );
      expect(result.usiaKelompok).toEqual(expect.arrayContaining([expect.objectContaining({ label: '26-40' })]));
      expect(result.wargaPerBulan.find((m) => m.bulan === 'Jan')?.jumlah).toBe(1);
      expect(result.wargaPerBulan.find((m) => m.bulan === 'Feb')?.jumlah).toBe(1);

      jest.useRealTimers();
    });

    it('throws HttpException when warga query errors', async () => {
      const wargaOr = jest.fn().mockResolvedValue({ data: null, error: { message: 'pop fail' } });
      const wargaSelect = jest.fn().mockReturnValue({ or: wargaOr });
      (mockFrom as MockFn).mockImplementation(() => ({ select: wargaSelect }));

      await expect(service.getPopulationDashboard()).rejects.toThrow(HttpException);
    });
  });

  describe('getFinanceDashboard', () => {
    it('computes finance summary', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-01-15T00:00:00Z'));

      const tagihanData = [
        { id: 't1', kategori_id: 'k1', periode: '2024-01-01', status: 'Lunas', created_at: '2024-01-01' },
        { id: 't2', kategori_id: 'k1', periode: '2024-02-01', status: 'Lunas', created_at: '2024-02-01' },
      ];
      const kategoriData = [
        { id: 'k1', nama: 'Kategori A', nominal: 100 },
      ];
      const nonIuranData = [
        { id: 'n1', nominal: 200, tanggal_pemasukan: '2024-01-10', kategori_pemasukan: 'Donasi', created_at: '2024-01-10' },
      ];
      const pengeluaranData = [
        { id: 'p1', nominal: 80, kategori_id: 1, tanggal_transaksi: '2024-01-05', created_at: '2024-01-05' },
      ];
      const kegiatanAnggaranData = [
        { id: 'keg1', anggaran: 50, tanggal: '2024-01-15', created_at: '2024-01-15' },
      ];
      const pengeluaranKategoriData = [{ id: 1, nama: 'Operasional' }];

      const tagihanEq = jest.fn().mockResolvedValue({ data: tagihanData, error: null });
      const tagihanSelect = jest.fn().mockReturnValue({ eq: tagihanEq });
      const kategoriSelect = jest.fn().mockResolvedValue({ data: kategoriData, error: null });
      const nonIuranSelect = jest.fn().mockResolvedValue({ data: nonIuranData, error: null });
      const pengeluaranNot = jest.fn().mockResolvedValue({ data: pengeluaranData, error: null });
      const pengeluaranSelect = jest.fn().mockReturnValue({ not: pengeluaranNot });
      const kegiatanNot = jest.fn().mockResolvedValue({ data: kegiatanAnggaranData, error: null });
      const kegiatanSelect = jest.fn().mockReturnValue({ not: kegiatanNot });
      const pengeluaranKategoriSelect = jest.fn().mockResolvedValue({ data: pengeluaranKategoriData, error: null });

      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pemasukan_tagihan') return { select: tagihanSelect };
        if (table === 'pemasukan_kategori_iuran') return { select: kategoriSelect };
        if (table === 'pemasukan_non_iuran') return { select: nonIuranSelect };
        if (table === 'pengeluaran') return { select: pengeluaranSelect };
        if (table === 'kegiatan') return { select: kegiatanSelect };
        if (table === 'pengeluaran_kategori') return { select: pengeluaranKategoriSelect };
        return { select: jest.fn() };
      });

      const result = await service.getFinanceDashboard();

      expect(result.totalPemasukan).toBe(400);
      expect(result.totalPengeluaran).toBe(130);
      expect(result.saldoBersih).toBe(270);
      expect(result.totalTransaksi).toBe(5);
      expect(result.pemasukanPerKategori).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kategori: 'Kategori A', totalNominal: 200, jumlahTransaksi: 2 }),
          expect.objectContaining({ kategori: 'Donasi', totalNominal: 200, jumlahTransaksi: 1 }),
        ]),
      );
      expect(result.pengeluaranPerKategori).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kategori: 'Operasional', totalNominal: 80 }),
          expect.objectContaining({ kategori: 'Kegiatan', totalNominal: 50 }),
        ]),
      );
      expect(result.pemasukanPerBulan.find((m) => m.bulan === 'Jan')?.totalNominal).toBe(300);
      expect(result.pemasukanPerBulan.find((m) => m.bulan === 'Feb')?.totalNominal).toBe(100);
      expect(result.pengeluaranPerBulan.find((m) => m.bulan === 'Jan')?.totalNominal).toBe(130);

      jest.useRealTimers();
    });

    it('throws HttpException when finance query fails', async () => {
      const tagihanSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'finance fail' } }),
      });
      (mockFrom as MockFn).mockImplementation(() => ({ select: tagihanSelect }));

      await expect(service.getFinanceDashboard()).rejects.toThrow(HttpException);
    });
  });
});
