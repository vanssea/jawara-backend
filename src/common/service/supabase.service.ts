import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabaseClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.supabaseClient = createClient(
      this.configService.get('SUPABASE_URL') as string,
      this.configService.get('SUPABASE_KEY') as string,
    );
  }

  getClient(): SupabaseClient {
    return this.supabaseClient;
  }
}
