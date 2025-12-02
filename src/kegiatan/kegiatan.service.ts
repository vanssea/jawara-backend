import { HttpException, Injectable } from '@nestjs/common';
import { CreateKegiatanDto } from './dto/create-kegiatan.dto';
import { UpdateKegiatanDto } from './dto/update-kegiatan.dto';
import { SupabaseService } from 'src/common/service/supabase.service';
import {
  createActivity,
  deleteActivity,
  updateActivity,
} from 'utils/log.utils';

@Injectable()
export class KegiatanService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, body: CreateKegiatanDto, dokumentasiFile?: Express.Multer.File) {
    try {
      let link_dokumentasi: string | null | undefined;

      if (dokumentasiFile) {
        link_dokumentasi = await this.supabaseService.uploadFile('kegiatan/photos', dokumentasiFile);
      }

      const { data, error } = await this.supabaseService
        .getClient()
        .from('kegiatan')
        .insert({
          ...body,
          link_dokumentasi: link_dokumentasi ?? body['link_dokumentasi'],
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
          deskripsi: createActivity('kegiatan', body.nama),
        });
      if (logsError) throw new HttpException(logsError.message, 500);

      return data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findAll() {
    try {
      const client = this.supabaseService.getClient();

      const { data, error } = await client.from('kegiatan').select('*');
      if (error) throw new HttpException(error.message, 500);

      const kategoriIds = Array.from(
        new Set(
          (data || [])
            .map((k: any) => k.kategori_id)
            .filter((id: any) => id !== null && id !== undefined),
        ),
      );

      let kategoriMap: Record<number, string> = {};
      if (kategoriIds.length > 0) {
        const { data: kategoriData, error: kategoriError } = await client
          .from('kegiatan_kategori')
          .select('id, nama')
          .in('id', kategoriIds);
        if (kategoriError) throw new HttpException(kategoriError.message, 500);
        kategoriMap = (kategoriData || []).reduce(
          (acc: Record<number, string>, row: any) => {
            acc[row.id] = row.nama;
            return acc;
          },
          {},
        );
      }

      const enriched = (data || []).map((row: any) => ({
        ...row,
        kategori: row.kategori_id != null ? kategoriMap[row.kategori_id] ?? null : null,
      }));

      return enriched;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findOne(id: string) {
    try {
      const client = this.supabaseService.getClient();
      const { data, error } = await client
        .from('kegiatan')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new HttpException(error.message, 500);

      if (!data) return data;

      let kategoriName: string | null = null;
      if (data.kategori_id != null) {
        const { data: kategori, error: kategoriError } = await client
          .from('kegiatan_kategori')
          .select('nama')
          .eq('id', data.kategori_id)
          .single();
        if (kategoriError) throw new HttpException(kategoriError.message, 500);
        kategoriName = kategori?.nama ?? null;
      }

      return { ...data, kategori: kategoriName };
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async update(userId: string, id: string, body: UpdateKegiatanDto, dokumentasiFile?: Express.Multer.File) {
    try {
      const existing = await this.findOne(id);
      let link_dokumentasi = existing.link_dokumentasi;

      if (dokumentasiFile) {
        // Remove old photo if exists
        if (existing.link_dokumentasi) {
          const oldPhotoPath = this.supabaseService.extractPathFromPublicUrl(existing.link_dokumentasi);
          await this.supabaseService.removeFile(oldPhotoPath);
        }
        link_dokumentasi = await this.supabaseService.uploadFile('kegiatan/photos', dokumentasiFile);
      }

      const { data, error } = await this.supabaseService
        .getClient()
        .from('kegiatan')
        .update({
          ...body,
          link_dokumentasi,
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
          deskripsi: updateActivity('kegiatan', data.nama),
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

      // Remove photo if exists
      if (data.link_dokumentasi) {
        const photoPath = this.supabaseService.extractPathFromPublicUrl(data.link_dokumentasi);
        await this.supabaseService.removeFile(photoPath);
      }

      const { error } = await this.supabaseService
        .getClient()
        .from('kegiatan')
        .delete()
        .eq('id', id);

      if (error) throw new HttpException(error.message, 500);

      const { error: logsError } = await this.supabaseService
        .getClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: deleteActivity('kegiatan', data.nama),
        });
      if (logsError) throw new HttpException(logsError.message, 500);
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
