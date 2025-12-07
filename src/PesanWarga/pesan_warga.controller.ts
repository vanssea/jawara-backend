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
import { PesanAspirasiService } from './pesan_warga.service';
import { CreatePesanAspirasiDto } from './dto/create-pesan_warga.dto';
import { UpdatePesanAspirasiDto } from './dto/update-pesan_warga.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AuthUser } from 'src/common/types/types';
import { errorResponse, successResponse } from 'utils/response.utils';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Pesan Aspirasi')
@Controller('pesan-aspirasi')
export class PesanAspirasiController {
  constructor(private readonly pesanService: PesanAspirasiService) {}

  @ApiOperation({ summary: 'Create pesan aspirasi baru' })
  @Post()
  async create(
    @Auth() user: AuthUser,
    @Body() body: CreatePesanAspirasiDto,
  ) {
    try {
      const result = await this.pesanService.create(user.sub, body);
      const message = 'Pesan aspirasi created successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get semua pesan aspirasi' })
  @Get()
  async findAll() {
    try {
      const result = await this.pesanService.findAll();
      const message = 'Pesan aspirasi fetched successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get pesan aspirasi berdasarkan ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.pesanService.findOne(id);
      const message = `Pesan aspirasi ${id} fetched successfully`;

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update pesan aspirasi' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() body: UpdatePesanAspirasiDto,
  ) {
    try {
      const result = await this.pesanService.update(user.sub, id, body);
      const message = `Pesan aspirasi ${id} updated successfully`;

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete pesan aspirasi' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.pesanService.remove(user.sub, id);
      const message = `Pesan aspirasi ${id} deleted successfully`;

      return successResponse(null, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}