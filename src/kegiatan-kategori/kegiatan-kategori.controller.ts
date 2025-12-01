import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { errorResponse, successResponse } from 'utils/response.utils';
import { KegiatanKategoriService } from './kegiatan-kategori.service';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Kegiatan Kategori')
@Controller('kegiatan-kategori')
export class KegiatanKategoriController {
  constructor(private readonly service: KegiatanKategoriService) {}

  @ApiOperation({ summary: 'Get all kegiatan kategori' })
  @Get()
  async findAll() {
    try {
      const result = await this.service.findAll();
      const message = 'Kegiatan kategori fetched successfully';
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
