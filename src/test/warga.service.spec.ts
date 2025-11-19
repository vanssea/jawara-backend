import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { WargaService } from '../warga/warga.service';
import { SupabaseService } from '../common/service/supabase.service';
import { CreateWargaDto } from '../warga/dto/create-warga.dto';
import { UpdateWargaDto } from '../warga/dto/update-warga.dto';

type SupaResp = { data: any; error: any };

/**
 * Utility untuk membuat mock chain client.from(...).<chain>()
 * Kita hanya mengimplementasikan method-chain yang dipakai di WargaService:
 * - insert().select().single()
 * - select().order()
 * - select().eq().single()
 * - update().eq().select().single()
 * - delete().eq().select().maybeSingle()
 */
function createFromMock(responseFor: {
  insert?: SupaResp;
  selectOrder?: SupaResp;
  selectEqSingle?: SupaResp;
  updateEqSelectSingle?: SupaResp;
  deleteEqSelectMaybeSingle?: SupaResp;
}) {
  const insertSelectSingle = {
    single: jest.fn().mockResolvedValue(responseFor.insert ?? { data: null, error: null }),
    select: jest.fn().mockReturnThis(),
  };

  const selectEqSingle = {
    single: jest.fn().mockResolvedValue(responseFor.selectEqSingle ?? { data: null, error: null }),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
  };

  const selectOrder = {
    // order returns final promise (in original code they await .order(...))
    order: jest.fn().mockResolvedValue(responseFor.selectOrder ?? { data: [], error: null }),
    select: jest.fn().mockReturnThis(),
  };

  const updateEqSelectSingle = {
    single: jest.fn().mockResolvedValue(responseFor.updateEqSelectSingle ?? { data: null, error: null }),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  };

  const deleteEqSelectMaybeSingle = {
    maybeSingle: jest.fn().mockResolvedValue(responseFor.deleteEqSelectMaybeSingle ?? { data: null, error: null }),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  };

  // top-level from mock decides which chain to return based on next call (insert, select, update, delete)
  return jest.fn((tableName: string) => {
    return {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(insertSelectSingle),
      }),
      select: jest.fn().mockReturnValue({
        order: selectOrder.order,
        eq: jest.fn().mockReturnValue({
          single: selectEqSingle.single,
        }),
        // allow select().order() path: return object with order method that resolves
        // but since we already mapped select() to return { order: selectOrder.order, eq: ... }
        // it's fine.
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: updateEqSelectSingle.single,
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            maybeSingle: deleteEqSelectMaybeSingle.maybeSingle,
          }),
        }),
      }),
    };
  });
}

describe('WargaService (unit)', () => {
  let wargaService: WargaService;
  let mockSupabaseService: Partial<SupabaseService>;

  beforeEach(() => {
    mockSupabaseService = {
      getClient: jest.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    wargaService = new WargaService(mockSupabaseService as SupabaseService);
  });

  it('should create warga successfully', async () => {
    const created = { id: '1', nama: 'Budi' };
    const fromMock = createFromMock({ insert: { data: created, error: null } });
    (mockSupabaseService.getClient as jest.Mock).mockReturnValue({ from: fromMock });

    const dto: CreateWargaDto = { nama: 'Budi' } as any;
    const result = await wargaService.create(dto);

    expect(result).toEqual(created);
    expect(fromMock).toHaveBeenCalledWith('data_warga');
  });

  it('create should throw InternalServerErrorException when supabase error', async () => {
    const err = { message: 'db down' };
    const fromMock = createFromMock({ insert: { data: null, error: err } });
    (mockSupabaseService.getClient as jest.Mock).mockReturnValue({ from: fromMock });

    await expect(wargaService.create({} as any)).rejects.toThrow(InternalServerErrorException);
  });

  it('findAll should return list ordered', async () => {
    const list = [{ id: '1' }, { id: '2' }];
    const fromMock = createFromMock({ selectOrder: { data: list, error: null } });
    (mockSupabaseService.getClient as jest.Mock).mockReturnValue({ from: fromMock });

    const result = await wargaService.findAll();

    expect(result).toEqual(list);
    expect(fromMock).toHaveBeenCalledWith('data_warga');
  });

  it('findOne should return data when found', async () => {
    const data = { id: '1', nama: 'Ana' };
    const fromMock = createFromMock({ selectEqSingle: { data, error: null } });
    (mockSupabaseService.getClient as jest.Mock).mockReturnValue({ from: fromMock });

    const result = await wargaService.findOne('1');
    expect(result).toEqual(data);
  });

  it('findOne should throw NotFoundException when no rows (PGRST116)', async () => {
    const err = { code: 'PGRST116', message: 'no rows returned' };
    const fromMock = createFromMock({ selectEqSingle: { data: null, error: err } });
    (mockSupabaseService.getClient as jest.Mock).mockReturnValue({ from: fromMock });

    await expect(wargaService.findOne('not-exists')).rejects.toThrow(NotFoundException);
  });

  it('findOne should throw NotFoundException when data null', async () => {
    const fromMock = createFromMock({ selectEqSingle: { data: null, error: null } });
    (mockSupabaseService.getClient as jest.Mock).mockReturnValue({ from: fromMock });

    await expect(wargaService.findOne('not-exists')).rejects.toThrow(NotFoundException);
  });

  it('update should return updated data', async () => {
    const updated = { id: '1', nama: 'Cici' };
    const fromMock = createFromMock({ updateEqSelectSingle: { data: updated, error: null } });
    (mockSupabaseService.getClient as jest.Mock).mockReturnValue({ from: fromMock });

    const dto: UpdateWargaDto = { nama: 'Cici' } as any;
    const result = await wargaService.update('1', dto);

    expect(result).toEqual(updated);
  });

  it('update should throw NotFoundException when not found (PGRST116)', async () => {
    const err = { code: 'PGRST116', message: 'no rows returned' };
    const fromMock = createFromMock({ updateEqSelectSingle: { data: null, error: err } });
    (mockSupabaseService.getClient as jest.Mock).mockReturnValue({ from: fromMock });

    await expect(wargaService.update('1', {} as any)).rejects.toThrow(NotFoundException);
  });

  it('remove should succeed when row deleted', async () => {
    const fromMock = createFromMock({ deleteEqSelectMaybeSingle: { data: { id: '1' }, error: null } });
    (mockSupabaseService.getClient as jest.Mock).mockReturnValue({ from: fromMock });

    await expect(wargaService.remove('1')).resolves.toBeUndefined();
  });

  it('remove should throw NotFoundException when no row deleted', async () => {
    const fromMock = createFromMock({ deleteEqSelectMaybeSingle: { data: null, error: null } });
    (mockSupabaseService.getClient as jest.Mock).mockReturnValue({ from: fromMock });

    await expect(wargaService.remove('1')).rejects.toThrow(NotFoundException);
  });

  it('findAll should throw InternalServerErrorException when supabase error', async () => {
    const fromMock = createFromMock({ selectOrder: { data: null, error: { message: 'boom' } } });
    (mockSupabaseService.getClient as jest.Mock).mockReturnValue({ from: fromMock });

    await expect(wargaService.findAll()).rejects.toThrow(InternalServerErrorException);
  });
});
