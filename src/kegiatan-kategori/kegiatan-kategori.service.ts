import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';

@Injectable()
export class KegiatanKategoriService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    try {
      const client = this.supabaseService.getClient();
      const { data, error } = await client
        .from('kegiatan_kategori')
        .select('id, nama, created_at')
        .order('nama', { ascending: true });

      if (error) throw new HttpException(error.message, 500);
      return data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
