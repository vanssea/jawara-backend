import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { CreatePemasukkanNonIuranDto } from './dto/create-pemasukkan_non_iuran.dto';
import { UpdatePemasukkanNonIuranDto } from './dto/update-pemasukkan_non_iuran.dto';
import {
  createActivity,
  deleteActivity,
  updateActivity,
} from 'utils/log.utils';

@Injectable()
export class PemasukkanNonIuranService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // CREATE
  async create(userId: string, body: CreatePemasukkanNonIuranDto) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('pemasukan_non_iuran')
        .insert({
          ...body,
          // created_at otomatis oleh Supabase
        })
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      // Log aktivitas
      await this.supabaseService
        .getClient()
        .from('pengeluaran')
        .insert({
          aktor_id: userId,
          deskripsi: createActivity('pemasukan_non_iuran', body.nama),
        });

      return data;
    } catch (err) {
      throw new HttpException(err.message, 500);
    }
  }

  // READ ALL
  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('pemasukan_non_iuran')
      .select('*');

    if (error) throw new HttpException(error.message, 500);
    return data;
  }

  // READ ONE by ID
  async findOne(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('pemasukan_non_iuran')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new HttpException(error.message, 500);
    return data;
  }

  // UPDATE
  async update(
    userId: string,
    id: string,
    body: UpdatePemasukkanNonIuranDto,
  ) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('pemasukan_non_iuran')
        .update({
          ...body,
          // updated_at otomatis jika diatur di Supabase trigger
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      // Log aktivitas
      await this.supabaseService
        .getClient()
        .from('pengeluaran')
        .insert({
          aktor_id: userId,
          deskripsi: updateActivity('pemasukan_non_iuran', data.nama),
        });

      return data;
    } catch (err) {
      throw new HttpException(err.message, 500);
    }
  }

  // DELETE
  async remove(userId: string, id: string) {
    try {
      const oldData = await this.findOne(id);

      const { error } = await this.supabaseService
        .getClient()
        .from('pemasukan_non_iuran')
        .delete()
        .eq('id', id);

      if (error) throw new HttpException(error.message, 500);

      // Log aktivitas
      await this.supabaseService
        .getClient()
        .from('pengeluaran')
        .insert({
          aktor_id: userId,
          deskripsi: deleteActivity(
            'pemasukan_non_iuran',
            oldData.nama,
          ),
        });
    } catch (err) {
      throw new HttpException(err.message, 500);
    }
  }
}
