import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { CreateWargaDto } from './dto/create-warga.dto';
import { UpdateWargaDto } from './dto/update-warga.dto';

@Injectable()
export class WargaService {
  private readonly tableName = 'data_warga';
  private readonly selectColumns = 
    'id, nama, tempat_lahir, tanggal_lahir, no_telp, jenis_kelamin, agama, golongan_darah, pendidikan_terakhir, pekerjaan, peran, status, keluarga_id, created_at';

  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  async create(createWargaDto: CreateWargaDto) {
    // Explicitly set keluarga_id to null if not provided or empty
    const insertData = {
      ...createWargaDto,
      keluarga_id: createWargaDto.keluarga_id || null,
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
    const { data, error } = await this.client
      .from(this.tableName)
      .select(this.selectColumns)
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
      .single();

    if (error) {
      if (
        error.code === 'PGRST116' ||
        error.message.includes('Row not found')
      ) {
        // PGRST116 = no rows returned
        throw new NotFoundException(`Warga with id ${id} not found`);
      }
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(`Warga with id ${id} not found`);
    }

    return data;
  }

  async update(id: string, updateWargaDto: UpdateWargaDto) {
    const { data, error } = await this.client
      .from(this.tableName)
      .update(updateWargaDto)
      .eq('id', id)
      .select(this.selectColumns)
      .single();

    if (error) {
      if (
        error.code === 'PGRST116' ||
        error.message.includes('Row not found')
      ) {
        throw new NotFoundException(`Warga with id ${id} not found`);
      }
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(`Warga with id ${id} not found`);
    }

    return data;
  }

  async remove(id: string) {
    const { data, error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(`Warga with id ${id} not found`);
    }
  }
}
