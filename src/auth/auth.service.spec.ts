// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseService } from 'src/common/service/supabase.service';

type MockFn = jest.Mock;

const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();

const mockSupabaseClient: any = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
  },
};

const mockSupabaseService = {
  getClient: jest.fn().mockReturnValue(mockSupabaseClient),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    // Clear mock call history and implementations
    mockSignInWithPassword.mockClear();
    mockSignUp.mockClear();

    // Re-bind the auth methods on the client object to the mock functions
    mockSupabaseClient.auth.signInWithPassword = mockSignInWithPassword;
    mockSupabaseClient.auth.signUp = mockSignUp;

    // Ensure the service returns the same client with our bound mocks
    (mockSupabaseService.getClient as MockFn).mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return token info when signInWithPassword succeeds', async () => {
      const fakeSession = {
        access_token: 'access-123',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: '2025-11-25T00:00:00Z',
      };
      mockSignInWithPassword.mockResolvedValue({
        data: { session: fakeSession },
        error: null,
      });

      const result = await service.login({ email: 'a@b.com', password: 'pwd' } as any);

      expect(result).toEqual({
        message: 'success',
        data: {
          access_token: fakeSession.access_token,
          token_type: fakeSession.token_type,
          expires_in: fakeSession.expires_in,
          expires_at: fakeSession.expires_at,
        },
      });

      expect(mockSupabaseService.getClient).toHaveBeenCalled();
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'pwd',
      });
    });

    it('should throw HttpException when signInWithPassword returns error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'invalid credentials' },
      });

      await expect(
        service.login({ email: 'a@b.com', password: 'wrong' } as any),
      ).rejects.toThrow(HttpException);

      expect(mockSignInWithPassword).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should return token info when signUp succeeds with session', async () => {
      const fakeSession = {
        access_token: 'reg-access-1',
        token_type: 'bearer',
        expires_in: 7200,
        expires_at: '2025-12-01T00:00:00Z',
      };

      // IMPORTANT: set resolved value for signUp
      mockSignUp.mockResolvedValue({
        data: { session: fakeSession },
        error: null,
      });

      const result = await service.register({ email: 'new@user.com', password: 'pwd' } as any);

      expect(result).toEqual({
        message: 'success',
        data: {
          access_token: fakeSession.access_token,
          token_type: fakeSession.token_type,
          expires_in: fakeSession.expires_in,
          expires_at: fakeSession.expires_at,
        },
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@user.com',
        password: 'pwd',
      });
    });

    it('should return success even if session is undefined (no session returned)', async () => {
      mockSignUp.mockResolvedValue({
        data: { session: undefined },
        error: null,
      });

      const result = await service.register({ email: 'no-session@u.com', password: 'pwd' } as any);

      expect(result).toEqual({
        message: 'success',
        data: {
          access_token: undefined,
          token_type: undefined,
          expires_in: undefined,
          expires_at: undefined,
        },
      });
    });

    it('should throw HttpException when signUp returns error', async () => {
      mockSignUp.mockResolvedValue({
        data: null,
        error: { message: 'email taken' },
      });

      await expect(
        service.register({ email: 'taken@u.com', password: 'pwd' } as any),
      ).rejects.toThrow(HttpException);

      expect(mockSignUp).toHaveBeenCalled();
    });
  });
});
