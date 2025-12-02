import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { CreateMutasiDto } from './dto/create-mutasi.dto';
import { UpdateMutasiDto } from './dto/update-mutasi.dto';
import {
  createActivity,
  updateActivity,
  deleteActivity,
} from 'utils/log.utils';

@Injectable()
export class MutasiService {
  private readonly tableName = 'mutasi_keluarga';

  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  // create accepts userId and body (mirip broadcast)
  async create(userId: string, body: CreateMutasiDto) {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .insert({
          ...body,
          created_by: userId,
        })
        .select('*')
        .single();

      if (error) throw new HttpException(error.message, 500);

      // optional: insert activity log (same pattern as broadcast)
      const { error: logsError } = await this.client
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: createActivity('mutasi', `${data.id}`),
        });
      if (logsError) throw new HttpException(logsError.message, 500);

      return data;
    } catch (error) {
      throw new HttpException(error.message || 'Internal server error', 500);
    }
  }

  async findAll() {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new HttpException(error.message, 500);

      return data ?? [];
    } catch (error) {
      throw new HttpException(error.message || 'Internal server error', 500);
    }
  }

  // id as string to match controller style
  async findOne(id: string) {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new HttpException(error.message, 500);

      return data;
    } catch (error) {
      throw new HttpException(error.message || 'Internal server error', 500);
    }
  }

  async update(userId: string, id: string, body: UpdateMutasiDto) {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .update({
          ...body,
          updated_by: userId,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new HttpException(error.message, 500);

      const { error: logsError } = await this.client
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: updateActivity('mutasi', `${data.id}`),
        });
      if (logsError) throw new HttpException(logsError.message, 500);

      return data;
    } catch (error) {
      throw new HttpException(error.message || 'Internal server error', 500);
    }
  }

  async remove(userId: string, id: string) {
    try {
      // get data for logging (and to throw 404 if not exist)
      const existing = await this.findOne(id);

      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw new HttpException(error.message, 500);

      const { error: logsError } = await this.client
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: deleteActivity('mutasi', `${existing.id}`),
        });
      if (logsError) throw new HttpException(logsError.message, 500);
    } catch (error) {
      throw new HttpException(error.message || 'Internal server error', 500);
    }
  }
}
