import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { CreateRumahDto } from './dto/create-rumah.dto';
import { UpdateRumahDto } from './dto/update-rumah.dto';
import { createActivity, deleteActivity, updateActivity } from 'utils/log.utils';

@Injectable()
export class RumahService {
  private table = 'data_rumah';

  constructor(private readonly supabaseService: SupabaseService) {}

  private client() {
    return this.supabaseService.getClient();
  }

  async create(userId: string, dto: CreateRumahDto) {
    try {
      // removed created_by to match actual DB schema
      const payload = {
        alamat: dto.alamat,
        status: dto.status,
      };

      const { data, error } = await this.client()
        .from(this.table)
        .insert(payload)
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      const { error: logsError } = await this.client()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: createActivity('data_rumah', data.alamat ?? data.id),
        });
      if (logsError) throw new HttpException(logsError.message, 500);

      return data;
    } catch (err) {
      throw new HttpException(err.message ?? String(err), 500);
    }
  }

  async findAll() {
    try {
      const { data, error } = await this.client()
        .from(this.table)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new HttpException(error.message, 500);
      return data;
    } catch (err) {
      throw new HttpException(err.message ?? String(err), 500);
    }
  }

  async findOne(id: string) {
    try {
      const { data, error } = await this.client()
        .from(this.table)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw new HttpException(error.message, 500);
      if (!data) throw new NotFoundException(`data_rumah with id ${id} not found`);
      return data;
    } catch (err) {
      throw new HttpException(err.message ?? String(err), 500);
    }
  }

  async update(userId: string, id: string, dto: UpdateRumahDto) {
    try {
      const existing = await this.findOne(id);
      if (!existing) throw new NotFoundException(`data_rumah with id ${id} not found`);

      // prevent altering created_at or id by DTO (DTO doesn't include those)
      const payload: any = { ...dto };

      const { data, error } = await this.client()
        .from(this.table)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      const { error: logsError } = await this.client()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: updateActivity('data_rumah', `${existing.id}`),
        });
      if (logsError) throw new HttpException(logsError.message, 500);

      return data;
    } catch (err) {
      throw new HttpException(err.message ?? String(err), 500);
    }
  }

  async remove(userId: string, id: string) {
    try {
      const existing = await this.findOne(id);
      if (!existing) throw new NotFoundException(`data_rumah with id ${id} not found`);

      const { error } = await this.client()
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) throw new HttpException(error.message, 500);

      const { error: logsError } = await this.client()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: deleteActivity('data_rumah', `${existing.id}`),
        });
      if (logsError) throw new HttpException(logsError.message, 500);

      return { deleted: true };
    } catch (err) {
      throw new HttpException(err.message ?? String(err), 500);
    }
  }
}
