import { HttpException, Injectable, Logger } from '@nestjs/common';
import { CreateTransferChannelDto } from './dto/create-transfer-channel.dto';
import { UpdateTransferChannelDto } from './dto/update-transfer-channel.dto';
import { SupabaseService } from 'src/common/service/supabase.service';
import {
  createActivity,
  deleteActivity,
  updateActivity,
} from 'utils/log.utils';
import { Express } from 'express';

@Injectable()
export class TransferChannelService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(
    userId: string,
    body: CreateTransferChannelDto,
    files: {
      thumbnail?: Express.Multer.File[];
      qr?: Express.Multer.File[];
    },
  ) {
    try {
      const thumbnailFile = files?.thumbnail?.[0];
      const qrFile = files?.qr?.[0];

      const thumbnail_url = await this.supabaseService.uploadFile(
        'thumbnails',
        thumbnailFile,
      );

      const qr_url = await this.supabaseService.uploadFile('qrs', qrFile);

      const { data, error } = await this.supabaseService
        .getAdminClient()
        .from('transfer_channel')
        .insert({
          nama_channel: body.nama_channel,
          tipe_channel: body.tipe_channel,
          pemilik: body.pemilik,
          catatan: body.catatan,
          thumbnail_url,
          qr_url,
        })
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      await this.supabaseService
        .getAdminClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: createActivity('transfer_channel', body.nama_channel),
        });

      return data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findAll() {
    try {
      const { data, error } = await this.supabaseService
        .getAdminClient()
        .from('transfer_channel')
        .select(
          `
          *,
          warga:data_warga(nama)
        `,
        );

      if (error) throw new HttpException(error.message, 500);

      return data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async findOne(id: string) {
    try {
      const { data, error } = await this.supabaseService
        .getAdminClient()
        .from('transfer_channel')
        .select(
          `
          *,
          warga:data_warga(nama)
        `,
        )
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
    body: UpdateTransferChannelDto,
    files: {
      thumbnail?: Express.Multer.File[];
      qr?: Express.Multer.File[];
    },
  ) {
    try {
      const existing = await this.findOne(id);

      const thumbnailFile = files?.thumbnail?.[0];
      const qrFile = files?.qr?.[0];

      let thumbnail_url = existing.thumbnail_url;
      let qr_url = existing.qr_url;

      if (thumbnailFile) {
        const oldThumbnailPath = this.supabaseService.extractPathFromPublicUrl(
          existing.thumbnail_url,
        );
        await this.supabaseService.removeFile(oldThumbnailPath);

        thumbnail_url = await this.supabaseService.uploadFile(
          'thumbnails',
          thumbnailFile,
        );
      }

      if (qrFile) {
        const oldQrPath = this.supabaseService.extractPathFromPublicUrl(
          existing.qr_url,
        );
        await this.supabaseService.removeFile(oldQrPath);

        qr_url = await this.supabaseService.uploadFile('qrs', qrFile);
      }

      const { data, error } = await this.supabaseService
        .getAdminClient()
        .from('transfer_channel')
        .update({
          nama_channel: body.nama_channel ?? existing.nama_channel,
          tipe_channel: body.tipe_channel ?? existing.tipe_channel,
          pemilik: body.pemilik ?? existing.pemilik,
          catatan: body.catatan ?? existing.catatan,
          thumbnail_url,
          qr_url,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw new HttpException(error.message, 500);

      await this.supabaseService
        .getAdminClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: updateActivity('transfer_channel', data.nama_channel),
        });

      return data;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async remove(userId: string, id: string) {
    try {
      const data = await this.findOne(id);

      const thumbnailPath = this.supabaseService.extractPathFromPublicUrl(
        data.thumbnail_url,
      );

      const qrPath = this.supabaseService.extractPathFromPublicUrl(data.qr_url);

      await this.supabaseService.removeFile(thumbnailPath);
      await this.supabaseService.removeFile(qrPath);

      const { error } = await this.supabaseService
        .getAdminClient()
        .from('transfer_channel')
        .delete()
        .eq('id', id);

      if (error) throw new HttpException(error.message, 500);

      await this.supabaseService
        .getAdminClient()
        .from('log_aktifitas')
        .insert({
          aktor_id: userId,
          deskripsi: deleteActivity('transfer_channel', data.nama_channel),
        });
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
