import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { SupabaseService } from 'src/common/service/supabase.service';

type MockFn = jest.Mock;

describe('ReportsService', () => {
  let service: ReportsService;
  const mockFrom = jest.fn();
  const mockSupabaseService = { getClient: jest.fn().mockReturnValue({ from: mockFrom }) } as unknown as SupabaseService;

  function makeBuilder(result: any) {
    const promise = Promise.resolve(result);
    const builder: any = {
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      not: () => builder,
      eq: () => builder,
      gte: () => builder,
      lte: () => builder,
      order: () => promise,
      single: () => promise,
    };
    return builder;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    (mockFrom as MockFn).mockReset();
    (mockSupabaseService as any).getClient = jest.fn().mockReturnValue({ from: mockFrom });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  describe('findAllExpense', () => {
    it('combines pengeluaran and kegiatan rows sorted by date', async () => {
      const pengeluaran = [
        { id: 'p1', nama: 'X', kategori_id: 1, tanggal_transaksi: '2024-01-05', nominal: 100, tanggal_terverifikasi: '2024-01-05', created_at: '2024-01-05' },
      ];
      const kegiatan = [
        { id: 'k1', anggaran: 50, tanggal: '2024-01-03', created_at: '2024-01-03' },
      ];

      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pengeluaran') return { select: jest.fn().mockReturnValue(makeBuilder({ data: pengeluaran, error: null })) };
        if (table === 'kegiatan') return { select: jest.fn().mockReturnValue(makeBuilder({ data: kegiatan, error: null })) };
        return { select: jest.fn() };
      });

      const res = await service.findAllExpense();
      expect(res).toHaveLength(2);
      expect(res[0].tanggal_transaksi >= res[1].tanggal_transaksi).toBeTruthy();
      expect(res.find((r: any) => r.id === 'p1')?.tipe_transaksi).toBe('pengeluaran');
    });

    it('throws HttpException when pengeluaran query errors', async () => {
      (mockFrom as MockFn).mockImplementation(() => ({ select: jest.fn().mockReturnValue(makeBuilder({ data: null, error: { message: 'fail' } })) }));
      await expect(service.findAllExpense()).rejects.toThrow(HttpException);
    });
  });

  describe('findOneExpense', () => {
    it('returns pengeluaran when found', async () => {
      const row = { id: 'p1', nama: 'X', kategori_id: 1, tanggal_transaksi: '2024-01-05', nominal: 100, tanggal_terverifikasi: '2024-01-05', created_at: '2024-01-05' };
      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pengeluaran') return { select: jest.fn().mockReturnValue(makeBuilder({ data: row, error: null })) };
        return { select: jest.fn() };
      });

      const res = await service.findOneExpense('p1');
      expect((res as any).id).toBe('p1');
      expect((res as any).tipe_transaksi).toBe('pengeluaran');
    });

    it('falls back to kegiatan when pengeluaran not found', async () => {
      const kegiatan = { id: 'k1', anggaran: 75, tanggal: '2024-01-02', created_at: '2024-01-02' };

      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pengeluaran') return { select: jest.fn().mockReturnValue(makeBuilder({ data: null, error: null })) };
        if (table === 'kegiatan') return { select: jest.fn().mockReturnValue(makeBuilder({ data: kegiatan, error: null })) };
        return { select: jest.fn() };
      });

      const res = await service.findOneExpense('k1');
      expect((res as any).id).toBe('k1');
      expect((res as any).nama).toBe('Pengeluaran Kegiatan');
    });

    it('throws 404 when not found', async () => {
      (mockFrom as MockFn).mockImplementationOnce(() => ({ select: jest.fn().mockReturnValue(makeBuilder({ data: null, error: null })) }));
      (mockFrom as MockFn).mockImplementationOnce(() => ({ select: jest.fn().mockReturnValue(makeBuilder({ data: null, error: { message: 'no' } })) }));

      await expect(service.findOneExpense('x')).rejects.toThrow(HttpException);
    });
  });

  describe('findAllIncome', () => {
    it('returns combined tagihan and non-iuran with kategori mapping', async () => {
      const kategori = [{ id: 'k1', nama: 'K1', nominal: 100 }];
      const tagihan = [{ id: 't1', kategori_id: 'k1', nama: 'T1', periode: '2024-01-01', created_at: '2024-01-01', status: 'Lunas' }];
      const nonIuran = [{ id: 'n1', nominal: 200, tanggal_pemasukan: '2024-01-02', kategori_pemasukan: 'Donasi', created_at: '2024-01-02' }];

      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pemasukan_kategori_iuran') return { select: jest.fn().mockReturnValue(makeBuilder({ data: kategori, error: null })) };
        if (table === 'pemasukan_tagihan') return { select: jest.fn().mockReturnValue(makeBuilder({ data: tagihan, error: null })) };
        if (table === 'pemasukan_non_iuran') return { select: jest.fn().mockReturnValue(makeBuilder({ data: nonIuran, error: null })) };
        return { select: jest.fn() };
      });

      const res = await service.findAllIncome();
      expect(res.some((r: any) => r.tipe_transaksi === 'pemasukan_tagihan')).toBeTruthy();
      expect(res.some((r: any) => r.tipe_transaksi === 'pemasukan_non_iuran')).toBeTruthy();
    });

    it('throws HttpException when kategori query errors', async () => {
      const kategoriSelect = jest.fn().mockResolvedValue({ data: null, error: { message: 'err' } });
      (mockFrom as MockFn).mockImplementation(() => ({ select: kategoriSelect }));
      await expect(service.findAllIncome()).rejects.toThrow(HttpException);
    });
  });

  describe('findOneIncome', () => {
    it('returns tagihan when found', async () => {
      const kategori = [{ id: 'k1', nama: 'K1', nominal: 150 }];
      const tagihan = { id: 't1', kategori_id: 'k1', created_at: '2024-01-01', status: 'Lunas', periode: '2024-01-01' };

      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pemasukan_kategori_iuran') return { select: jest.fn().mockReturnValue(makeBuilder({ data: kategori, error: null })) };
        if (table === 'pemasukan_tagihan') return { select: jest.fn().mockReturnValue(makeBuilder({ data: tagihan, error: null })) };
        return { select: jest.fn() };
      });

      const res = await service.findOneIncome('t1');
      expect((res as any).id).toBe('t1');
      expect((res as any).tipe_transaksi).toBe('pemasukan_tagihan');
    });

    it('falls back to non-iuran when tagihan not found', async () => {
      const kategori = [];
      const nonIuran = { id: 'n1', nominal: 220, tanggal_pemasukan: '2024-01-05', kategori_pemasukan: 'Sumbang', created_at: '2024-01-05' };

      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pemasukan_kategori_iuran') return { select: jest.fn().mockReturnValue(makeBuilder({ data: kategori, error: null })) };
        if (table === 'pemasukan_tagihan') return { select: jest.fn().mockReturnValue(makeBuilder({ data: null, error: { message: 'not' } })) };
        if (table === 'pemasukan_non_iuran') return { select: jest.fn().mockReturnValue(makeBuilder({ data: nonIuran, error: null })) };
        return { select: jest.fn() };
      });

      const res = await service.findOneIncome('n1');
      expect((res as any).id).toBe('n1');
      expect((res as any).tipe_transaksi).toBe('pemasukan_non_iuran');
    });

    it('throws 404 when neither found', async () => {
      const kategoriSelect = jest.fn().mockResolvedValue({ data: [], error: null });
      const tagihanSelect = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: null }) }) });
      const nonIuranSelect = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: { message: 'no' } }) }) });

      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pemasukan_kategori_iuran') return { select: kategoriSelect };
        if (table === 'pemasukan_tagihan') return { select: tagihanSelect };
        if (table === 'pemasukan_non_iuran') return { select: nonIuranSelect };
        return { select: jest.fn() };
      });

      await expect(service.findOneIncome('x')).rejects.toThrow(HttpException);
    });
  });

  describe('generatePdfReport', () => {
    it('produces a Buffer for type all', async () => {
      // setup kategori maps
      const pengKategori = [{ id: 1, nama: 'Op' }];
      const pemasKategori = [{ id: 'k1', nama: 'Iuran', nominal: 100 }];

      // minimal rows
      const pengeluaran = [{ id: 'p1', nama: 'X', kategori_id: 1, tanggal_transaksi: '2024-01-05', nominal: 100, tanggal_terverifikasi: '2024-01-05', created_at: '2024-01-05' }];
      const kegiatan = [{ id: 'k1', anggaran: 50, tanggal: '2024-01-04', created_at: '2024-01-04' }];
      const tagihan = [{ id: 't1', kategori_id: 'k1', nama: 'Tag', periode: '2024-01-03', created_at: '2024-01-03', status: 'Lunas' }];
      const nonIuran = [{ id: 'n1', nominal: 200, tanggal_pemasukan: '2024-01-02', kategori_pemasukan: 'Don', created_at: '2024-01-02' }];

      // mock queries
      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pengeluaran_kategori') return { select: jest.fn().mockReturnValue(makeBuilder({ data: pengKategori, error: null })) };
        if (table === 'pemasukan_kategori_iuran') return { select: jest.fn().mockReturnValue(makeBuilder({ data: pemasKategori, error: null })) };
        if (table === 'pengeluaran') return { select: jest.fn().mockReturnValue(makeBuilder({ data: pengeluaran, error: null })) };
        if (table === 'kegiatan') return { select: jest.fn().mockReturnValue(makeBuilder({ data: kegiatan, error: null })) };
        if (table === 'pemasukan_tagihan') return { select: jest.fn().mockReturnValue(makeBuilder({ data: tagihan, error: null })) };
        if (table === 'pemasukan_non_iuran') return { select: jest.fn().mockReturnValue(makeBuilder({ data: nonIuran, error: null })) };
        return { select: jest.fn() };
      });

      // mock PDF document that emits data and end when end() called
      const dataHandlers: Array<(b: any) => void> = [];
      const endHandlers: Array<() => void> = [];
      const mockDoc: any = {
        on: (evt: string, cb: any) => {
          if (evt === 'data') dataHandlers.push(cb);
          if (evt === 'end') endHandlers.push(cb);
        },
        fontSize: () => mockDoc,
        text: () => mockDoc,
        moveDown: () => mockDoc,
        font: () => mockDoc,
        end: () => {
          // emit a single data chunk then end — do asynchronously so
          // handlers registered after doc.end() still receive the events
          setImmediate(() => {
            dataHandlers.forEach((h) => h(Buffer.from('chunk')));
            endHandlers.forEach((h) => h());
          });
        },
      };

      service.setPdfFactory(() => mockDoc);

      const buf = await service.generatePdfReport('all', '2024-01-01', '2024-01-31');
      expect(Buffer.isBuffer(buf)).toBeTruthy();
      expect(buf.length).toBeGreaterThan(0);
    });

    it('throws HttpException when kategori query errors', async () => {
      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pengeluaran_kategori') return { select: jest.fn().mockReturnValue(makeBuilder({ data: null, error: { message: 'err' } })) };
        return { select: jest.fn() };
      });
      service.setPdfFactory(() => ({ on: () => {}, fontSize: () => {}, text: () => {}, moveDown: () => {}, font: () => {}, end: () => {} }));
      await expect(service.generatePdfReport('all', '2024-01-01', '2024-01-31')).rejects.toThrow(HttpException);
    });
  });
});
