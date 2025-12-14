// src/pemasukan-kategori-iuran/pemasukkan_kategori_iuran.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { PemasukanKategoriIuranService } from './pemasukkan_kategori_iuran.service';
import { SupabaseService } from 'src/common/service/supabase.service';
import * as logUtils from 'utils/log.utils';

// ---------- Supabase chain mocks ----------
const mockFrom = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockOrder = jest.fn();

describe('PemasukanKategoriIuranService', () => {
  let service: PemasukanKategoriIuranService;

  const mockSupabaseClient = {
    from: mockFrom,
  };

  const mockSupabaseService = {
    getClient: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    mockFrom.mockImplementation(() => ({
      insert: mockInsert,
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      order: mockOrder,
    }));

    mockSupabaseService.getClient.mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PemasukanKategoriIuranService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<PemasukanKategoriIuranService>(
      PemasukanKategoriIuranService,
    );
  });

  // ===================== CREATE =====================
  describe('create', () => {
    it('should create kategori iuran and insert log', async () => {
      const fakeData = { id: '1', nama: 'Iuran Bulanan' };

      mockInsert.mockReturnValueOnce({
        select: () => ({
          single: () => Promise.resolve({ data: fakeData, error: null }),
        }),
      });

      mockInsert.mockResolvedValueOnce({ error: null });

      const spy = jest.spyOn(logUtils, 'createActivity');

      const result = await service.create('user-1', {
        nama: 'Iuran Bulanan',
      } as any);

      expect(result).toEqual(fakeData);
      expect(spy).toHaveBeenCalledWith('kategori iuran', 'Iuran Bulanan');
    });

    it('should throw HttpException when insert fails', async () => {
      mockInsert.mockReturnValueOnce({
        select: () => ({
          single: () =>
            Promise.resolve({ data: null, error: { message: 'db error' } }),
        }),
      });

      await expect(
        service.create('u1', { nama: 'X' } as any),
      ).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when log insert fails', async () => {
      mockInsert.mockReturnValueOnce({
        select: () => ({
          single: () => Promise.resolve({ data: { id: '1' }, error: null }),
        }),
      });

      mockInsert.mockResolvedValueOnce({ error: { message: 'log fail' } });

      await expect(
        service.create('u1', { nama: 'X' } as any),
      ).rejects.toThrow(HttpException);
    });
  });

  // ===================== FIND ALL =====================
  describe('findAll', () => {
    it('should return list ordered by created_at desc', async () => {
      const list = [{ id: '1' }, { id: '2' }];

      mockSelect.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({ data: list, error: null });

      const result = await service.findAll();
      expect(result).toEqual(list);
    });

    it('should throw HttpException when select fails', async () => {
      mockSelect.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'fail' },
      });

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  // ===================== FIND ONE =====================
  describe('findOne', () => {
    it('should return one kategori iuran', async () => {
      const item = { id: '1', nama: 'Iuran' };

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: item, error: null });

      const result = await service.findOne('1');
      expect(result).toEqual(item);
    });

    it('should throw HttpException when not found', async () => {
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'not found' },
      });

      await expect(service.findOne('x')).rejects.toThrow(HttpException);
    });
  });

  // ===================== UPDATE =====================
  describe('update', () => {
    it('should update kategori iuran and insert log', async () => {
      const existing = { id: '1', nama: 'Lama' };
      const updated = { id: '1', nama: 'Baru' };

      jest.spyOn(service, 'findOne').mockResolvedValue(existing as any);

      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: updated, error: null });

      mockInsert.mockResolvedValue({ error: null });

      const spy = jest.spyOn(logUtils, 'updateActivity');

      const result = await service.update('u1', '1', {
        nama: 'Baru',
      } as any);

      expect(result).toEqual(updated);
      expect(spy).toHaveBeenCalledWith('kategori iuran', 'Lama');
    });

    it('should throw HttpException when update fails', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1' } as any);

      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'update fail' },
      });

      await expect(
        service.update('u1', '1', { nama: 'X' } as any),
      ).rejects.toThrow(HttpException);
    });
  });

  // ===================== REMOVE =====================
  describe('remove', () => {
    it('should delete kategori iuran and insert log', async () => {
      const existing = { id: '1', nama: 'Hapus' };

      jest.spyOn(service, 'findOne').mockResolvedValue(existing as any);

      mockDelete.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({ error: null });

      mockInsert.mockResolvedValue({ error: null });

      const spy = jest.spyOn(logUtils, 'deleteActivity');

      await expect(service.remove('u1', '1')).resolves.toBeUndefined();
      expect(spy).toHaveBeenCalledWith('kategori iuran', 'Hapus');
    });

    it('should throw HttpException when delete fails', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1' } as any);

      mockDelete.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({
        error: { message: 'delete fail' },
      });

      await expect(service.remove('u1', '1')).rejects.toThrow(HttpException);
    });
  });
});