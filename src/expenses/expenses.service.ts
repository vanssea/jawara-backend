import { HttpException, Injectable } from '@nestjs/common';
import { CreateExpensesDto } from './dto/create-expenses.dto';
import { UpdateExpensesDto } from './dto/update-expenses.dto';
import { SupabaseService } from 'src/common/service/supabase.service';
import {
  createActivity,
  deleteActivity,
  updateActivity,
} from 'utils/log.utils';

@Injectable()
export class ExpensesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // CREATE
  async create(userId: string, body: CreateExpensesDto) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('pengeluaran')
        .insert({
          ...body,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      await this.supabaseService
        .getClient()
        .from('pengeluaran')
        .insert({
          aktor_id: userId,
          deskripsi: createActivity('expenses', body.nama_pengeluaran),
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
      .from('pengeluaran')
      .select('*');

    if (error) throw new HttpException(error.message, 500);
    return data;
  }

  // READ ONE by ID
  async findOne(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('pengeluaran')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new HttpException(error.message, 500);
    return data;
  }

  // UPDATE
  async update(userId: string, id: string, body: UpdateExpensesDto) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('pengeluaran')
        .update({
          ...body,
          updated_by: userId,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      await this.supabaseService
        .getClient()
        .from('pengeluaran')
        .insert({
          aktor_id: userId,
          deskripsi: updateActivity('expenses', data.judul),
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
        .from('pengeluaran')
        .delete()
        .eq('id', id);

      if (error) throw new HttpException(error.message, 500);

      await this.supabaseService
        .getClient()
        .from('pengeluaran')
        .insert({
          aktor_id: userId,
          deskripsi: deleteActivity('expenses', oldData.judul),
        });
    } catch (err) {
      throw new HttpException(err.message, 500);
    }
  }
}
