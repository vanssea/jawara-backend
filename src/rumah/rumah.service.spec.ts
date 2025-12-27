// src/rumah/rumah.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, NotFoundException } from '@nestjs/common';
import { RumahService } from './rumah.service';
import { SupabaseService } from 'src/common/service/supabase.service';
import * as logUtils from '../../utils/log.utils';

type MockFn = jest.Mock;

// --- mocks untuk chainable supabase client ---
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockMaybeSingle = jest.fn();
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

describe('RumahService', () => {
  let service: RumahService;

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
        maybeSingle: mockMaybeSingle,
        order: mockOrder,
      };
    });

    // Ensure getClient returns the client with our from implementation
    (mockSupabaseService.getClient as MockFn).mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RumahService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<RumahService>(RumahService);
  });

  describe('create', () => {
    it('should insert rumah and log activity then return data', async () => {
      const fakeData = { id: '1', alamat: 'Jl. Test No. 1', status: 'Kosong' };

      // first insert (rumah) -> returns { data, error }
      mockInsert.mockReturnValueOnce({
        select: () => ({ single: () => Promise.resolve({ data: fakeData, error: null }) }),
      });

      // second insert (log) -> returns { error: null }
      mockInsert.mockReturnValueOnce(Promise.resolve({ error: null }));

      // spy on createActivity to assert message used in log insert
      const spyCreateActivity = jest.spyOn(logUtils, 'createActivity');

      const result = await service.create('user-1', { alamat: 'Jl. Test No. 1', status: 'Kosong' } as any);

      expect(result).toEqual(fakeData);
      expect(mockSupabaseService.getClient).toHaveBeenCalled();
      expect(spyCreateActivity).toHaveBeenCalledWith('data_rumah', fakeData.alamat);
      // ensure an insert happened (rumah) and a second insert for logs
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should throw HttpException when rumah insert returns error', async () => {
      // rumah insert returns error
      mockInsert.mockReturnValueOnce({
        select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'DB fail' } }) }),
      });

      await expect(service.create('u1', { alamat: 'Jl. X', status: 'Kosong' } as any)).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when log insertion fails', async () => {
      const fakeData = { id: '1', alamat: 'Jl. Test' };

      // rumah insert success
      mockInsert.mockReturnValueOnce({
        select: () => ({ single: () => Promise.resolve({ data: fakeData, error: null }) }),
      });

      // log insert returns error
      mockInsert.mockReturnValueOnce(Promise.resolve({ error: { message: 'log fail' } }));

      await expect(service.create('u1', { alamat: 'Jl. Test', status: 'Kosong' } as any)).rejects.toThrow(HttpException);
    });
  });

  describe('findAll', () => {
    it('should return list of rumah', async () => {
      const list = [{ id: '1', alamat: 'Jl. A' }, { id: '2', alamat: 'Jl. B' }];

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
    it('should return a single rumah', async () => {
      const item = { id: '1', alamat: 'Jl. Test' };
      // from(...).select('*').eq('id', id).maybeSingle()
      mockSelect.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ maybeSingle: mockMaybeSingle }));
      mockMaybeSingle.mockResolvedValue({ data: item, error: null });

      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      const result = await service.findOne('1');
      expect(result).toEqual(item);
      expect(mockMaybeSingle).toHaveBeenCalled();
    });

    it('should throw HttpException if not found', async () => {
      mockSelect.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ maybeSingle: mockMaybeSingle }));
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      await expect(service.findOne('x')).rejects.toThrow(HttpException);
    });

    it('should throw HttpException if error occurs', async () => {
      mockSelect.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ maybeSingle: mockMaybeSingle }));
      mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'db error' } });

      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      await expect(service.findOne('x')).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('should update rumah and insert log then return updated data', async () => {
      const existing = { id: '1', alamat: 'Jl. Old' };
      const updated = { id: '1', alamat: 'Jl. New' };

      // findOne should return existing item
      jest.spyOn(service, 'findOne').mockResolvedValue(existing as any);

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

      const result = await service.update('u1', '1', { alamat: 'Jl. New' } as any);

      expect(result).toEqual(updated);
      expect(spyUpdateActivity).toHaveBeenCalledWith('data_rumah', existing.id);
    });

    it('should throw HttpException when update returns error', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1', alamat: 'Jl. X' } as any);

      mockUpdate.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ select: mockSelect }));
      mockSelect.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({ data: null, error: { message: 'update fail' } });

      mockFrom.mockImplementation(() => ({ update: mockUpdate }));

      await expect(service.update('u1', '1', { alamat: 'Jl. X' } as any)).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when log insert fails after update', async () => {
      const existing = { id: '1', alamat: 'Jl. Old' };
      const updated = { id: '1', alamat: 'Jl. New' };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(existing as any);

      mockUpdate.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ select: mockSelect }));
      mockSelect.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({ data: updated, error: null });

      // log insert fails
      mockInsert.mockResolvedValue({ error: { message: 'log fail' } });

      mockFrom.mockImplementation(() => ({ update: mockUpdate, insert: mockInsert }));

      await expect(service.update('u1', '1', { alamat: 'Jl. New' } as any)).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when rumah not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException('not found'));

      await expect(service.update('u1', '1', { alamat: 'Jl. X' } as any)).rejects.toThrow(HttpException);
    });
  });

  describe('remove', () => {
    it('should delete rumah and insert log', async () => {
      const item = { id: '1', alamat: 'Jl. ToDelete' };

      // findOne should return item (we can spy on service.findOne or mock behavior by binding findOne)
      jest.spyOn(service, 'findOne').mockResolvedValue(item as any);

      // delete chain -> .delete().eq('id', id) => simulate returning { error: null }
      mockDelete.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => Promise.resolve({ error: null }));

      // log insert success
      mockInsert.mockResolvedValue({ error: null });

      mockFrom.mockImplementation(() => ({ delete: mockDelete, insert: mockInsert }));

      const spyDeleteActivity = jest.spyOn(logUtils, 'deleteActivity');

      const result = await service.remove('u1', '1');

      expect(result).toEqual({ deleted: true });
      expect(spyDeleteActivity).toHaveBeenCalledWith('data_rumah', item.id);
    });

    it('should throw HttpException when delete returns error', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1', alamat: 'Jl. X' } as any);

      mockDelete.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => Promise.resolve({ error: { message: 'del fail' } }));

      mockFrom.mockImplementation(() => ({ delete: mockDelete }));

      await expect(service.remove('u1', '1')).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when findOne fails', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException('no'));

      await expect(service.remove('u1', '1')).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when log insert fails after delete', async () => {
      const item = { id: '1', alamat: 'Jl. Test' };
      
      jest.spyOn(service, 'findOne').mockResolvedValue(item as any);

      mockDelete.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => Promise.resolve({ error: null }));

      // log insert fails
      mockInsert.mockResolvedValue({ error: { message: 'log fail' } });

      mockFrom.mockImplementation(() => ({ delete: mockDelete, insert: mockInsert }));

      await expect(service.remove('u1', '1')).rejects.toThrow(HttpException);
    });
  });
});
