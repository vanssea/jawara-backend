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

  private mapExpense(row: any) {
    if (!row) return row;
    return {
      ...row,
      kategori_nama: row.kategori?.nama ?? null,
      verifikator_nama: null,
    };
  }

  private async attachVerifikatorNames<T extends any | any[]>(rows: T) {
    const list = Array.isArray(rows) ? rows : [rows];
    const verIds = Array.from(
      new Set(
        list
          .map((r) => r?.verifikator)
          .filter((v): v is string => Boolean(v)),
      ),
    );

    const nameMap = new Map<string, string>();

    if (verIds.length > 0) {
      try {
        let adminCandidate: any = (this.supabaseService as any).getAdminClient;
        if (typeof adminCandidate === 'function') {
          // call it; it may itself return a function (mocks sometimes wrap)
          adminCandidate = adminCandidate();
        }
        if (typeof adminCandidate === 'function') {
          adminCandidate = adminCandidate();
        }

        const admin = adminCandidate;
        if (admin?.auth?.admin?.getUserById) {
          await Promise.all(
            verIds.map(async (id) => {
              try {
                const { data } = await admin.auth.admin.getUserById(id);
                const user = data?.user;
                if (user) {
                  const meta = user.user_metadata || {};
                  const name =
                    meta.full_name || meta.name || user.email || user.phone || id;
                  nameMap.set(id, name);
                }
              } catch (e) {
                // swallow; leave map empty for this id
              }
            }),
          );
        }
      } catch (e) {
        // ignore and continue with empty map
      }
    }

    const mapped = list.map((row) => {
      const base = this.mapExpense(row);
      if (row?.verifikator && nameMap.has(row.verifikator)) {
        base.verifikator_nama = nameMap.get(row.verifikator);
      }
      return base;
    });

    return Array.isArray(rows) ? (mapped as T) : (mapped[0] as T);
  }

  // CREATE
  // CREATE
  async create(userId: string, body: CreateExpensesDto) {
    try {
      const now = new Date().toISOString();
      const shouldVerify = Boolean(
        body.verifikator || body.tanggal_terverifikasi,
      );
      const payload = {
        nama: body.nama,
        kategori_id: body.kategori_id,
        tanggal_transaksi: body.tanggal_transaksi,
        nominal: body.nominal,
        tanggal_terverifikasi: shouldVerify ? body.tanggal_terverifikasi ?? now : null,
        verifikator: shouldVerify ? body.verifikator ?? userId : null,
      };

      const { data, error } = await this.supabaseService
        .getClient()
        .from('pengeluaran')
        .insert(payload)
        .select(`*, kategori:pengeluaran_kategori(id, nama) `)
        .single();

      if (error) throw new HttpException(error.message, 500);

      await this.supabaseService
        .getClient()
        .from('aktivitas')
        .insert({
          aktor_id: userId,
          deskripsi: createActivity('expenses', body.nama),
        });

      return this.attachVerifikatorNames(this.mapExpense(data));
    } catch (err) {
      throw new HttpException(err.message, 500);
    }
  }

  // READ ALL
  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('pengeluaran')
      .select(`*, kategori:pengeluaran_kategori(id, nama)`);

    if (error) throw new HttpException(error.message, 500);
    if (!Array.isArray(data)) return [];
    return this.attachVerifikatorNames(data.map((row) => this.mapExpense(row)));
  }

  async findCategories() {
    const q = this.supabaseService
      .getClient()
      .from('pengeluaran_kategori')
      .select('id, nama');

    let data: any, error: any;
    if (q && typeof q.order === 'function') {
      ({ data, error } = await q.order('nama', { ascending: true }));
    } else {
      ({ data, error } = await q);
    }

    if (error) throw new HttpException(error.message, 500);
    return data;
  }

  // READ ONE by ID
  async findOne(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('pengeluaran')
      .select(`*, kategori:pengeluaran_kategori(id, nama)`)
      .eq('id', id)
      .single();

    if (error) throw new HttpException(error.message, 500);
    return this.attachVerifikatorNames(this.mapExpense(data));
  }

  // UPDATE
  async update(userId: string, id: string, body: UpdateExpensesDto) {
    try {
      const now = new Date().toISOString();
      const shouldVerify = Boolean(
        body.verifikator || body.tanggal_terverifikasi,
      );
      const payload: Record<string, unknown> = {};

      if (body.nama !== undefined) payload.nama = body.nama;
      if (body.kategori_id !== undefined) payload.kategori_id = body.kategori_id;
      if (body.tanggal_transaksi !== undefined)
        payload.tanggal_transaksi = body.tanggal_transaksi;
      if (body.nominal !== undefined) payload.nominal = body.nominal;

      if (body.verifikator !== undefined) {
        payload.verifikator = body.verifikator;
      }

      if (shouldVerify) {
        payload.tanggal_terverifikasi = body.tanggal_terverifikasi ?? now;
        payload.verifikator = body.verifikator ?? userId;
      } else if (body.tanggal_terverifikasi !== undefined) {
        payload.tanggal_terverifikasi = body.tanggal_terverifikasi;
      }

      const { data, error } = await this.supabaseService
        .getClient()
        .from('pengeluaran')
        .update(payload)
        .eq('id', id)
        .select(`*, kategori:pengeluaran_kategori(id, nama)`)
        .single();

      if (error) throw new HttpException(error.message, 500);

      await this.supabaseService
        .getClient()
        .from('aktivitas')
        .insert({
          aktor_id: userId,
          deskripsi: updateActivity('expenses', (data && (data.nama ?? data.judul)) ?? ''),
        });

      return this.attachVerifikatorNames(this.mapExpense(data));
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
        .from('aktivitas')
        .insert({
          aktor_id: userId,
          deskripsi: deleteActivity('expenses', (oldData && (oldData.judul ?? oldData.nama)) ?? ''),
        });
    } catch (err) {
      throw new HttpException(err.message, 500);
    }
  }
}
