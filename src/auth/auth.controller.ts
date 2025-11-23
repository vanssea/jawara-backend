import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() request: LoginDto) {
    return this.authService.login(request);
  }

  @Post('register')
  async register(@Body() request: RegisterDto) {
    return this.authService.register(request);
  }
}
