import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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
    const { data, error } = await this.supabaseService.getClient().auth.signUp({
      email: request.email,
      password: request.password,
    });

    if (error) throw new HttpException(error.message, 500);

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
