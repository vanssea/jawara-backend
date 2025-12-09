import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';

@Injectable()
export class MutasiJenisService {
  private readonly tableName = 'mutasi_jenis';

  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  async findAll() {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .order('id', { ascending: true });

      if (error) throw new HttpException(error.message, 500);

      return data ?? [];
    } catch (err) {
      throw new HttpException(err.message || 'Internal server error', 500);
    }
  }

  // return all (alias) to support /jenis/all client call
  async findAllRaw() {
    return this.findAll();
  }

  async findOne(id: string) {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new HttpException(error.message, 500);

      return data;
    } catch (err) {
      throw new HttpException(err.message || 'Internal server error', 500);
    }
  }
}
