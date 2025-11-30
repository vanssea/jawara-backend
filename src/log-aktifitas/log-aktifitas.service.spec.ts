// src/broadcast/broadcast.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { LogAktifitasService } from './log-aktifitas.service';
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

const clientAuthLike = {
  from: mockFrom,
};

const mockSupabaseClient: any = {
  from: mockFrom,
};

const mockSupabaseService = {
  getClient: jest.fn().mockReturnValue(mockSupabaseClient),
};

describe('LogAktifitasService', () => {
  let service: LogAktifitasService;

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
      };
    });

    // Ensure getClient returns the client with our from implementation
    (mockSupabaseService.getClient as MockFn).mockReturnValue(
      mockSupabaseClient,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogAktifitasService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<LogAktifitasService>(LogAktifitasService);
  });

  describe('findAll', () => {
    it('should return list of broadcasts', async () => {
      const list = [{ id: '1' }, { id: '2' }];

      // select('*') -> resolve { data, error }
      mockSelect.mockImplementation(() =>
        Promise.resolve({ data: list, error: null }),
      );
      // ensure from returns object where select is our mockSelect
      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      const result = await service.findAll();
      expect(result).toEqual(list);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should throw HttpException when select returns error', async () => {
      mockSelect.mockImplementation(() =>
        Promise.resolve({ data: null, error: { message: 'fail' } }),
      );
      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  describe('findOne', () => {
    it('should return a single broadcast', async () => {
      const item = { id: '1', judul: 'A' };
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
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'not found' },
      });

      mockFrom.mockImplementation(() => ({ select: mockSelect }));

      await expect(service.findOne('x')).rejects.toThrow(HttpException);
    });
  });
});
