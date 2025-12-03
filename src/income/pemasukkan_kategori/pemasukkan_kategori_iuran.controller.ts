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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/common/decorator/auth.decorator';
import { errorResponse, successResponse } from 'utils/response.utils';
import { AuthUser } from 'src/common/types/types';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Pemasukan Kategori Iuran')
@Controller('pemasukan-kategori-iuran')
export class PemasukanKategoriIuranController {
  constructor(
    private readonly kategoriService: PemasukanKategoriIuranService,
  ) {}

  @ApiOperation({ summary: 'Create new kategori iuran' })
  @Post()
  async create(
    @Auth() user: AuthUser,
    @Body() body: CreatePemasukanKategoriIuranDto,
  ) {
    try {
      const result = await this.kategoriService.create(user.sub, body);
      const message = 'Kategori iuran created successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all kategori iuran' })
  @Get()
  async findAll() {
    try {
      const result = await this.kategoriService.findAll();
      const message = 'Kategori iuran fetched successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get kategori iuran by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.kategoriService.findOne(id);
      const message = `Kategori iuran ${id} fetched successfully`;

      return successResponse(result, message);
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
      const result = await this.kategoriService.update(user.sub, id, body);
      const message = `Kategori iuran ${id} updated successfully`;

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete kategori iuran by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.kategoriService.remove(user.sub, id);
      const message = `Kategori iuran ${id} deleted successfully`;

      return successResponse(null, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}