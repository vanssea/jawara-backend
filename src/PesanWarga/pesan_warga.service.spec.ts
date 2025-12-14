import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { PesanAspirasiService } from './pesan_warga.service';
import { SupabaseService } from 'src/common/service/supabase.service';
import * as logUtils from 'utils/log.utils';

type MockFn = jest.Mock;

// ---------- Supabase chain mocks ----------
const mockFrom = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockOrder = jest.fn();

const mockSupabaseClient: any = {
  from: mockFrom,
};

const mockSupabaseService = {
  getClient: jest.fn().mockReturnValue(mockSupabaseClient),
};

describe('PesanAspirasiService', () => {
  let service: PesanAspirasiService;

  beforeEach(async () => {
    jest.clearAllMocks();

    (mockSupabaseService.getClient as MockFn).mockReturnValue(
      mockSupabaseClient,
    );

    mockFrom.mockImplementation(() => ({
      insert: mockInsert,
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      order: mockOrder,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PesanAspirasiService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<PesanAspirasiService>(PesanAspirasiService);
  });

  // ================= CREATE =================
  describe('create', () => {
    it('should create pesan aspirasi and log activity', async () => {
      const fakeData = { id: '1', judul: 'Judul A' };

      mockInsert.mockReturnValueOnce({
        select: () => ({
          single: () => Promise.resolve({ data: fakeData, error: null }),
        }),
      });

      mockInsert.mockResolvedValueOnce({ error: null });

      const spy = jest.spyOn(logUtils, 'createActivity');

      const result = await service.create('user-1', {
        judul: 'Judul A',
        isi: 'Isi',
      } as any);

      expect(result).toEqual(fakeData);
      expect(spy).toHaveBeenCalledWith('pesan aspirasi', 'Judul A');
      expect(mockSupabaseService.getClient).toHaveBeenCalled();
    });

    it('should throw HttpException when insert fails', async () => {
      mockInsert.mockReturnValueOnce({
        select: () => ({
          single: () =>
            Promise.resolve({ data: null, error: { message: 'DB error' } }),
        }),
      });

      await expect(
        service.create('u1', { judul: 'X' } as any),
      ).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when log insert fails', async () => {
      mockInsert.mockReturnValueOnce({
        select: () => ({
          single: () => Promise.resolve({ data: { id: '1' }, error: null }),
        }),
      });

      mockInsert.mockResolvedValueOnce({
        error: { message: 'log error' },
      });

      await expect(
        service.create('u1', { judul: 'X' } as any),
      ).rejects.toThrow(HttpException);
    });
  });

  // ================= FIND ALL =================
  describe('findAll', () => {
    it('should return list ordered by created_at desc', async () => {
      const list = [{ id: '1' }, { id: '2' }];

      mockSelect.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({ data: list, error: null });

      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      const result = await service.findAll();

      expect(result).toEqual(list);
      expect(mockOrder).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
    });

    it('should throw HttpException when select fails', async () => {
      mockSelect.mockReturnValue({ order: mockOrder });
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'fail' },
      });

      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  // ================= FIND ONE =================
  describe('findOne', () => {
    it('should return single pesan aspirasi', async () => {
      const item = { id: '1', judul: 'A' };

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: item, error: null });

      mockFrom.mockImplementation(() => ({ select: mockSelect }));

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

      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      await expect(service.findOne('x')).rejects.toThrow(HttpException);
    });
  });

  // ================= UPDATE =================
  describe('update', () => {
    it('should update data and insert log', async () => {
      const existing = { id: '1', judul: 'Old' };
      const updated = { id: '1', judul: 'New' };

      jest.spyOn(service, 'findOne').mockResolvedValue(existing as any);

      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: updated, error: null });

      mockInsert.mockResolvedValue({ error: null });

      mockFrom.mockImplementation(() => ({
        update: mockUpdate,
        insert: mockInsert,
      }));

      const spy = jest.spyOn(logUtils, 'updateActivity');

      const result = await service.update('u1', '1', {
        judul: 'New',
      } as any);

      expect(result).toEqual(updated);
      expect(spy).toHaveBeenCalledWith('pesan aspirasi', 'Old');
    });

    it('should throw HttpException when update fails', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ judul: 'X' } as any);

      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'update fail' },
      });

      mockFrom.mockImplementation(() => ({ update: mockUpdate }));

      await expect(
        service.update('u1', '1', { judul: 'X' } as any),
      ).rejects.toThrow(HttpException);
    });
  });

  // ================= REMOVE =================
  describe('remove', () => {
    it('should delete data and insert log', async () => {
      const existing = { id: '1', judul: 'Delete Me' };

      jest.spyOn(service, 'findOne').mockResolvedValue(existing as any);

      mockDelete.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({ error: null });

      mockInsert.mockResolvedValue({ error: null });

      mockFrom.mockImplementation(() => ({
        delete: mockDelete,
        insert: mockInsert,
      }));

      const spy = jest.spyOn(logUtils, 'deleteActivity');

      const result = await service.remove('u1', '1');

      expect(result).toEqual({ message: 'Deleted successfully' });
      expect(spy).toHaveBeenCalledWith(
        'pesan aspirasi',
        existing.judul,
      );
    });

    it('should throw HttpException when delete fails', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ judul: 'X' } as any);

      mockDelete.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({
        error: { message: 'delete fail' },
      });

      mockFrom.mockImplementation(() => ({ delete: mockDelete }));

      await expect(service.remove('u1', '1')).rejects.toThrow(
        HttpException,
      );
    });
  });
});
