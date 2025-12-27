// src/mutasi/mutasi-jenis.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { MutasiJenisService } from './mutasi-jenis.service';
import { SupabaseService } from 'src/common/service/supabase.service';

type MockFn = jest.Mock;

// --- mocks untuk chainable supabase client ---
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();

const mockSupabaseClient: any = {
  from: mockFrom,
};

const mockSupabaseService = {
  getClient: jest.fn().mockReturnValue(mockSupabaseClient),
};

describe('MutasiJenisService', () => {
  let service: MutasiJenisService;

  beforeEach(async () => {
    // clear all mock history & rebind the chain
    jest.clearAllMocks();

    // Default chain behavior: from(table) returns object with select/order
    mockFrom.mockImplementation((table: string) => {
      return {
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
        order: mockOrder,
      };
    });

    // Ensure getClient returns the client with our from implementation
    (mockSupabaseService.getClient as MockFn).mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MutasiJenisService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<MutasiJenisService>(MutasiJenisService);
  });

  describe('findAll', () => {
    it('should return list of mutasi jenis', async () => {
      const list = [
        { id: '1', nama: 'Pindah' },
        { id: '2', nama: 'Meninggal' },
      ];

      // select('*') -> order -> resolve { data, error }
      mockSelect.mockImplementation(() => ({ order: mockOrder }));
      mockOrder.mockResolvedValue({ data: list, error: null });
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

    it('should return empty array when data is null', async () => {
      mockSelect.mockImplementation(() => ({ order: mockOrder }));
      mockOrder.mockResolvedValue({ data: null, error: null });
      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findAllRaw', () => {
    it('should call findAll and return its result', async () => {
      const list = [{ id: '1', nama: 'Pindah' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(list as any);

      const result = await service.findAllRaw();
      expect(result).toEqual(list);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single mutasi jenis', async () => {
      const item = { id: '1', nama: 'Pindah' };
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
});
