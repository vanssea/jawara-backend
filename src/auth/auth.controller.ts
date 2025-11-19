import { Body, Controller, Post, Put, Req, UseGuards } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() request: LoginDto) {
    const result = await this.authService.login(request);
    return {
      message: 'success',
      data: {
        access_token: result.session.access_token,
        token_type: result.session.token_type,
        expires_in: result.session.expires_in,
        expires_at: result.session.expires_at,
      },
    };
  }

  @Post('register')
  async register(@Body() request: RegisterDto) {
    const result = await this.authService.register(request);
    return {
      message: 'success',
      data: {
        access_token: result.session?.access_token,
        token_type: result.session?.token_type,
        expires_in: result.session?.expires_in,
        expires_at: result.session?.expires_at,
      },
    };
  }
}
