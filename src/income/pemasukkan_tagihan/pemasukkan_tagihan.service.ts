import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { CreatePemasukkanTagihanDto } from './dto/create-pemasukkan_tagihan.dto';
import { UpdatePemasukkanTagihanDto } from './dto/update-pemasukkan_tagihan.dto';
import {
  createActivity,
  deleteActivity,
  updateActivity,
} from 'utils/log.utils';

@Injectable()
export class PemasukkanTagihanService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // CREATE
  async create(userId: string, body: CreatePemasukkanTagihanDto) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('pemasukan_tagihan')
        .insert({
          ...body,
          created_by: userId,
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
          deskripsi: createActivity('pemasukan_tagihan', body.nama),
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
      .from('pemasukan_tagihan')
      .select('*');

    if (error) throw new HttpException(error.message, 500);
    return data;
  }

  // READ ONE by ID
  async findOne(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('pemasukan_tagihan')
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
    body: UpdatePemasukkanTagihanDto,
  ) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('pemasukan_tagihan')
        .update({
          ...body,
          updated_by: userId,
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
          deskripsi: updateActivity('pemasukan_tagihan', data.nama),
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
        .from('pemasukan_tagihan')
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
            'pemasukan_tagihan',
            oldData.nama,
          ),
        });
    } catch (err) {
      throw new HttpException(err.message, 500);
    }
  }
}