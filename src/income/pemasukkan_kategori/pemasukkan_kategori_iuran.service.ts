import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { CreatePemasukanKategoriIuranDto } from './dto/create-pemasukkan_kategori_iuran.dto';
import { UpdatePemasukanKategoriIuranDto } from './dto/update-pemasukkan_kategori_iuran.dto';
import { createActivity, deleteActivity, updateActivity } from 'utils/log.utils';

@Injectable()
export class PemasukanKategoriIuranService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // CREATE
  async create(userId: string, body: CreatePemasukanKategoriIuranDto) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('pemasukan_kategori_iuran')
        .insert({
          ...body,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      // Log aktivitas
      await this.supabaseService.getClient().from('pengeluaran').insert({
        aktor_id: userId,
        deskripsi: createActivity('pemasukan_kategori_iuran', body.nama),
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
      .from('pemasukan_kategori_iuran')
      .select('*');

    if (error) throw new HttpException(error.message, 500);
    return data;
  }

  // READ ONE
  async findOne(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('pemasukan_kategori_iuran')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new HttpException(error.message, 500);
    return data;
  }

  // UPDATE
  async update(userId: string, id: string, body: UpdatePemasukanKategoriIuranDto) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('pemasukan_kategori_iuran')
        .update({
          ...body,
          updated_by: userId,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      // Log aktivitas
      await this.supabaseService.getClient().from('pengeluaran').insert({
        aktor_id: userId,
        deskripsi: updateActivity('pemasukan_kategori_iuran', data.nama),
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
        .from('pemasukan_kategori_iuran')
        .delete()
        .eq('id', id);

      if (error) throw new HttpException(error.message, 500);

      // Log aktivitas
      await this.supabaseService.getClient().from('pengeluaran').insert({
        aktor_id: userId,
        deskripsi: deleteActivity('pemasukan_kategori_iuran', oldData.nama),
      });
    } catch (err) {
      throw new HttpException(err.message, 500);
    }
  }
}