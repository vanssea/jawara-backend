import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from 'src/common/service/supabase.service';
import { FamiliesService } from './families.service';

type MockFn = jest.Mock;

const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockFrom = jest.fn();

const mockSupabaseClient: any = {
  from: mockFrom,
};

const mockSupabaseService = {
  getClient: jest.fn().mockReturnValue(mockSupabaseClient),
};

describe('FamiliesService', () => {
  let service: FamiliesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockFrom.mockImplementation((table: string) => {
      if (table === 'data_rumah') {
        return { update: mockUpdate, eq: mockEq } as any;
      }
      return {
        insert: mockInsert,
        select: mockSelect,
        update: mockUpdate,
        delete: mockDelete,
        eq: mockEq,
        order: mockOrder,
      } as any;
    });

    (mockSupabaseService.getClient as MockFn).mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [FamiliesService, { provide: SupabaseService, useValue: mockSupabaseService }],
    }).compile();

    service = module.get<FamiliesService>(FamiliesService);
  });

  describe('create', () => {
    it('should insert family, set rumah status when provided, and return data', async () => {
      const fakeData = { id: '1', nama: 'Doe' };

      mockInsert.mockReturnValueOnce({
        select: () => Promise.resolve({ data: [fakeData], error: null }),
      });

      mockUpdate.mockReturnValueOnce({
        eq: () => Promise.resolve({ error: null }),
      });

      const result = await service.create('user-1', { nama: 'Doe', rumah_id: 'r1' } as any);

      expect(result).toEqual(fakeData);
      expect(mockSupabaseService.getClient).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should throw HttpException when insert returns error', async () => {
      mockInsert.mockReturnValueOnce({
        select: () => Promise.resolve({ data: null, error: { message: 'fail' } }),
      });

      await expect(
        service.create('user-1', { nama: 'Err' } as any),
      ).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when rumah status update fails', async () => {
      const fakeData = { id: '1', nama: 'Doe' };

      mockInsert.mockReturnValueOnce({
        select: () => Promise.resolve({ data: [fakeData], error: null }),
      });

      mockUpdate.mockReturnValueOnce({
        eq: () => Promise.resolve({ error: { message: 'update fail' } }),
      });

      await expect(
        service.create('user-1', { nama: 'Doe', rumah_id: 'r1' } as any),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('findAll', () => {
    it('should return list of families', async () => {
      const fakeData = [{ id: '1', nama: 'Fam' }];

      mockSelect.mockReturnValueOnce({
        order: () => Promise.resolve({ data: fakeData, error: null }),
      });

      const result = await service.findAll();

      expect(result).toEqual(fakeData);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should throw HttpException when select returns error', async () => {
      mockSelect.mockReturnValueOnce({
        order: () => Promise.resolve({ data: null, error: { message: 'db' } }),
      });

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  describe('findOne', () => {
    it('should return a family with members', async () => {
      const family = { id: '1', nama: 'Fam' } as any;
      const members = [{ id: 'm1', nama: 'Member' }];

      mockSelect.mockReturnValueOnce({
        eq: () => Promise.resolve({ data: [family], error: null }),
      });

      mockSelect.mockReturnValueOnce({
        eq: () => ({
          order: () => Promise.resolve({ data: members, error: null }),
        }),
      });

      const result = await service.findOne('1');

      expect(result).toEqual({ ...family, members });
    });

    it('should throw HttpException when family not found', async () => {
      mockSelect.mockReturnValueOnce({
        eq: () => Promise.resolve({ data: [], error: null }),
      });

      await expect(service.findOne('missing')).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('should update family, set rumah status, and return updated data', async () => {
      const updated = { id: '1', nama: 'New' };

      mockUpdate.mockReturnValueOnce({
        eq: () => ({
          select: () => Promise.resolve({ data: [updated], error: null }),
        }),
      });

      mockUpdate.mockReturnValueOnce({
        eq: () => Promise.resolve({ error: null }),
      });

      const result = await service.update('user-1', '1', { nama: 'New', rumah_id: 'r1' } as any);

      expect(result).toEqual(updated);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should throw HttpException when update returns error', async () => {
      mockUpdate.mockReturnValueOnce({
        eq: () => ({
          select: () => Promise.resolve({ data: null, error: { message: 'fail' } }),
        }),
      });

      await expect(
        service.update('user-1', '1', { nama: 'Err' } as any),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('remove', () => {
    it('should delete family when exists', async () => {
      mockSelect.mockReturnValueOnce({
        eq: () => Promise.resolve({ data: [{ id: '1', nama: 'Fam' }], error: null }),
      });

      mockDelete.mockReturnValueOnce({
        eq: () => Promise.resolve({ error: null }),
      });

      await expect(service.remove('user-1', '1')).resolves.toBeUndefined();
    });

    it('should throw HttpException when family not found', async () => {
      mockSelect.mockReturnValueOnce({
        eq: () => Promise.resolve({ data: [], error: null }),
      });

      await expect(service.remove('user-1', '1')).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when delete returns error', async () => {
      mockSelect.mockReturnValueOnce({
        eq: () => Promise.resolve({ data: [{ id: '1', nama: 'Fam' }], error: null }),
      });

      mockDelete.mockReturnValueOnce({
        eq: () => Promise.resolve({ error: { message: 'del fail' } }),
      });

      await expect(service.remove('user-1', '1')).rejects.toThrow(HttpException);
    });
  });
});
