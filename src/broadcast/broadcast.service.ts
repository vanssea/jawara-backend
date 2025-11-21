import { HttpException, Injectable } from '@nestjs/common';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { UpdateBroadcastDto } from './dto/update-broadcast.dto';
import { SupabaseService } from 'src/common/service/supabase.service';
import {
  createActivity,
  deleteActivity,
  updateActivity,
} from 'utils/log.utils';

@Injectable()
export class BroadcastService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, body: CreateBroadcastDto) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('broadcast')
        .insert({
          ...body,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      const { error: logsError } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: createActivity('broadcast', body.judul),
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
        .from('broadcast')
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
        .from('broadcast')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new HttpException(error.message, 500);

      return data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async update(userId: string, id: string, body: UpdateBroadcastDto) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('broadcast')
        .update({
          ...body,
          created_by: userId,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      const { error: logsError } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: updateActivity('broadcast', data.judul),
        });
      if (logsError) throw new HttpException(logsError.message, 500);

      return data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async remove(userId: string, id: string) {
    try {
      const data = await this.findOne(id);

      const { error } = await this.supabaseService
        .getClient()
        .from('broadcast')
        .delete()
        .eq('id', id);

      if (error) throw new HttpException(error.message, 500);

      const { error: logsError } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: deleteActivity('broadcast', data.judul),
        });
      if (logsError) throw new HttpException(logsError.message, 500);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
