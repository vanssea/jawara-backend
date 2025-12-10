// src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { UsersService } from './user.service';
import { SupabaseService } from 'src/common/service/supabase.service';
import { WargaService } from 'src/warga/warga.service';
import * as logUtils from '../../utils/log.utils';
import { UserRole } from './enum/user-role.enum';

type MockFn = jest.Mock;

// --- supabase from() chain mocks ---
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();
const mockEq = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

// --- supabase auth.admin mocks ---
const mockCreateUser = jest.fn();
const mockGetUserById = jest.fn();
const mockUpdateUserById = jest.fn();
const mockDeleteUser = jest.fn();

const mockAdminAuthAdmin = {
  createUser: mockCreateUser,
  getUserById: mockGetUserById,
  updateUserById: mockUpdateUserById,
  deleteUser: mockDeleteUser,
};

const mockAdminAuth = {
  admin: mockAdminAuthAdmin,
};

const mockAdminClient: any = {
  from: mockFrom,
  auth: mockAdminAuth,
};

const mockSupabaseService = {
  getAdminClient: jest.fn().mockReturnValue(mockAdminClient),
};

const mockWargaService = {
  create: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

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
        UsersService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: WargaService, useValue: mockWargaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should throw HttpException when password and confirm_password mismatch', async () => {
      await expect(
        service.create('actor-1', {
          nama: 'Budi',
          email: 'budi@example.com',
          phone: '081',
          role: UserRole.ADMIN,
          password: 'secret1',
          confirm_password: 'secret2',
        } as any),
      ).rejects.toThrow(HttpException);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('should create auth user, insert row, create warga if role WARGA, log and return mapped user', async () => {
      const authUser = {
        id: 'user-1',
        email: 'budi@example.com',
        created_at: '2025-01-01T00:00:00Z',
        user_metadata: {
          full_name: 'Budi',
          role: UserRole.WARGA,
          phone: '081',
        },
      };

      mockCreateUser.mockResolvedValue({
        data: { user: authUser },
        error: null,
      });

      const userRow = {
        id: 'user-1',
        phone: '081',
        role: UserRole.WARGA,
        created_at: '2025-01-01T00:00:00Z',
      };

      mockInsert
        .mockReturnValueOnce({
          select: () => ({
            single: () => Promise.resolve({ data: userRow, error: null }),
          }),
        })
        .mockResolvedValueOnce({ error: null });

      (mockWargaService.create as MockFn).mockResolvedValueOnce({});

      const spyCreateActivity = jest.spyOn(logUtils, 'createActivity');

      const result = await service.create('actor-1', {
        nama: 'Budi',
        email: 'budi@example.com',
        phone: '081',
        role: UserRole.WARGA,
        password: 'secret',
        confirm_password: 'secret',
      } as any);

      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'budi@example.com',
        password: 'secret',
        email_confirm: true,
        user_metadata: {
          full_name: 'Budi',
          role: UserRole.WARGA,
          phone: '081',
        },
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockWargaService.create).toHaveBeenCalledWith({
        nama: 'Budi',
        no_telp: '081',
        peran: 'Warga',
        status: 'Aktif',
      });
      expect(spyCreateActivity).toHaveBeenCalledWith('user', 'Budi');

      expect(result).toEqual({
        id: 'user-1',
        nama: 'Budi',
        email: 'budi@example.com',
        phone: '081',
        role: UserRole.WARGA,
        created_at: '2025-01-01T00:00:00Z',
      });
    });

    it('should throw HttpException when auth createUser returns error', async () => {
      mockCreateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'auth fail' },
      });

      await expect(
        service.create('actor', {
          nama: 'Budi',
          email: 'budi@example.com',
          phone: '081',
          role: UserRole.ADMIN,
          password: 'secret',
          confirm_password: 'secret',
        } as any),
      ).rejects.toThrow(HttpException);
    });

    it('should delete auth user and throw HttpException when insert into users fails', async () => {
      const authUser = {
        id: 'user-1',
      };

      mockCreateUser.mockResolvedValue({
        data: { user: authUser },
        error: null,
      });

      mockInsert.mockReturnValueOnce({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: 'insert fail' },
            }),
        }),
      });

      mockDeleteUser.mockResolvedValue({ error: null });

      await expect(
        service.create('actor', {
          nama: 'Budi',
          email: 'budi@example.com',
          phone: '081',
          role: UserRole.ADMIN,
          password: 'secret',
          confirm_password: 'secret',
        } as any),
      ).rejects.toThrow(HttpException);

      expect(mockDeleteUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findAll', () => {
    it('should return mapped list of users', async () => {
      const rows = [
        {
          id: 'u1',
          role: UserRole.ADMIN,
          phone: '081',
          created_at: '2025-01-01',
        },
      ];

      mockSelect.mockResolvedValueOnce({ data: rows, error: null });

      mockGetUserById.mockResolvedValueOnce({
        data: {
          user: {
            id: 'u1',
            email: 'u1@example.com',
            created_at: '2025-01-01',
            user_metadata: {
              full_name: 'User 1',
              role: UserRole.ADMIN,
              phone: '081',
            },
          },
        },
        error: null,
      });

      const result = await service.findAll();

      expect(result).toEqual([
        {
          id: 'u1',
          nama: 'User 1',
          email: 'u1@example.com',
          phone: '081',
          role: UserRole.ADMIN,
          created_at: '2025-01-01',
        },
      ]);
    });

    it('should throw HttpException when select returns error', async () => {
      mockSelect.mockResolvedValueOnce({
        data: null,
        error: { message: 'fail' },
      });

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  describe('findOne', () => {
    it('should return mapped single user', async () => {
      const row = {
        id: 'u1',
        role: UserRole.ADMIN,
        phone: '081',
        created_at: '2025-01-01',
      };

      mockSelect.mockReturnValueOnce({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: row,
              error: null,
            }),
        }),
      });

      mockGetUserById.mockResolvedValueOnce({
        data: {
          user: {
            id: 'u1',
            email: 'u1@example.com',
            created_at: '2025-01-01',
            user_metadata: {
              full_name: 'User 1',
              role: UserRole.ADMIN,
              phone: '081',
            },
          },
        },
        error: null,
      });

      const result = await service.findOne('u1');

      expect(result).toEqual({
        id: 'u1',
        nama: 'User 1',
        email: 'u1@example.com',
        phone: '081',
        role: UserRole.ADMIN,
        created_at: '2025-01-01',
      });
    });

    it('should throw HttpException when users select fails', async () => {
      mockSelect.mockReturnValueOnce({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: 'not found' },
            }),
        }),
      });

      await expect(service.findOne('x')).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when auth getUserById fails', async () => {
      const row = { id: 'u1', role: UserRole.ADMIN, phone: '081' };

      mockSelect.mockReturnValueOnce({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: row,
              error: null,
            }),
        }),
      });

      mockGetUserById.mockResolvedValueOnce({
        data: null,
        error: { message: 'auth fail' },
      });

      await expect(service.findOne('u1')).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('should throw HttpException when only one of password / confirm_password is provided', async () => {
      await expect(
        service.update('actor', 'u1', {
          password: 'secret',
        } as any),
      ).rejects.toThrow(HttpException);

      await expect(
        service.update('actor', 'u1', {
          confirm_password: 'secret',
        } as any),
      ).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when password and confirm_password mismatch', async () => {
      await expect(
        service.update('actor', 'u1', {
          password: 'a',
          confirm_password: 'b',
        } as any),
      ).rejects.toThrow(HttpException);
    });

    it('should update auth user, update row, log and return mapped user', async () => {
      const existingRow = {
        id: 'u1',
        phone: '081',
        role: UserRole.ADMIN,
      };

      mockSelect.mockReturnValueOnce({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: existingRow,
              error: null,
            }),
        }),
      });

      const authUser = {
        id: 'u1',
        email: 'old@example.com',
        user_metadata: {
          full_name: 'Old Name',
          phone: '081',
          role: UserRole.ADMIN,
        },
        created_at: '2025-01-01',
      };

      mockGetUserById
        .mockResolvedValueOnce({
          data: { user: authUser },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            user: {
              ...authUser,
              email: 'new@example.com',
              user_metadata: {
                full_name: 'New Name',
                phone: '082',
                role: UserRole.KETUA_RT,
              },
            },
          },
          error: null,
        });

      mockUpdateUserById.mockResolvedValueOnce({ error: null });

      const updatedRow = {
        id: 'u1',
        phone: '082',
        role: UserRole.KETUA_RT,
        created_at: '2025-01-01',
      };

      mockUpdate.mockReturnValueOnce({
        eq: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: updatedRow,
                error: null,
              }),
          }),
        }),
      });

      mockInsert.mockResolvedValueOnce({ error: null });

      const spyUpdateActivity = jest.spyOn(logUtils, 'updateActivity');

      const result = await service.update('actor', 'u1', {
        nama: 'New Name',
        email: 'new@example.com',
        phone: '082',
        role: UserRole.KETUA_RT,
        password: 'newpass',
        confirm_password: 'newpass',
      } as any);

      expect(mockUpdateUserById).toHaveBeenCalled();
      expect(spyUpdateActivity).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'u1',
        nama: 'New Name',
        email: 'new@example.com',
        phone: '082',
        role: UserRole.KETUA_RT,
        created_at: '2025-01-01',
      });
    });

    it('should throw HttpException when existing users row select fails', async () => {
      mockSelect.mockReturnValueOnce({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: 'fail' },
            }),
        }),
      });

      await expect(
        service.update('actor', 'u1', {
          nama: 'X',
        } as any),
      ).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when auth getUserById fails', async () => {
      const existingRow = {
        id: 'u1',
        phone: '081',
        role: UserRole.ADMIN,
      };

      mockSelect.mockReturnValueOnce({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: existingRow,
              error: null,
            }),
        }),
      });

      mockGetUserById.mockResolvedValueOnce({
        data: null,
        error: { message: 'auth fail' },
      });

      await expect(
        service.update('actor', 'u1', {
          nama: 'X',
        } as any),
      ).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when auth updateUserById fails', async () => {
      const existingRow = {
        id: 'u1',
        phone: '081',
        role: UserRole.ADMIN,
      };

      mockSelect.mockReturnValueOnce({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: existingRow,
              error: null,
            }),
        }),
      });

      mockGetUserById.mockResolvedValueOnce({
        data: {
          user: {
            id: 'u1',
            email: 'old@example.com',
            user_metadata: {},
          },
        },
        error: null,
      });

      mockUpdateUserById.mockResolvedValueOnce({
        error: { message: 'update auth fail' },
      });

      await expect(
        service.update('actor', 'u1', {
          nama: 'X',
        } as any),
      ).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when update row fails', async () => {
      const existingRow = {
        id: 'u1',
        phone: '081',
        role: UserRole.ADMIN,
      };

      mockSelect.mockReturnValueOnce({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: existingRow,
              error: null,
            }),
        }),
      });

      mockGetUserById.mockResolvedValueOnce({
        data: {
          user: {
            id: 'u1',
            email: 'old@example.com',
            user_metadata: {},
          },
        },
        error: null,
      });

      mockUpdateUserById.mockResolvedValueOnce({ error: null });

      mockUpdate.mockReturnValueOnce({
        eq: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { message: 'update row fail' },
              }),
          }),
        }),
      });

      await expect(
        service.update('actor', 'u1', {
          nama: 'X',
        } as any),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('remove', () => {
    it('should delete users row, delete auth user and insert log', async () => {
      mockGetUserById.mockResolvedValueOnce({
        data: {
          user: {
            id: 'u1',
            email: 'u1@example.com',
            user_metadata: { full_name: 'User 1' },
          },
        },
        error: null,
      });

      mockDelete.mockReturnValueOnce({
        eq: () => Promise.resolve({ error: null }),
      });

      mockDeleteUser.mockResolvedValueOnce({ error: null });

      mockInsert.mockResolvedValueOnce({ error: null });

      const spyDeleteActivity = jest.spyOn(logUtils, 'deleteActivity');

      await expect(service.remove('actor', 'u1')).resolves.toBeUndefined();

      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteUser).toHaveBeenCalledWith('u1');
      expect(spyDeleteActivity).toHaveBeenCalled();
    });

    it('should throw HttpException when deleting row fails', async () => {
      mockGetUserById.mockResolvedValueOnce({
        data: {
          user: { id: 'u1', email: 'u1@example.com', user_metadata: {} },
        },
        error: null,
      });

      mockDelete.mockReturnValueOnce({
        eq: () => Promise.resolve({ error: { message: 'del fail' } }),
      });

      await expect(service.remove('actor', 'u1')).rejects.toThrow(
        HttpException,
      );
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it('should throw HttpException when deleting auth user fails', async () => {
      mockGetUserById.mockResolvedValueOnce({
        data: {
          user: { id: 'u1', email: 'u1@example.com', user_metadata: {} },
        },
        error: null,
      });

      mockDelete.mockReturnValueOnce({
        eq: () => Promise.resolve({ error: null }),
      });

      mockDeleteUser.mockResolvedValueOnce({
        error: { message: 'auth del fail' },
      });

      await expect(service.remove('actor', 'u1')).rejects.toThrow(
        HttpException,
      );
    });
  });
});
