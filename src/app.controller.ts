import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth/guards/auth.guard';
import { Auth } from './common/decorator/auth.decorator';
import { AuthUser } from '@supabase/supabase-js';

@Controller()
export class AppController {
  @Get('/protected')
  @UseGuards(AuthGuard)
  async protected(@Auth() user: AuthUser) {
    return {
      message: 'Protected route',
      authenticated_user: user,
    };
  }
}
