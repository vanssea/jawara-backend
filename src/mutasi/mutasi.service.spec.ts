// src/mutasi/mutasi.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { MutasiService } from './mutasi.service';
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
const mockOrder = jest.fn();

const mockSupabaseClient: any = {
  from: mockFrom,
};

const mockSupabaseService = {
  getClient: jest.fn().mockReturnValue(mockSupabaseClient),
};

describe('MutasiService', () => {
  let service: MutasiService;

  beforeEach(async () => {
    // clear all mock history & rebind the chain
    jest.clearAllMocks();

    // Default chain behavior: from(table) returns object with insert/select/update/delete
    mockFrom.mockImplementation((table: string) => {
      return {
        insert: mockInsert,
        select: mockSelect,
        update: mockUpdate,
        delete: mockDelete,
        eq: mockEq,
        single: mockSingle,
        order: mockOrder,
      };
    });

    // Ensure getClient returns the client with our from implementation
    (mockSupabaseService.getClient as MockFn).mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MutasiService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<MutasiService>(MutasiService);
  });

  describe('create', () => {
    it('should insert mutasi, update family status, and log activity then return data', async () => {
      const fakeData = { id: '1', keluarga_id: 'fam-1' };

      // first insert (mutasi) -> returns { data, error }
      mockInsert.mockReturnValueOnce({
        select: () => ({ single: () => Promise.resolve({ data: fakeData, error: null }) }),
      });

      // update family status to Non Aktif
      mockUpdate.mockReturnValueOnce({
        eq: () => Promise.resolve({ error: null }),
      });

      // second insert (log) -> returns { error: null }
      mockInsert.mockReturnValueOnce(Promise.resolve({ error: null }));

      // spy on createActivity to assert message used in log insert
      const spyCreateActivity = jest.spyOn(logUtils, 'createActivity');

      const result = await service.create('user-1', { keluarga_id: 'fam-1' } as any);

      expect(result).toEqual(fakeData);
      expect(mockSupabaseService.getClient).toHaveBeenCalled();
      expect(spyCreateActivity).toHaveBeenCalledWith('mutasi', '1');
      // ensure an insert happened (mutasi) and a second insert for logs
      expect(mockInsert).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should throw HttpException when mutasi insert returns error', async () => {
      // mutasi insert returns error
      mockInsert.mockReturnValueOnce({
        select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'DB fail' } }) }),
      });

      await expect(service.create('u1', { keluarga_id: 'fam-1' } as any)).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when log insertion fails', async () => {
      const fakeData = { id: '1', keluarga_id: 'fam-1' };

      // mutasi insert success
      mockInsert.mockReturnValueOnce({
        select: () => ({ single: () => Promise.resolve({ data: fakeData, error: null }) }),
      });

      // family status update success
      mockUpdate.mockReturnValueOnce({
        eq: () => Promise.resolve({ error: null }),
      });

      // log insert returns error
      mockInsert.mockReturnValueOnce(Promise.resolve({ error: { message: 'log fail' } }));

      await expect(service.create('u1', { keluarga_id: 'fam-1' } as any)).rejects.toThrow(HttpException);
    });
  });

  describe('findAll', () => {
    it('should return list of mutasi', async () => {
      const list = [{ id: '1' }, { id: '2' }];

      // select('*') -> order -> resolve { data, error }
      mockSelect.mockImplementation(() => ({ order: mockOrder }));
      mockOrder.mockResolvedValue({ data: list, error: null });
      // ensure from returns object where select is our mockSelect
      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      const result = await service.findAll();
      expect(result).toEqual(list);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockOrder).toHaveBeenCalled();
    });

    it('should throw HttpException when select returns error', async () => {
      mockSelect.mockImplementation(() => ({ order: mockOrder }));
      mockOrder.mockResolvedValue({ data: null, error: { message: 'fail' } });
      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  describe('findOne', () => {
    it('should return a single mutasi', async () => {
      const item = { id: '1', keluarga_id: 'fam-1' };
      // from(...).select('*').eq('id', id).single()
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
    it('should update mutasi and insert log then return updated data', async () => {
      const updated = { id: '1', keluarga_id: 'fam-1' };

      // update chain -> .update(...).eq(id).select().single() => we'll chain via mockUpdate
      mockUpdate.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ select: mockSelect }));
      // select() returns object with single()
      mockSelect.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({ data: updated, error: null });

      // log insert
      mockInsert.mockResolvedValue({ error: null });
      mockFrom.mockImplementation(() => ({
        update: mockUpdate,
        from: mockFrom,
        insert: mockInsert,
        select: mockSelect,
      }));

      const spyUpdateActivity = jest.spyOn(logUtils, 'updateActivity');

      const result = await service.update('u1', '1', { keluarga_id: 'fam-1' } as any);

      expect(result).toEqual(updated);
      expect(spyUpdateActivity).toHaveBeenCalledWith('mutasi', '1');
    });

    it('should throw HttpException when update returns error', async () => {
      mockUpdate.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ select: mockSelect }));
      mockSelect.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({ data: null, error: { message: 'update fail' } });

      mockFrom.mockImplementation(() => ({ update: mockUpdate }));

      await expect(service.update('u1', '1', { keluarga_id: 'fam-1' } as any)).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when log insert fails after update', async () => {
      const updated = { id: '1', keluarga_id: 'fam-1' };
      mockUpdate.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ select: mockSelect }));
      mockSelect.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({ data: updated, error: null });

      // log insert fails
      mockInsert.mockResolvedValue({ error: { message: 'log fail' } });

      mockFrom.mockImplementation(() => ({ update: mockUpdate, insert: mockInsert }));

      await expect(service.update('u1', '1', { keluarga_id: 'fam-1' } as any)).rejects.toThrow(HttpException);
    });
  });

  describe('remove', () => {
    it('should delete mutasi and insert log', async () => {
      const item = { id: '1', keluarga_id: 'fam-1' };

      // findOne should return item (we can spy on service.findOne or mock behavior by binding findOne)
      jest.spyOn(service, 'findOne').mockResolvedValue(item as any);

      // delete chain -> .delete().eq('id', id) => simulate returning { error: null }
      mockDelete.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => Promise.resolve({ error: null }));

      // log insert success
      mockInsert.mockResolvedValue({ error: null });

      mockFrom.mockImplementation(() => ({ delete: mockDelete, insert: mockInsert }));

      const spyDeleteActivity = jest.spyOn(logUtils, 'deleteActivity');

      await expect(service.remove('u1', '1')).resolves.toBeUndefined();

      expect(spyDeleteActivity).toHaveBeenCalledWith('mutasi', '1');
    });

    it('should throw HttpException when delete returns error', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1', keluarga_id: 'fam-1' } as any);

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
