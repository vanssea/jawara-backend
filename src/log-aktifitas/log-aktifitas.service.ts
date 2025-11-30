import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';

@Injectable()
export class LogAktifitasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .select('*');

      if (error) throw new HttpException(error.message, 500);

      return data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findOne(id: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new HttpException(error.message, 500);

      return data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
