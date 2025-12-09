import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { MutasiJenisService } from './mutasi-jenis.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { errorResponse, successResponse } from 'utils/response.utils';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Mutasi Jenis')
@Controller('mutasi/jenis')
export class MutasiJenisController {
  constructor(private readonly svc: MutasiJenisService) {}

  @ApiOperation({ summary: 'Get all mutasi jenis (paginated-ish)' })
  @Get()
  async findAll() {
    try {
      const result = await this.svc.findAll();
      const message = 'Mutasi jenis fetched successfully';
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all mutasi jenis (all)' })
  @Get('all')
  async findAllRaw() {
    try {
      const result = await this.svc.findAllRaw();
      const message = 'Mutasi jenis (all) fetched successfully';
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get mutasi jenis by id' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.svc.findOne(id);
      const message = `Mutasi jenis ${id} fetched successfully`;
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
