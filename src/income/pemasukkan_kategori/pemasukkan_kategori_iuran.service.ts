import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import {
  createActivity,
  deleteActivity,
  updateActivity,
} from 'utils/log.utils';
import { CreatePemasukanKategoriIuranDto } from './dto/create-pemasukkan_kategori_iuran.dto';
import { UpdatePemasukanKategoriIuranDto } from './dto/update-pemasukkan_kategori_iuran.dto';

@Injectable()
export class PemasukanKategoriIuranService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, body: CreatePemasukanKategoriIuranDto) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('pemasukan_kategori_iuran')
        .insert({
          ...body,
        })
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      // Insert log
      const { error: logsError } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: createActivity('kategori iuran', body.nama),
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
        .from('pemasukan_kategori_iuran')
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
        .from('pemasukan_kategori_iuran')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new HttpException(error.message, 500);

      return data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async update(
    userId: string,
    id: string,
    body: UpdatePemasukanKategoriIuranDto,
  ) {
    try {
      const existing = await this.findOne(id);

      const { data, error } = await this.supabaseService
        .getClient()
        .from('pemasukan_kategori_iuran')
        .update({
          ...body,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      // Insert log
      const { error: logsError } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: updateActivity('kategori iuran', existing.nama),
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
        .from('pemasukan_kategori_iuran')
        .delete()
        .eq('id', id);

      if (error) throw new HttpException(error.message, 500);

      // Insert log
      const { error: logsError } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: deleteActivity('kategori iuran', existing.nama),
        });
      if (logsError) throw new HttpException(logsError.message, 500);

    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}