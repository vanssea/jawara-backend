import { Module } from '@nestjs/common';
import { SupabaseService } from './service/supabase.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class CommonModule {}
