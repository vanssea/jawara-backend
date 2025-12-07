import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from 'src/user/enum/user-role.enum';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  public async login(request: LoginDto): Promise<any> {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.signInWithPassword({
        email: request.email,
        password: request.password,
      });

    if (error) throw new HttpException(error.message, 401);

    return {
      message: 'success',
      data: {
        access_token: data.session.access_token,
        token_type: data.session.token_type,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
      },
    };
  }

  public async register(request: RegisterDto) {
    const client = this.supabaseService.getClient();
    const adminClient = this.supabaseService.getAdminClient();

    const { data, error } = await client.auth.signUp({
      email: request.email,
      password: request.password,
      options: {
        data: {
          full_name: request.name,
          phone: request.phone,
          role: UserRole.WARGA,
        },
      },
    });

    if (error) {
      throw new HttpException(error.message, 500);
    }

    const user = data.user;
    if (!user) {
      throw new HttpException('Failed to create auth user', 500);
    }

    const { error: userError } = await adminClient
      .from('users')
      .insert({
        id: user.id,
        phone: request.phone,
        role: UserRole.WARGA,
      })
      .select('*')
      .single();

    if (userError) {
      await adminClient.auth.admin.deleteUser(user.id);
      throw new HttpException(userError.message, 500);
    }

    return {
      message: 'success',
      data: {
        access_token: data.session?.access_token,
        token_type: data.session?.token_type,
        expires_in: data.session?.expires_in,
        expires_at: data.session?.expires_at,
      },
    };
  }
}
