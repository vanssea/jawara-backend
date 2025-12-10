import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Express } from 'express';

@Injectable()
export class SupabaseService {
  private supabaseClient: SupabaseClient;
  private supabaseAdminClient: SupabaseClient;
  private readonly storageBucket: string;

  constructor(private readonly configService: ConfigService) {
    // First: try to read from ConfigService, fallback to process.env
    const url =
      this.configService.get<string>('SUPABASE_URL') ||
      process.env.SUPABASE_URL;
    const anonKey =
      this.configService.get<string>('SUPABASE_ANON_KEY') ||
      this.configService.get<string>('SUPABASE_KEY') ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY;
    const serviceKey =
      this.configService.get<string>('SUPABASE_SERVICE_KEY') ||
      this.configService.get<string>('SUPABASE_ADMIN_KEY') ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_ADMIN_KEY;

    // Storage bucket fallback
    this.storageBucket =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') ||
      process.env.SUPABASE_STORAGE_BUCKET ||
      'jawara';

    // Diagnostic logs (DO NOT print full keys). Prints only presence and masked tail.
    const mask = (s?: string) =>
      !s ? null : `${s.slice(0, 4)}...${s.slice(-4)}`;
    console.log('[supabase] SUPABASE_URL set?', !!url);
    console.log('[supabase] SUPABASE_ANON_KEY set?', !!anonKey, mask(anonKey));
    console.log(
      '[supabase] SUPABASE_SERVICE_KEY set?',
      !!serviceKey,
      mask(serviceKey),
    );
    console.log('[supabase] SUPABASE_STORAGE_BUCKET:', this.storageBucket);

    // Fail early with helpful message
    if (!url) {
      throw new InternalServerErrorException('SUPABASE_URL is not set.');
    }
    if (!anonKey) {
      throw new InternalServerErrorException(
        'SUPABASE_ANON_KEY (or SUPABASE_KEY) is not set. Provide it in .env or env vars.',
      );
    }
    if (!serviceKey) {
      throw new InternalServerErrorException(
        'SUPABASE_SERVICE_KEY (service role) is not set. Required for admin/upload operations.',
      );
    }

    // Create clients
    try {
      this.supabaseClient = createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      this.supabaseAdminClient = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    } catch (err) {
      console.error('[supabase] failed to create client:', err?.message ?? err);
      // rethrow so Nest shows meaningful error
      throw new InternalServerErrorException(
        'Failed to initialize Supabase client.',
      );
    }
  }

  getClient(): SupabaseClient {
    return this.supabaseClient;
  }

  getAdminClient(): SupabaseClient {
    return this.supabaseAdminClient;
  }

  // ... (rest of methods unchanged)
  async uploadFile(
    folder: string,
    file?: Express.Multer.File,
  ): Promise<string | null> {
    if (!file) return null;

    const path = `${folder}/${Date.now()}-${file.originalname}`;

    const upload = await this.supabaseAdminClient.storage
      .from(this.storageBucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
      });

    if (upload.error) throw new HttpException(upload.error.message, 500);

    const { data } = this.supabaseAdminClient.storage
      .from(this.storageBucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  extractPathFromPublicUrl(url: string | null): string | null {
    if (!url) return null;

    const base = `storage/v1/object/public/${this.storageBucket}/`;
    const idx = url.indexOf(base);

    if (idx === -1) return null;

    const encodedPath = url.substring(idx + base.length);

    return decodeURIComponent(encodedPath);
  }

  async removeFile(path: string | null): Promise<void> {
    if (!path) return;

    const { error } = await this.supabaseAdminClient.storage
      .from(this.storageBucket)
      .remove([path]);

    if (error) throw new HttpException(error.message, 500);
  }
}
