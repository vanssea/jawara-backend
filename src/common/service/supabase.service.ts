import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Express } from 'express';

@Injectable()
export class SupabaseService {
  private supabaseClient: SupabaseClient;
  private supabaseAdminClient: SupabaseClient;
  private readonly storageBucket: string;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get('SUPABASE_URL') as string;
    const anonKey = this.configService.get('SUPABASE_ANON_KEY') as string;
    const serviceKey = this.configService.get('SUPABASE_SERVICE_KEY') as string;

    this.storageBucket =
      (this.configService.get('SUPABASE_STORAGE_BUCKET') as string) || 'jawara';

    this.supabaseClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    this.supabaseAdminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  getClient(): SupabaseClient {
    return this.supabaseClient;
  }

  getAdminClient(): SupabaseClient {
    return this.supabaseAdminClient;
  }

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
