import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { CreateMutasiDto } from './dto/create-mutasi.dto';
import { UpdateMutasiDto } from './dto/update-mutasi.dto';

@Injectable()
export class MutasiService {
  private readonly tableName = 'mutasi_keluarga';

  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  async create(dto: CreateMutasiDto) {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(dto)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  async findAll() {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data ?? [];
  }

  async findOne(id: number) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('Row not found')) {
        throw new NotFoundException(`Mutasi with id ${id} not found`);
      }
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(`Mutasi with id ${id} not found`);
    }

    return data;
  }

  async update(id: number, dto: UpdateMutasiDto) {
    const { data, error } = await this.client
      .from(this.tableName)
      .update(dto)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('Row not found')) {
        throw new NotFoundException(`Mutasi with id ${id} not found`);
      }
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException(`Mutasi with id ${id} not found`);
    }

    return data;
  }

  async remove(id: number) {
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
      throw new NotFoundException(`Mutasi with id ${id} not found`);
    }
  }
}
