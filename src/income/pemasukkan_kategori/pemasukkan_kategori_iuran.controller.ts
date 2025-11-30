import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PemasukanKategoriIuranService } from './pemasukkan_kategori_iuran.service';
import { CreatePemasukanKategoriIuranDto } from './dto/create-pemasukkan_kategori_iuran.dto';
import { UpdatePemasukanKategoriIuranDto } from './dto/update-pemasukkan_kategori_iuran.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AuthUser } from 'src/common/types/types';
import { errorResponse, successResponse } from 'utils/response.utils';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Pemasukan Kategori Iuran')
@Controller('pemasukan-kategori-iuran')
export class PemasukanKategoriIuranController {
  constructor(
    private readonly pemasukanKategoriIuranService: PemasukanKategoriIuranService,
  ) {}

  @ApiOperation({ summary: 'Create kategori iuran' })
  @Post()
  async create(
    @Auth() user: AuthUser,
    @Body() body: CreatePemasukanKategoriIuranDto,
  ) {
    try {
      const result = await this.pemasukanKategoriIuranService.create(
        user.sub,
        body,
      );
      return successResponse(result, 'Kategori iuran berhasil dibuat');
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all kategori iuran' })
  @Get()
  async findAll() {
    try {
      const result = await this.pemasukanKategoriIuranService.findAll();
      return successResponse(result, 'Kategori iuran berhasil diambil');
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get kategori iuran by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.pemasukanKategoriIuranService.findOne(id);
      return successResponse(
        result,
        `Kategori iuran ${id} berhasil diambil`,
      );
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update kategori iuran by ID' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() body: UpdatePemasukanKategoriIuranDto,
  ) {
    try {
      const result = await this.pemasukanKategoriIuranService.update(
        user.sub,
        id,
        body,
      );
      return successResponse(
        result,
        `Kategori iuran ${id} berhasil diperbarui`,
      );
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete kategori iuran by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.pemasukanKategoriIuranService.remove(user.sub, id);
      return successResponse(
        null,
        `Kategori iuran ${id} berhasil dihapus`,
      );
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}