import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enum/user-role.enum';
import {
  createActivity,
  deleteActivity,
  updateActivity,
} from 'utils/log.utils';
import { WargaService } from 'src/warga/warga.service';
import { CreateWargaDto } from 'src/warga/dto/create-warga.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly wargaService: WargaService,
  ) {}

  private mapUser(authUser: any, userRow: any) {
    const metadata = authUser?.user_metadata || {};
    return {
      id: authUser?.id ?? userRow?.id,
      nama: userRow.full_name ?? metadata.full_name ?? null,
      email: authUser?.email ?? null,
      phone: metadata.phone ?? authUser?.phone ?? null,
      role: userRow?.role ?? metadata.role ?? null,
      created_at: userRow?.created_at ?? authUser?.created_at ?? null,
    };
  }

  async create(actorId: string, body: CreateUserDto) {
    const adminClient = this.supabaseService.getAdminClient();

    if (body.password !== body.confirm_password) {
      throw new HttpException(
        'Password dan konfirmasi password tidak sama',
        400,
      );
    }

    try {
      const { data: authCreate, error: authError } =
        await adminClient.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: {
            full_name: body.nama,
            role: body.role,
            phone: body.phone,
          },
        });

      if (authError || !authCreate?.user) {
        throw new HttpException(
          authError?.message || 'Failed to create auth user',
          500,
        );
      }

      const authUser = authCreate.user;

      const { data: userRow, error: insertError } = await adminClient
        .from('users')
        .insert({
          id: authUser.id,
          full_name: body.nama,
          phone: body.phone,
          role: body.role,
        })
        .select('*')
        .single();

      if (insertError) {
        await adminClient.auth.admin.deleteUser(authUser.id);
        throw new HttpException(insertError.message, 500);
      }

      if (body.role === UserRole.WARGA) {
        const wargaDto: CreateWargaDto = {
          nama: body.nama,
          no_telp: body.phone,
          peran: 'Warga',
          status: 'Aktif',
        };
        await this.wargaService.create(wargaDto);
      }

      await adminClient.from('log_aktifitas').insert({
        aktor_id: actorId,
        deskripsi: createActivity('user', body.nama),
      });

      return this.mapUser(authUser, userRow);
    } catch (error: any) {
      throw new HttpException(error.message, 500);
    }
  }

  async findAll() {
    const adminClient = this.supabaseService.getAdminClient();

    try {
      const { data: rows, error } = await adminClient.from('users').select('*');

      if (error) throw new HttpException(error.message, 500);
      if (!rows || rows.length === 0) return [];

      const mapped = await Promise.all(
        rows.map(async (row) => {
          const { data: authRes } = await adminClient.auth.admin.getUserById(
            row.id,
          );
          const authUser = authRes?.user ?? null;
          return this.mapUser(authUser, row);
        }),
      );

      return mapped;
    } catch (err: any) {
      throw new HttpException(err.message, 500);
    }
  }

  async findOne(id: string) {
    const adminClient = this.supabaseService.getAdminClient();

    try {
      const { data: row, error } = await adminClient
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new HttpException(error.message, 500);

      const { data: authRes, error: authError } =
        await adminClient.auth.admin.getUserById(id);

      if (authError) throw new HttpException(authError.message, 500);

      const authUser = authRes?.user ?? null;
      return this.mapUser(authUser, row);
    } catch (err: any) {
      throw new HttpException(err.message, 500);
    }
  }

  async update(actorId: string, id: string, body: UpdateUserDto) {
    const adminClient = this.supabaseService.getAdminClient();

    if (body.password || body.confirm_password) {
      if (!body.password || !body.confirm_password) {
        throw new HttpException(
          'Password dan konfirmasi password wajib diisi saat mengubah password',
          400,
        );
      }
      if (body.password !== body.confirm_password) {
        throw new HttpException(
          'Password dan konfirmasi password tidak sama',
          400,
        );
      }
    }

    try {
      const { data: existingRow, error: existingError } = await adminClient
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (existingError) throw new HttpException(existingError.message, 500);

      const { data: authRes, error: authError } =
        await adminClient.auth.admin.getUserById(id);

      if (authError) throw new HttpException(authError.message, 500);
      const authUser = authRes?.user;

      const updatePayload: any = {};
      if (body.email) updatePayload.email = body.email;
      if (body.password) updatePayload.password = body.password;

      const metadata: any = {};
      if (body.nama) metadata.full_name = body.nama;
      if (body.role) metadata.role = body.role;
      if (body.phone) metadata.phone = body.phone;

      if (Object.keys(metadata).length > 0) {
        updatePayload.user_metadata = {
          ...(authUser?.user_metadata || {}),
          ...metadata,
        };
      }

      if (Object.keys(updatePayload).length > 0) {
        const { error: updateAuthError } =
          await adminClient.auth.admin.updateUserById(id, updatePayload);
        if (updateAuthError)
          throw new HttpException(updateAuthError.message, 500);
      }

      const { data: updatedRow, error: updateRowError } = await adminClient
        .from('users')
        .update({
          full_name: body.nama ?? existingRow.full_name,
          phone: body.phone ?? existingRow.phone,
          role: body.role ?? existingRow.role,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (updateRowError) throw new HttpException(updateRowError.message, 500);

      const displayName =
        body.nama ||
        authUser?.user_metadata?.full_name ||
        authUser?.email ||
        id;

      await adminClient.from('log_aktifitas').insert({
        aktor_id: actorId,
        deskripsi: updateActivity('user', displayName),
      });

      const latestAuth =
        body.email || body.password || body.nama || body.role || body.phone
          ? (await adminClient.auth.admin.getUserById(id)).data?.user
          : authUser;

      return this.mapUser(latestAuth, updatedRow);
    } catch (err: any) {
      throw new HttpException(err.message, 500);
    }
  }

  async remove(actorId: string, id: string) {
    const adminClient = this.supabaseService.getAdminClient();

    try {
      const { data: authRes } = await adminClient.auth.admin.getUserById(id);
      const authUser = authRes?.user;
      const displayName =
        authUser?.user_metadata?.full_name || authUser?.email || id;

      const { error: deleteRowError } = await adminClient
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteRowError) throw new HttpException(deleteRowError.message, 500);

      const { error: deleteAuthError } =
        await adminClient.auth.admin.deleteUser(id);

      if (deleteAuthError)
        throw new HttpException(deleteAuthError.message, 500);

      await adminClient.from('log_aktifitas').insert({
        aktor_id: actorId,
        deskripsi: deleteActivity('user', displayName),
      });
    } catch (err: any) {
      throw new HttpException(err.message, 500);
    }
  }
}
