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
  // CREATE
async create(userId: string, body: CreateExpensesDto) {
  try {
    const payload = {
      nama: body.nama,
      kategori_id: body.kategori_id,
      tanggal_transaksi: body.tanggal_transaksi,
      nominal: body.nominal,
      tanggal_terverifikasi: body.tanggal_terverifikasi ?? null,
      verifikator: body.verifikator ?? null,
    };

    const { data, error } = await this.supabaseService
      .getClient()
      .from('pengeluaran')
      .insert(payload)
      .select()
      .single();

    if (error) throw new HttpException(error.message, 500);

    // Insert ke tabel LOG (asumsi nama tabel: aktivitas)
    await this.supabaseService
      .getClient()
      .from('aktivitas')   // ⬅ ubah sesuai nama tabel log kamu
      .insert({
        aktor_id: userId,
        deskripsi: createActivity('expenses', body.nama),
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
  // UPDATE
async update(userId: string, id: string, body: UpdateExpensesDto) {
  try {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('pengeluaran')
      .update({
        ...body,
        // Hapus updated_by: userId jika field ini tidak ada di tabel 'pengeluaran'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new HttpException(error.message, 500);

    // 👇 LOGGING DIPERBAIKI
    await this.supabaseService
      .getClient()
      .from('aktivitas') // ✅ Tabel log yang benar
      .insert({
        aktor_id: userId,
        deskripsi: updateActivity('expenses', data.nama), // ✅ Menggunakan data.nama
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
