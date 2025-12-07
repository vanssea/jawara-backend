import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { CreatePesanAspirasiDto } from './dto/create-pesan_warga.dto';
import { UpdatePesanAspirasiDto } from './dto/update-pesan_warga.dto';
import { createActivity, updateActivity, deleteActivity } from 'utils/log.utils';

@Injectable()
export class PesanAspirasiService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, body: CreatePesanAspirasiDto) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('pesan_aspirasi')
        .insert({
          ...body,
        })
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      // Log
      const { error: logsError } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: createActivity('pesan aspirasi', body.judul),
        });

      if (logsError) throw new HttpException(logsError.message, 500);

      return data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findAll() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('pesan_aspirasi')
        .select('*')
        .order('created_at', { ascending: false });

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
        .from('pesan_aspirasi')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new HttpException(error.message, 500);

      return data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async update(userId: string, id: string, body: UpdatePesanAspirasiDto) {
    try {
      const existing = await this.findOne(id);

      const { data, error } = await this.supabaseService
        .getClient()
        .from('pesan_aspirasi')
        .update({
          ...body,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      // Log
      const { error: logsError } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: updateActivity('pesan aspirasi', existing.judul),
        });

      if (logsError) throw new HttpException(logsError.message, 500);

      return data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async remove(userId: string, id: string) {
    try {
      const existing = await this.findOne(id);

      const { error } = await this.supabaseService
        .getClient()
        .from('pesan_aspirasi')
        .delete()
        .eq('id', id);

      if (error) throw new HttpException(error.message, 500);

      // Log
      const { error: logsError } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: deleteActivity('pesan aspirasi', existing.judul),
        });

      if (logsError) throw new HttpException(logsError.message, 500);

      return { message: 'Deleted successfully' };
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
