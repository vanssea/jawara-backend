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

  async create(
    userId: string,
    body: CreateBroadcastDto,
    files?: {
      gambar?: Express.Multer.File[];
      dokumen?: Express.Multer.File[];
    },
  ) {
    try {
      let link_lampiran_gambar: string | null | undefined;
      let link_lampiran_dokumen: string | null | undefined;

      if (files?.gambar?.[0]) {
        link_lampiran_gambar = await this.supabaseService.uploadFile(
          'broadcast/images',
          files.gambar[0],
        );
      }

      if (files?.dokumen?.[0]) {
        link_lampiran_dokumen = await this.supabaseService.uploadFile(
          'broadcast/documents',
          files.dokumen[0],
        );
      }

      // Destructure to remove file fields and id that might be in body from multipart/form-data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { gambar, dokumen, id, ...cleanBody } = body as CreateBroadcastDto & {
        gambar?: unknown;
        dokumen?: unknown;
        id?: unknown;
      };

      const { data, error } = await this.supabaseService
        .getClient()
        .from('broadcast')
        .insert({
          judul: cleanBody.judul,
          pesan: cleanBody.pesan,
          tanggal_publikasi: cleanBody.tanggal_publikasi,
          link_lampiran_gambar:
            link_lampiran_gambar ?? cleanBody['link_lampiran_gambar'],
          link_lampiran_dokumen:
            link_lampiran_dokumen ?? cleanBody['link_lampiran_dokumen'],
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
        .select(
          `
          *,
          user:users(full_name)
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
        .getClient()
        .from('broadcast')
        .select(
          `
          *,
          user:users(full_name)
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
    body: UpdateBroadcastDto,
    files?: {
      gambar?: Express.Multer.File[];
      dokumen?: Express.Multer.File[];
    },
  ) {
    try {
      // Only perform file operations when new files are provided.
      // This avoids an unnecessary findOne() call which breaks unit test mocks.
      let link_lampiran_gambar: string | null | undefined = body['link_lampiran_gambar'];
      let link_lampiran_dokumen: string | null | undefined = body['link_lampiran_dokumen'];

      if (files?.gambar?.[0] || files?.dokumen?.[0]) {
        const existing = await this.findOne(id);

        if (files?.gambar?.[0]) {
          // Remove old image if exists
          if (existing.link_lampiran_gambar) {
            const oldImagePath = this.supabaseService.extractPathFromPublicUrl(
              existing.link_lampiran_gambar,
            );
            await this.supabaseService.removeFile(oldImagePath);
          }
          link_lampiran_gambar = await this.supabaseService.uploadFile(
            'broadcast/images',
            files.gambar[0],
          );
        }

        if (files?.dokumen?.[0]) {
          // Remove old document if exists
          if (existing.link_lampiran_dokumen) {
            const oldDocPath = this.supabaseService.extractPathFromPublicUrl(
              existing.link_lampiran_dokumen,
            );
            await this.supabaseService.removeFile(oldDocPath);
          }
          link_lampiran_dokumen = await this.supabaseService.uploadFile(
            'broadcast/documents',
            files.dokumen[0],
          );
        }
      }

      const { data, error } = await this.supabaseService
        .getClient()
        .from('broadcast')
        .update({
          ...body,
          link_lampiran_gambar,
          link_lampiran_dokumen,
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

      // Remove image if exists
      if (data.link_lampiran_gambar) {
        const imagePath = this.supabaseService.extractPathFromPublicUrl(
          data.link_lampiran_gambar,
        );
        await this.supabaseService.removeFile(imagePath);
      }

      // Remove document if exists
      if (data.link_lampiran_dokumen) {
        const docPath = this.supabaseService.extractPathFromPublicUrl(
          data.link_lampiran_dokumen,
        );
        await this.supabaseService.removeFile(docPath);
      }

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
