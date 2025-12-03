import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { CreatePenerimaanWargaDto } from './dto/create-penerimaan-warga.dto';
import { UpdatePenerimaanWargaDto } from './dto/update-penerimaan-warga.dto';

@Injectable()
export class PenerimaanWargaService {
  private readonly tableName = 'data_warga';
  private readonly selectColumns =
    'id, nama, tempat_lahir, tanggal_lahir, no_telp, jenis_kelamin, agama, golongan_darah, pendidikan_terakhir, pekerjaan, peran, status, foto_identitas, status_penerimaan, created_at';

  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  async create(
    createDto: CreatePenerimaanWargaDto,
    fotoIdentitasFile?: Express.Multer.File,
  ) {
    let foto_identitas: string | null | undefined;

    // Upload foto identitas if provided
    if (fotoIdentitasFile) {
      foto_identitas = await this.supabaseService.uploadFile(
        'penerimaan-warga/identitas',
        fotoIdentitasFile,
      );
    }

    // Auto-set status_penerimaan to 'pending'
    const insertData = {
      ...createDto,
      foto_identitas: foto_identitas ?? createDto['foto_identitas'],
      status_penerimaan: 'pending',
      keluarga_id: null, // No keluarga_id for penerimaan_warga
    };

    const { data, error } = await this.client
      .from(this.tableName)
      .insert(insertData)
      .select(this.selectColumns)
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async findAll() {
    // Only get records with non-null status_penerimaan
    const { data, error } = await this.client
      .from(this.tableName)
      .select(this.selectColumns)
      .not('status_penerimaan', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data ?? [];
  }

  async findOne(id: string) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(this.selectColumns)
      .eq('id', id)
      .not('status_penerimaan', 'is', null)
      .single();

    if (error) {
      if (
        error.code === 'PGRST116' ||
        error.message.includes('Row not found')
      ) {
        throw new NotFoundException(`Penerimaan warga with id ${id} not found`);
      }
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(`Penerimaan warga with id ${id} not found`);
    }

    return data;
  }

  async update(
    id: string,
    updateDto: UpdatePenerimaanWargaDto,
    fotoIdentitasFile?: Express.Multer.File,
  ) {
    const existing = await this.findOne(id);
    let foto_identitas = existing.foto_identitas;

    // Upload new foto identitas if provided
    if (fotoIdentitasFile) {
      // Remove old photo if exists
      if (existing.foto_identitas) {
        const oldPhotoPath = this.supabaseService.extractPathFromPublicUrl(
          existing.foto_identitas,
        );
        await this.supabaseService.removeFile(oldPhotoPath);
      }
      foto_identitas = await this.supabaseService.uploadFile(
        'penerimaan-warga/identitas',
        fotoIdentitasFile,
      );
    }

    // If status_penerimaan changed to 'diterima', also update warga status to 'Aktif'
    const updateData = {
      ...updateDto,
      foto_identitas,
      ...(updateDto.status_penerimaan === 'diterima' && { status: 'Aktif' }),
    };

    const { data, error } = await this.client
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select(this.selectColumns)
      .single();

    if (error) {
      if (
        error.code === 'PGRST116' ||
        error.message.includes('Row not found')
      ) {
        throw new NotFoundException(`Penerimaan warga with id ${id} not found`);
      }
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(`Penerimaan warga with id ${id} not found`);
    }

    return data;
  }

  async remove(id: string) {
    const data = await this.findOne(id);

    // Remove foto identitas if exists
    if (data.foto_identitas) {
      const photoPath = this.supabaseService.extractPathFromPublicUrl(
        data.foto_identitas,
      );
      await this.supabaseService.removeFile(photoPath);
    }

    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
