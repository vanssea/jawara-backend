import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { SupabaseService } from 'src/common/service/supabase.service';

jest.mock('utils/log.utils', () => ({
  createActivity: jest.fn((t, n) => `create:${t}:${n}`),
  updateActivity: jest.fn((t, n) => `update:${t}:${n}`),
  deleteActivity: jest.fn((t, n) => `delete:${t}:${n}`),
}));

type MockFn = jest.Mock;

describe('ExpensesService', () => {
  let service: ExpensesService;
  const mockFrom = jest.fn();
  const mockGetAdmin = jest.fn();
  const mockSupabaseService = {
    getClient: jest.fn().mockReturnValue({ from: mockFrom }),
    getAdminClient: jest.fn().mockReturnValue(mockGetAdmin()),
  } as unknown as SupabaseService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (mockFrom as MockFn).mockReset();
    (mockSupabaseService as any).getClient = jest
      .fn()
      .mockReturnValue({ from: mockFrom });
    (mockSupabaseService as any).getAdminClient = jest
      .fn()
      .mockReturnValue(mockGetAdmin());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpensesService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get(ExpensesService);
  });

  describe('create', () => {
    it('inserts expense, records activity and attaches verifikator name', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-01-15T00:00:00Z'));

      const inserted = {
        id: 'e1',
        nama: 'Expense A',
        kategori: { id: 1, nama: 'Office' },
        verifikator: 'u1',
      };

      const adminClient = { auth: { admin: { getUserById: jest.fn().mockResolvedValue({ data: { user: { user_metadata: { full_name: 'Admin Name' }, email: 'a@b' } } }) } } };
      mockGetAdmin.mockReturnValue(adminClient);

      const pengeluaranInsert = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: inserted, error: null }) }) });
      const aktivitasInsert = jest.fn().mockResolvedValue({ data: null, error: null });

      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pengeluaran') return { insert: pengeluaranInsert };
        if (table === 'aktivitas') return { insert: aktivitasInsert };
        return { select: jest.fn() };
      });

      const body = { nama: 'Expense A', kategori_id: 1, tanggal_transaksi: '2024-01-01', nominal: 100, verifikator: 'u1' } as any;

      const res = await service.create('actor1', body);

      expect(res.nama).toBe('Expense A');
      expect(res.kategori_nama).toBe('Office');
      expect(res.verifikator_nama).toBe('Admin Name');

      expect(mockFrom).toHaveBeenCalled();
      expect(aktivitasInsert).toHaveBeenCalledWith({ aktor_id: 'actor1', deskripsi: expect.any(String) });

      jest.useRealTimers();
    });

    it('throws HttpException when insert returns error', async () => {
      const pengeluaranInsert = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }) }) });
      (mockFrom as MockFn).mockImplementation(() => ({ insert: pengeluaranInsert }));

      await expect(service.create('actor', { nama: 'x' } as any)).rejects.toThrow(HttpException);
    });
  });

  describe('findAll', () => {
    it('returns mapped array and attaches verifikator names', async () => {
      const data = [
        { id: 'e1', nama: 'A', kategori: { id: 1, nama: 'Cat' }, verifikator: 'u1' },
      ];

      const adminClient = { auth: { admin: { getUserById: jest.fn().mockResolvedValue({ data: { user: { user_metadata: { full_name: 'Ver' } } } }) } } };
      mockGetAdmin.mockReturnValue(adminClient);

      const pengeluaranSelect = jest.fn().mockResolvedValue({ data, error: null });
      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pengeluaran') return { select: pengeluaranSelect };
        return { select: jest.fn() };
      });

      const res = await service.findAll();
      expect(res).toHaveLength(1);
      expect((res as any[])[0].kategori_nama).toBe('Cat');
      expect((res as any[])[0].verifikator_nama).toBe('Ver');
    });

    it('throws HttpException when select errors', async () => {
      const pengeluaranSelect = jest.fn().mockResolvedValue({ data: null, error: { message: 'err' } });
      (mockFrom as MockFn).mockImplementation(() => ({ select: pengeluaranSelect }));

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  describe('findCategories', () => {
    it('returns category list', async () => {
      const cats = [{ id: 1, nama: 'A' }];
      const select = jest.fn().mockResolvedValue({ data: cats, error: null });
      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pengeluaran_kategori') return { select };
        return { select: jest.fn() };
      });

      const res = await service.findCategories();
      expect(res).toEqual(cats);
    });

    it('throws HttpException on error', async () => {
      const select = jest.fn().mockResolvedValue({ data: null, error: { message: 'err' } });
      (mockFrom as MockFn).mockImplementation(() => ({ select }));
      await expect(service.findCategories()).rejects.toThrow(HttpException);
    });
  });

  describe('findOne', () => {
    it('returns mapped single item', async () => {
      const row = { id: 'e1', nama: 'One', kategori: { id: 2, nama: 'K' }, verifikator: 'u1' };
      const pengeluaranSelect = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: row, error: null }) }) });
      const adminClient = { auth: { admin: { getUserById: jest.fn().mockResolvedValue({ data: { user: { user_metadata: { full_name: 'VN' } } } }) } } };
      mockGetAdmin.mockReturnValue(adminClient);

      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pengeluaran') return { select: pengeluaranSelect };
        return { select: jest.fn() };
      });

      const res = await service.findOne('e1');
      expect((res as any).nama).toBe('One');
      expect((res as any).verifikator_nama).toBe('VN');
    });

    it('throws HttpException when query errors', async () => {
      const pengeluaranSelect = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: { message: 'err' } }) }) });
      (mockFrom as MockFn).mockImplementation(() => ({ select: pengeluaranSelect }));
      await expect(service.findOne('x')).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('updates record and logs activity', async () => {
      const updated = { id: 'e1', nama: 'Upd', kategori: { id: 1, nama: 'C' }, verifikator: null };
      const updateChain = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: updated, error: null }) }) }) });
      const aktivitasInsert = jest.fn().mockResolvedValue({ data: null, error: null });

      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pengeluaran') return { update: updateChain, insert: jest.fn() };
        if (table === 'aktivitas') return { insert: aktivitasInsert };
        return { select: jest.fn() };
      });

      const res = await service.update('actor', 'e1', { nama: 'Upd' } as any);
      expect((res as any).nama).toBe('Upd');
      expect(aktivitasInsert).toHaveBeenCalledWith({ aktor_id: 'actor', deskripsi: expect.any(String) });
    });

    it('throws HttpException when update returns error', async () => {
      const updateChain = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: { message: 'err' } }) }) }) });
      (mockFrom as MockFn).mockImplementation(() => ({ update: updateChain }));
      await expect(service.update('a', 'b', {} as any)).rejects.toThrow(HttpException);
    });
  });

  describe('remove', () => {
    it('deletes record and logs delete activity', async () => {
      const found = { id: 'e1', judul: 'ToDelete' } as any;

      const selectChain = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: found, error: null }) }) });
      const deleteChain = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });
      const insertAfterDelete = jest.fn().mockResolvedValue({ data: null, error: null });

      (mockFrom as MockFn).mockImplementation((table: string) => {
        if (table === 'pengeluaran') return { select: selectChain, delete: deleteChain, insert: insertAfterDelete };
        return { select: jest.fn() };
      });

      await expect(service.remove('actor', 'e1')).resolves.toBeUndefined();
      expect(deleteChain).toHaveBeenCalled();
      expect(insertAfterDelete).toHaveBeenCalledWith({ aktor_id: 'actor', deskripsi: expect.any(String) });
    });

    it('throws HttpException when delete errors', async () => {
      const selectChain = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { judul: 'x' }, error: null }) }) });
      const deleteChain = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: { message: 'err' } }) });
      (mockFrom as MockFn).mockImplementation(() => ({ select: selectChain, delete: deleteChain }));
      await expect(service.remove('a', 'b')).rejects.toThrow(HttpException);
    });
  });
});
