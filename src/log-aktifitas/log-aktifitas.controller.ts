import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { LogAktifitasService } from './log-aktifitas.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { errorResponse, successResponse } from 'utils/response.utils';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Log Aktifitas')
@Controller('log-aktifitas')
export class LogAktifitasController {
  constructor(private readonly logAktifitasService: LogAktifitasService) {}

  @ApiOperation({ summary: 'Get all log aktifitass' })
  @Get()
  async findAll() {
    try {
      const result = await this.logAktifitasService.findAll();
      const message = 'Log Aktifitas fetched successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get log aktifitas by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.logAktifitasService.findOne(id);
      const message = `Log Aktifitas ${id} fetched successfully`;

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
