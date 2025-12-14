// src/income/pemasukkan_tagihan/pemasukkan_tagihan.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { PemasukkanTagihanService } from './pemasukkan_tagihan.service';
import { SupabaseService } from 'src/common/service/supabase.service';
import * as logUtils from 'utils/log.utils';

// ================= MOCK SUPABASE =================
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

const mockSupabaseService: any = {
  getClient: jest.fn(),
};

describe('PemasukkanTagihanService', () => {
  let service: PemasukkanTagihanService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // 🔴 WAJIB: rebind getClient setelah clearAllMocks
    mockSupabaseService.getClient.mockReturnValue(
      mockSupabaseClient,
    );

    mockFrom.mockImplementation(() => ({
      insert: mockInsert,
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PemasukkanTagihanService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<PemasukkanTagihanService>(
      PemasukkanTagihanService,
    );
  });

  // ================= CREATE =================
  describe('create', () => {
    it('should create data and log activity', async () => {
      const fakeData = {
        id: '1',
        nama: 'Iuran Air',
      };

      mockInsert.mockReturnValueOnce({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: fakeData,
              error: null,
            }),
        }),
      });

      mockInsert.mockResolvedValueOnce({ error: null });

      const spyCreate = jest.spyOn(
        logUtils,
        'createActivity',
      );

      const result = await service.create('u1', {
        nama: 'Iuran Air',
        kategori_id: 'k1',
        periode: '2024-01',
        status: 'aktif',
        keluarga_id: 'kel1',
      } as any);

      expect(result).toEqual(fakeData);
      expect(spyCreate).toHaveBeenCalledWith(
        'pemasukan_tagihan',
        'Iuran Air',
      );
    });

    it('should throw HttpException when insert fails', async () => {
      mockInsert.mockReturnValueOnce({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: 'insert fail' },
            }),
        }),
      });

      await expect(
        service.create('u1', { nama: 'X' } as any),
      ).rejects.toThrow(HttpException);
    });
  });

  // ================= FIND ALL =================
  describe('findAll', () => {
    it('should return list of data', async () => {
      const list = [{ id: '1' }, { id: '2' }];

      mockSelect.mockResolvedValue({
        data: list,
        error: null,
      });

      mockFrom.mockImplementation(() => ({
        select: mockSelect,
      }));

      const result = await service.findAll();
      expect(result).toEqual(list);
    });

    it('should throw HttpException on select error', async () => {
      mockSelect.mockResolvedValue({
        data: null,
        error: { message: 'fail' },
      });

      mockFrom.mockImplementation(() => ({
        select: mockSelect,
      }));

      await expect(service.findAll()).rejects.toThrow(
        HttpException,
      );
    });
  });

  // ================= FIND ONE =================
  describe('findOne', () => {
    it('should return single data', async () => {
      const item = { id: '1', nama: 'Tagihan' };

      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: item,
        error: null,
      });

      mockFrom.mockImplementation(() => ({
        select: mockSelect,
      }));

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

      mockFrom.mockImplementation(() => ({
        select: mockSelect,
      }));

      await expect(service.findOne('x')).rejects.toThrow(
        HttpException,
      );
    });
  });

  // ================= UPDATE =================
  describe('update', () => {
    it('should update data and log activity', async () => {
      const updated = {
        id: '1',
        nama: 'Updated Tagihan',
      };

      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: updated,
        error: null,
      });

      mockInsert.mockResolvedValue({ error: null });

      mockFrom.mockImplementation(() => ({
        update: mockUpdate,
        insert: mockInsert,
      }));

      const spyUpdate = jest.spyOn(
        logUtils,
        'updateActivity',
      );

      const result = await service.update(
        'u1',
        '1',
        { nama: 'Updated Tagihan' } as any,
      );

      expect(result).toEqual(updated);
      expect(spyUpdate).toHaveBeenCalledWith(
        'pemasukan_tagihan',
        updated.nama,
      );
    });

    it('should throw HttpException when update fails', async () => {
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'update fail' },
      });

      mockFrom.mockImplementation(() => ({
        update: mockUpdate,
      }));

      await expect(
        service.update('u1', '1', { nama: 'X' } as any),
      ).rejects.toThrow(HttpException);
    });
  });

  // ================= REMOVE =================
  describe('remove', () => {
    it('should delete data and log activity', async () => {
      const oldData = {
        id: '1',
        nama: 'Tagihan Lama',
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(oldData as any);

      mockDelete.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({ error: null });

      mockInsert.mockResolvedValue({ error: null });

      mockFrom.mockImplementation(() => ({
        delete: mockDelete,
        insert: mockInsert,
      }));

      const spyDelete = jest.spyOn(
        logUtils,
        'deleteActivity',
      );

      const result = await service.remove('u1', '1');

      expect(result).toEqual({
        message: 'Data berhasil dihapus',
      });

      expect(spyDelete).toHaveBeenCalledWith(
        'pemasukan_tagihan',
        oldData.nama,
      );
    });

    it('should throw HttpException when delete fails', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue({ id: '1', nama: 'X' } as any);

      mockDelete.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({
        error: { message: 'delete fail' },
      });

      mockFrom.mockImplementation(() => ({
        delete: mockDelete,
      }));

      await expect(
        service.remove('u1', '1'),
      ).rejects.toThrow(HttpException);
    });
  });
});
