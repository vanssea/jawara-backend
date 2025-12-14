import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { KegiatanKategoriService } from './kegiatan-kategori.service';
import { SupabaseService } from 'src/common/service/supabase.service';

type MockFn = jest.Mock;

describe('KegiatanKategoriService', () => {
  let service: KegiatanKategoriService;
  const mockFrom = jest.fn();
  const mockSupabaseService = {
    getClient: jest.fn().mockReturnValue({ from: mockFrom }),
  } as unknown as SupabaseService;

  beforeEach(async () => {
    jest.clearAllMocks();
    // resetMocks in jest config clears implementations, so restore the client stub
    (mockFrom as MockFn).mockReset();
    (mockSupabaseService as any).getClient = jest
      .fn()
      .mockReturnValue({ from: mockFrom });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KegiatanKategoriService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get(KegiatanKategoriService);
  });

  it('returns ordered kategori list', async () => {
    const data = [{ id: 1, nama: 'Umum' }];
    const order = jest.fn().mockResolvedValue({ data, error: null });
    const select = jest.fn().mockReturnValue({ order });
    (mockFrom as MockFn).mockReturnValue({ select });

    const result = await service.findAll();

    expect(result).toEqual(data);
    expect(select).toHaveBeenCalledWith('id, nama, created_at');
    expect(order).toHaveBeenCalledWith('nama', { ascending: true });
  });

  it('throws HttpException on error', async () => {
    const select = jest.fn().mockResolvedValue({ data: null, error: { message: 'fail' } });
    (mockFrom as MockFn).mockReturnValue({ select });

    await expect(service.findAll()).rejects.toThrow(HttpException);
  });
});
