import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { WargaService } from './warga.service';
import { SupabaseService } from 'src/common/service/supabase.service';
import { CreateWargaDto } from './dto/create-warga.dto';
import { UpdateWargaDto } from './dto/update-warga.dto';

type MockFn = jest.Mock;

describe('WargaService', () => {
  let service: WargaService;

  const mockFrom = jest.fn();
  const mockSupabaseService = {
    getClient: jest.fn(),
    uploadFile: jest.fn(),
    extractPathFromPublicUrl: jest.fn(),
    removeFile: jest.fn(),
  } as unknown as SupabaseService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSupabaseService.getClient = jest.fn().mockReturnValue({ from: mockFrom });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WargaService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get(WargaService);
  });

  describe('create', () => {
    it('inserts warga and returns created row', async () => {
      const dto = { nama: 'Ali' } as CreateWargaDto;
      const inserted = { id: '1', nama: 'Ali', keluarga_id: null };

      const single = jest.fn().mockResolvedValue({ data: inserted, error: null });
      const select = jest.fn().mockReturnValue({ single });
      const insert = jest.fn().mockReturnValue({ select });
      (mockFrom as MockFn).mockReturnValue({ insert });

      const result = await service.create(dto);

      expect(result).toEqual(inserted);
      expect(insert).toHaveBeenCalledWith({ ...dto, keluarga_id: null });
    });

    it('throws on insert error', async () => {
      const single = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
      const select = jest.fn().mockReturnValue({ single });
      const insert = jest.fn().mockReturnValue({ select });
      (mockFrom as MockFn).mockReturnValue({ insert });

      await expect(service.create({ nama: 'Err' } as CreateWargaDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('returns ordered warga list', async () => {
      const data = [{ id: '1' }];
      const order = jest.fn().mockResolvedValue({ data, error: null });
      const or = jest.fn().mockReturnValue({ order });
      const select = jest.fn().mockReturnValue({ or });
      (mockFrom as MockFn).mockReturnValue({ select });

      const result = await service.findAll();

      expect(result).toEqual(data);
      expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('throws when query fails', async () => {
      const order = jest.fn().mockResolvedValue({ data: null, error: { message: 'err' } });
      const or = jest.fn().mockReturnValue({ order });
      const select = jest.fn().mockReturnValue({ or });
      (mockFrom as MockFn).mockReturnValue({ select });

      await expect(service.findAll()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('findOne', () => {
    it('returns single warga', async () => {
      const warga = { id: '1', nama: 'Ali' };
      const single = jest.fn().mockResolvedValue({ data: warga, error: null });
      const eq = jest.fn().mockReturnValue({ single });
      const select = jest.fn().mockReturnValue({ eq });
      (mockFrom as MockFn).mockReturnValue({ select });

      const result = await service.findOne('1');

      expect(result).toEqual(warga);
      expect(eq).toHaveBeenCalledWith('id', '1');
    });

    it('throws NotFound when row missing', async () => {
      const single = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Row not found' } });
      const eq = jest.fn().mockReturnValue({ single });
      const select = jest.fn().mockReturnValue({ eq });
      (mockFrom as MockFn).mockReturnValue({ select });

      await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates warga and returns row', async () => {
      const existing = { id: '1', nama: 'Old', foto_identitas: null };
      jest.spyOn(service, 'findOne').mockResolvedValue(existing as any);

      const updated = { id: '1', nama: 'New' };
      const single = jest.fn().mockResolvedValue({ data: updated, error: null });
      const select = jest.fn().mockReturnValue({ single });
      const eq = jest.fn().mockReturnValue({ select });
      const update = jest.fn().mockReturnValue({ eq });
      (mockFrom as MockFn).mockReturnValue({ update });

      const result = await service.update('1', { nama: 'New' } as UpdateWargaDto);

      expect(result).toEqual(updated);
      expect(update).toHaveBeenCalled();
    });

    it('throws NotFound when update returns missing row', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1', foto_identitas: null } as any);

      const single = jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Row not found' } });
      const select = jest.fn().mockReturnValue({ single });
      const eq = jest.fn().mockReturnValue({ select });
      const update = jest.fn().mockReturnValue({ eq });
      (mockFrom as MockFn).mockReturnValue({ update });

      await expect(service.update('1', { nama: 'X' } as UpdateWargaDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes warga', async () => {
      const maybeSingle = jest.fn().mockResolvedValue({ data: { id: '1' }, error: null });
      const select = jest.fn().mockReturnValue({ maybeSingle });
      const eq = jest.fn().mockReturnValue({ select });
      const del = jest.fn().mockReturnValue({ eq });
      (mockFrom as MockFn).mockReturnValue({ delete: del });

      await expect(service.remove('1')).resolves.toBeUndefined();
      expect(del).toHaveBeenCalled();
    });

    it('throws NotFound when delete returns no row', async () => {
      const maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const select = jest.fn().mockReturnValue({ maybeSingle });
      const eq = jest.fn().mockReturnValue({ select });
      const del = jest.fn().mockReturnValue({ eq });
      (mockFrom as MockFn).mockReturnValue({ delete: del });

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});
