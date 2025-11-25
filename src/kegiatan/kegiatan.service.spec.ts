import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { KegiatanService } from './kegiatan.service';
import { SupabaseService } from 'src/common/service/supabase.service';
import * as logUtils from '../../utils/log.utils';

type MockFn = jest.Mock;

// --- mocks untuk chainable supabase client ---
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

const mockSupabaseClient: any = {
  from: mockFrom,
};

const mockSupabaseService = {
  getClient: jest.fn().mockReturnValue(mockSupabaseClient),
};

describe('KegiatanService', () => {
  let service: KegiatanService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // default chain
    mockFrom.mockImplementation((table: string) => {
      return {
        insert: mockInsert,
        select: mockSelect,
        update: mockUpdate,
        delete: mockDelete,
        eq: mockEq,
        single: mockSingle,
      };
    });

    (mockSupabaseService.getClient as MockFn).mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KegiatanService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<KegiatanService>(KegiatanService);
  });

  describe('create', () => {
    it('should insert kegiatan and log activity then return data', async () => {
      const fakeData = { id: '1', nama: 'Bakti', deskripsi: 'desc' };

      // first insert (kegiatan) -> returns { data, error }
      mockInsert.mockReturnValueOnce({
        select: () => ({ single: () => Promise.resolve({ data: fakeData, error: null }) }),
      });

      // second insert (log) -> returns { error: null }
      mockInsert.mockReturnValueOnce(Promise.resolve({ error: null }));

      const spyCreateActivity = jest.spyOn(logUtils, 'createActivity');

      const result = await service.create('user-1', { nama: 'Bakti' } as any);

      expect(result).toEqual(fakeData);
      expect(mockSupabaseService.getClient).toHaveBeenCalled();
      expect(spyCreateActivity).toHaveBeenCalledWith('kegiatan', 'Bakti');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should throw HttpException when kegiatan insert returns error', async () => {
      mockInsert.mockReturnValueOnce({
        select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'DB fail' } }) }),
      });

      await expect(service.create('u1', { nama: 'X' } as any)).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when log insertion fails', async () => {
      const fakeData = { id: '1', nama: 'Bakti' };

      mockInsert.mockReturnValueOnce({
        select: () => ({ single: () => Promise.resolve({ data: fakeData, error: null }) }),
      });

      mockInsert.mockReturnValueOnce(Promise.resolve({ error: { message: 'log fail' } }));

      await expect(service.create('u1', { nama: 'Bakti' } as any)).rejects.toThrow(HttpException);
    });
  });

  describe('findAll', () => {
    it('should return list of kegiatan', async () => {
      const list = [{ id: '1' }, { id: '2' }];

      mockSelect.mockImplementation(() => Promise.resolve({ data: list, error: null }));
      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      const result = await service.findAll();
      expect(result).toEqual(list);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should throw HttpException when select returns error', async () => {
      mockSelect.mockImplementation(() => Promise.resolve({ data: null, error: { message: 'fail' } }));
      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  describe('findOne', () => {
    it('should return a single kegiatan', async () => {
      const item = { id: '1', nama: 'A' };
      mockSelect.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({ data: item, error: null });

      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      const result = await service.findOne('1');
      expect(result).toEqual(item);
      expect(mockSingle).toHaveBeenCalled();
    });

    it('should throw HttpException if not found or error', async () => {
      mockSelect.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      await expect(service.findOne('x')).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('should update kegiatan and insert log then return updated data', async () => {
      const updated = { id: '1', nama: 'Updated' };

      mockUpdate.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ select: mockSelect }));
      mockSelect.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({ data: updated, error: null });

      mockInsert.mockResolvedValue({ error: null });
      mockFrom.mockImplementation(() => ({ update: mockUpdate, from: mockFrom, insert: mockInsert, select: mockSelect }));

      const spyUpdateActivity = jest.spyOn(logUtils, 'updateActivity');

      const result = await service.update('u1', '1', { nama: 'Updated' } as any);

      expect(result).toEqual(updated);
      expect(spyUpdateActivity).toHaveBeenCalledWith('kegiatan', updated.nama);
    });

    it('should throw HttpException when update returns error', async () => {
      mockUpdate.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ select: mockSelect }));
      mockSelect.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({ data: null, error: { message: 'update fail' } });

      mockFrom.mockImplementation(() => ({ update: mockUpdate }));

      await expect(service.update('u1', '1', { nama: 'X' } as any)).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when log insert fails after update', async () => {
      const updated = { id: '1', nama: 'Updated' };
      mockUpdate.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ select: mockSelect }));
      mockSelect.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({ data: updated, error: null });

      mockInsert.mockResolvedValue({ error: { message: 'log fail' } });

      mockFrom.mockImplementation(() => ({ update: mockUpdate, insert: mockInsert }));

      await expect(service.update('u1', '1', { nama: 'Updated' } as any)).rejects.toThrow(HttpException);
    });
  });

  describe('remove', () => {
    it('should delete kegiatan and insert log', async () => {
      const item = { id: '1', nama: 'ToDelete' };

      jest.spyOn(service, 'findOne').mockResolvedValue(item as any);

      mockDelete.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => Promise.resolve({ error: null }));

      mockInsert.mockResolvedValue({ error: null });

      mockFrom.mockImplementation(() => ({ delete: mockDelete, insert: mockInsert }));

      const spyDeleteActivity = jest.spyOn(logUtils, 'deleteActivity');

      await expect(service.remove('u1', '1')).resolves.toBeUndefined();

      expect(spyDeleteActivity).toHaveBeenCalledWith('kegiatan', item.nama);
    });

    it('should throw HttpException when delete returns error', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1', nama: 'X' } as any);

      mockDelete.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => Promise.resolve({ error: { message: 'del fail' } }));

      mockFrom.mockImplementation(() => ({ delete: mockDelete }));

      await expect(service.remove('u1', '1')).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when findOne fails', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new HttpException('no', 500));

      await expect(service.remove('u1', '1')).rejects.toThrow(HttpException);
    });
  });
});
