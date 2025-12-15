import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';

function normalizeSingleResult(resp: { data: any; error: any }) {
  if (resp.error) throw resp.error;

  const d = resp.data;
  if (Array.isArray(d)) {
    if (d.length === 0) return null;
    if (d.length === 1) return d[0];
    return d;
  }
  return d;
}

@Injectable()
export class FamiliesService {
  private readonly tableName = 'data_keluarga';

  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  private async setRumahStatusDitempati(rumahId: string) {
    const resp = await this.client
      .from('data_rumah')
      .update({ status: 'Ditempati' })
      .eq('id', rumahId);

    if (resp.error) throw resp.error;
  }

  async create(userId: string, body: CreateFamilyDto) {
    try {
      const resp = await this.client
        .from(this.tableName)
        .insert({
          ...body,
        })
        .select('*');

      const data = normalizeSingleResult(resp);
      if (Array.isArray(data)) return data[0];
      if (body.rumah_id) await this.setRumahStatusDitempati(body.rumah_id);
      return data;
    } catch (err) {
      const msg = err?.message ?? JSON.stringify(err);
      throw new HttpException(msg, 500);
    }
  }

  async findAll() {
    try {
      const resp = await this.client
        .from(this.tableName)
        .select(`
          id,
          nama,
          status_kepemilikan,
          status_keluarga,
          created_at,
          kepala_keluarga_id (
            id,
            nama
          ),
          rumah_id (
            id,
            alamat
          )
        `)
        .order('created_at', { ascending: false });

      if (resp.error) throw resp.error;
      return resp.data ?? [];
    } catch (err) {
      const msg = err?.message ?? JSON.stringify(err);
      throw new HttpException(msg, 500);
    }
  }

  async findOne(id: string) {
    try {
      const resp1 = await this.client
        .from(this.tableName)
        .select(`
          id,
          nama,
          status_kepemilikan,
          status_keluarga,
          created_at,
          kepala_keluarga_id (
            id,
            nama
          ),
          rumah_id (
            id,
            alamat
          )
        `)
        .eq('id', id);

      const family = normalizeSingleResult(resp1);
      if (!family) throw new HttpException('Family not found', 404);
      if (Array.isArray(family)) {
        throw new HttpException(
          `Multiple families returned for id ${id}. Count=${family.length}`,
          500,
        );
      }

      const resp2 = await this.client
        .from('data_warga')
        .select('id, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, peran, status, created_at')
        .eq('keluarga_id', id)
        .order('created_at', { ascending: false });

      const members = resp2.error ? [] : resp2.data ?? [];

      return { ...family, members };
    } catch (err) {
      const msg = err?.message ?? JSON.stringify(err);
      throw new HttpException(msg, 500);
    }
  }

  async update(userId: string, id: string, body: UpdateFamilyDto) {
    try {
      const resp = await this.client
        .from(this.tableName)
        .update({
          ...body,
        })
        .eq('id', id)
        .select('*');

      const data = normalizeSingleResult(resp);
      if (Array.isArray(data)) return data[0];
      if (body.rumah_id) await this.setRumahStatusDitempati(body.rumah_id);
      return data;
    } catch (err) {
      const msg = err?.message ?? JSON.stringify(err);
      throw new HttpException(msg, 500);
    }
  }

  async remove(userId: string, id: string) {
    try {
      const check = await this.client
        .from(this.tableName)
        .select('id, nama')
        .eq('id', id);

      if (check.error) throw check.error;
      const existing = normalizeSingleResult(check);
      if (!existing) throw new HttpException('Family not found', 404);

      const del = await this.client
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (del.error) throw del.error;
      return;
    } catch (err) {
      const msg = err?.message ?? JSON.stringify(err);
      throw new HttpException(msg, 500);
    }
  }
}
