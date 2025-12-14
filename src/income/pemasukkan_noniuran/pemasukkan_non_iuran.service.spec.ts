// src/income/pemasukkan_noniuran/pemasukkan_non_iuran.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { PemasukkanNonIuranService } from './pemasukkan_non_iuran.service';
import { SupabaseService } from 'src/common/service/supabase.service';
import * as logUtils from 'utils/log.utils';

// ================= MOCKS =================
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
  uploadFile: jest.fn(),
  removeFile: jest.fn(),
  extractPathFromPublicUrl: jest.fn(),
};

describe('PemasukkanNonIuranService', () => {
  let service: PemasukkanNonIuranService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // ⬅️ WAJIB: set ulang getClient setelah clearAllMocks
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
        PemasukkanNonIuranService,
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<PemasukkanNonIuranService>(
      PemasukkanNonIuranService,
    );
  });

  // ================= CREATE =================
  describe('create', () => {
    it('should create data, upload file, log activity, and return data', async () => {
      const fakeData = {
        id: '1',
        nama: 'Donasi',
        link_bukti_pemasukan: 'public-url',
      };

      mockSupabaseService.uploadFile.mockResolvedValue(
        'public-url',
      );

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

      const result = await service.create(
        'user-1',
        { nama: 'Donasi' } as any,
        { bukti: [{} as Express.Multer.File] },
      );

      expect(result).toEqual(fakeData);
      expect(mockSupabaseService.uploadFile).toHaveBeenCalled();
      expect(spyCreate).toHaveBeenCalledWith(
        'pemasukan_non_iuran',
        'Donasi',
      );
    });

    it('should throw HttpException when insert fails', async () => {
      mockInsert.mockReturnValueOnce({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: 'fail' },
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
      const item = { id: '1', nama: 'A' };

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

    it('should throw HttpException when data not found', async () => {
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
    it('should update data, replace file, and log activity', async () => {
      const existing = {
        id: '1',
        nama: 'Old',
        link_bukti_pemasukan: 'old-url',
      };

      const updated = {
        id: '1',
        nama: 'Updated',
        link_bukti_pemasukan: 'new-url',
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(existing as any);

      mockSupabaseService.extractPathFromPublicUrl.mockReturnValue(
        'old-path',
      );
      mockSupabaseService.uploadFile.mockResolvedValue(
        'new-url',
      );

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
        { nama: 'Updated' } as any,
        { bukti: [{} as Express.Multer.File] },
      );

      expect(result).toEqual(updated);
      expect(mockSupabaseService.removeFile).toHaveBeenCalled();
      expect(spyUpdate).toHaveBeenCalledWith(
        'pemasukan_non_iuran',
        updated.nama,
      );
    });
  });

  // ================= REMOVE =================
  describe('remove', () => {
    it('should delete data, remove file, and log activity', async () => {
      const data = {
        id: '1',
        nama: 'ToDelete',
        link_bukti_pemasukan: 'url',
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(data as any);

      mockSupabaseService.extractPathFromPublicUrl.mockReturnValue(
        'path',
      );

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

      await expect(
        service.remove('u1', '1'),
      ).resolves.toBeUndefined();

      expect(mockSupabaseService.removeFile).toHaveBeenCalled();
      expect(spyDelete).toHaveBeenCalledWith(
        'pemasukan_non_iuran',
        data.nama,
      );
    });
  });
});