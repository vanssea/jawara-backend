import { HttpException, Injectable } from '@nestjs/common';
import { CreatePemasukkanNonIuranDto } from './dto/create-pemasukkan_non_iuran.dto';
import { UpdatePemasukkanNonIuranDto } from './dto/update-pemasukkan_non_iuran.dto';
import { SupabaseService } from 'src/common/service/supabase.service';
import { createActivity, updateActivity, deleteActivity } from 'utils/log.utils';

@Injectable()
export class PemasukkanNonIuranService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(
    userId: string,
    body: CreatePemasukkanNonIuranDto,
    files?: { bukti?: Express.Multer.File[] },
  ) {
    try {
      let link_bukti_pemasukan: string | null | undefined;

      // Upload file bukti
      if (files?.bukti?.[0]) {
        link_bukti_pemasukan = await this.supabaseService.uploadFile(
          'pemasukan_non_iuran/bukti',
          files.bukti[0],
        );
      }

      const { data, error } = await this.supabaseService
        .getClient()
        .from('pemasukan_non_iuran')
        .insert({
          ...body,
          link_bukti_pemasukan:
            link_bukti_pemasukan ?? body.link_bukti_pemasukan,
        })
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      // Log aktivitas
      const { error: logsError } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: createActivity('pemasukan_non_iuran', body.nama),
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
        .from('pemasukan_non_iuran')
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
        .from('pemasukan_non_iuran')
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
    body: UpdatePemasukkanNonIuranDto,
    files?: { bukti?: Express.Multer.File[] },
  ) {
    try {
      const existing = await this.findOne(id);
      let link_bukti_pemasukan = existing.link_bukti_pemasukan;

      // Upload bukti baru
      if (files?.bukti?.[0]) {
        if (existing.link_bukti_pemasukan) {
          const oldPath = this.supabaseService.extractPathFromPublicUrl(
            existing.link_bukti_pemasukan,
          );
          await this.supabaseService.removeFile(oldPath);
        }

        link_bukti_pemasukan = await this.supabaseService.uploadFile(
          'pemasukan_non_iuran/bukti',
          files.bukti[0],
        );
      }

      const { data, error } = await this.supabaseService
        .getClient()
        .from('pemasukan_non_iuran')
        .update({
          ...body,
          link_bukti_pemasukan,
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
          deskripsi: updateActivity('pemasukan_non_iuran', data.nama),
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

      // Hapus bukti jika ada
      if (data.link_bukti_pemasukan) {
        const path = this.supabaseService.extractPathFromPublicUrl(
          data.link_bukti_pemasukan,
        );
        await this.supabaseService.removeFile(path);
      }

      const { error } = await this.supabaseService
        .getClient()
        .from('pemasukan_non_iuran')
        .delete()
        .eq('id', id);

      if (error) throw new HttpException(error.message, 500);

      // Log hapus
      const { error: logsError } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: deleteActivity('pemasukan_non_iuran', data.nama),
        });

      if (logsError) throw new HttpException(logsError.message, 500);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}