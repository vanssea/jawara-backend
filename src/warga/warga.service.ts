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

  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  async create(createWargaDto: CreateWargaDto) {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(createWargaDto)
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

  async findOne(id: string) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
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
      .select('*')
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
