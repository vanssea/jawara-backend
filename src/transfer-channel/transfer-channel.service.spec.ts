import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { TransferChannelService } from './transfer-channel.service';
import { SupabaseService } from 'src/common/service/supabase.service';
import * as logUtils from '../../utils/log.utils';

type MockFn = jest.Mock;

const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

const mockAdminClient: any = {
  from: mockFrom,
};

const mockSupabaseService = {
  getClient: jest.fn(),
  getAdminClient: jest.fn(),
  uploadFile: jest.fn(),
  removeFile: jest.fn(),
  extractPathFromPublicUrl: jest.fn(),
};

describe('TransferChannelService', () => {
  let service: TransferChannelService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockFrom.mockImplementation(() => ({
      insert: mockInsert,
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
    }));

    (mockSupabaseService.getAdminClient as MockFn).mockReturnValue(
      mockAdminClient,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferChannelService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<TransferChannelService>(TransferChannelService);
  });

  describe('create', () => {
    it('should upload files, insert channel and log activity', async () => {
      const uploadedThumbnail = 'https://public/thumb.png';
      const uploadedQr = 'https://public/qr.png';

      mockSupabaseService.uploadFile
        .mockResolvedValueOnce(uploadedThumbnail)
        .mockResolvedValueOnce(uploadedQr);

      const fakeData = { id: '1', nama_channel: 'BRI' };

      mockInsert.mockReturnValueOnce({
        select: () => ({
          single: () => Promise.resolve({ data: fakeData, error: null }),
        }),
      });

      mockInsert.mockResolvedValueOnce({ error: null });

      const spyCreateActivity = jest.spyOn(logUtils, 'createActivity');

      const result = await service.create(
        'user-1',
        {
          nama_channel: 'BRI',
          tipe_channel: 'BANK',
          pemilik: 'abc',
          catatan: 'test',
        } as any,
        {},
      );

      expect(result).toEqual(fakeData);
      expect(mockSupabaseService.uploadFile).toHaveBeenCalledTimes(2);
      expect(spyCreateActivity).toHaveBeenCalledWith('transfer_channel', 'BRI');
    });

    it('should throw HttpException when insert returns error', async () => {
      mockSupabaseService.uploadFile.mockResolvedValue(null);

      mockInsert.mockReturnValueOnce({
        select: () => ({
          single: () =>
            Promise.resolve({ data: null, error: { message: 'fail' } }),
        }),
      });

      await expect(service.create('u1', {} as any, {})).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all channels', async () => {
      const list = [{ id: '1' }, { id: '2' }];

      mockSelect.mockImplementation(() =>
        Promise.resolve({ data: list, error: null }),
      );

      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      const result = await service.findAll();
      expect(result).toEqual(list);
    });

    it('should throw HttpException on error', async () => {
      mockSelect.mockImplementation(() =>
        Promise.resolve({ data: null, error: { message: 'fail' } }),
      );
      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  describe('findOne', () => {
    it('should return a channel', async () => {
      const item = { id: '1' };

      mockSelect.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({ data: item, error: null });

      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      const result = await service.findOne('1');
      expect(result).toEqual(item);
    });

    it('should throw HttpException on error', async () => {
      mockSelect.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'not-found' },
      });

      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      await expect(service.findOne('x')).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('should delete old files if new are uploaded and update record', async () => {
      const existing = {
        id: '1',
        nama_channel: 'Old',
        tipe_channel: 'BANK',
        pemilik: 'own',
        catatan: 'c',
        thumbnail_url: 'https://public/old-thumb.png',
        qr_url: 'https://public/old-qr.png',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existing as any);

      mockSupabaseService.extractPathFromPublicUrl
        .mockReturnValueOnce('thumbnails/old.png')
        .mockReturnValueOnce('qrs/old.png');

      mockSupabaseService.removeFile.mockResolvedValue(undefined);

      mockSupabaseService.uploadFile
        .mockResolvedValueOnce('https://new/thumb.png')
        .mockResolvedValueOnce('https://new/qr.png');

      const updated = { id: '1', nama_channel: 'New' };

      mockUpdate.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ select: mockSelect }));
      mockSelect.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({ data: updated, error: null });

      mockInsert.mockResolvedValue({ error: null });

      const spyUpdateActivity = jest.spyOn(logUtils, 'updateActivity');

      const result = await service.update(
        'u1',
        '1',
        { nama_channel: 'New' } as any,
        { thumbnail: [{} as any], qr: [{} as any] },
      );

      expect(result).toEqual(updated);
      expect(mockSupabaseService.removeFile).toHaveBeenCalledTimes(2);
      expect(mockSupabaseService.uploadFile).toHaveBeenCalledTimes(2);
      expect(spyUpdateActivity).toHaveBeenCalledWith('transfer_channel', 'New');
    });

    it('should update without removing files if none uploaded', async () => {
      const existing = {
        id: '1',
        nama_channel: 'Old',
        thumbnail_url: 'url1',
        qr_url: 'url2',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existing as any);

      mockUpdate.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ select: mockSelect }));
      mockSelect.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({
        data: existing,
        error: null,
      });

      mockInsert.mockResolvedValue({ error: null });

      const result = await service.update(
        'u1',
        '1',
        { nama_channel: 'Old' } as any,
        {},
      );

      expect(result).toEqual(existing);
      expect(mockSupabaseService.removeFile).not.toHaveBeenCalled();
      expect(mockSupabaseService.uploadFile).not.toHaveBeenCalled();
    });

    it('should throw HttpException on update error', async () => {
      const existing = { id: '1' };
      jest.spyOn(service, 'findOne').mockResolvedValue(existing as any);

      mockUpdate.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => ({ select: mockSelect }));
      mockSelect.mockImplementation(() => ({ single: mockSingle }));
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'update-fail' },
      });

      await expect(service.update('u1', '1', {} as any, {})).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('remove', () => {
    it('should delete files, delete row, insert log', async () => {
      const existing = {
        id: '1',
        nama_channel: 'X',
        thumbnail_url: 'https://public/thumb.png',
        qr_url: 'https://public/qr.png',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existing as any);

      mockSupabaseService.extractPathFromPublicUrl
        .mockReturnValueOnce('thumbnails/x.png')
        .mockReturnValueOnce('qrs/x.png');

      mockSupabaseService.removeFile.mockResolvedValue(undefined);

      mockDelete.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() => Promise.resolve({ error: null }));

      mockInsert.mockResolvedValue({ error: null });

      const spyDeleteActivity = jest.spyOn(logUtils, 'deleteActivity');

      await expect(service.remove('u1', '1')).resolves.toBeUndefined();

      expect(mockSupabaseService.removeFile).toHaveBeenCalledTimes(2);
      expect(spyDeleteActivity).toHaveBeenCalledWith('transfer_channel', 'X');
    });

    it('should throw HttpException on delete error', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: '1',
        nama_channel: 'X',
      } as any);

      mockDelete.mockImplementation(() => ({ eq: mockEq }));
      mockEq.mockImplementation(() =>
        Promise.resolve({ error: { message: 'del-fail' } }),
      );

      await expect(service.remove('u1', '1')).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when findOne fails', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new HttpException('fail', 500));

      await expect(service.remove('u1', '1')).rejects.toThrow(HttpException);
    });
  });
});
