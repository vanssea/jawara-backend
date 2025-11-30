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
import { PemasukkanNonIuranService } from './pemasukkan_non_iuran.service';
import { CreatePemasukkanNonIuranDto } from './dto/create-pemasukkan_non_iuran.dto';
import { UpdatePemasukkanNonIuranDto } from './dto/update-pemasukkan_non_iuran.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AuthUser } from 'src/common/types/types';
import { errorResponse, successResponse } from 'utils/response.utils';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Pemasukan Non Iuran')
@Controller('pemasukan-non-iuran')
export class PemasukanNonIuranController {
  constructor(
    private readonly pemasukkanNonIuranService: PemasukkanNonIuranService,
  ) {}

  @ApiOperation({ summary: 'Create pemasukan non iuran' })
  @Post()
  async create(
    @Auth() user: AuthUser,
    @Body() body: CreatePemasukkanNonIuranDto,
  ) {
    try {
      const result = await this.pemasukkanNonIuranService.create(
        user.sub,
        body,
      );
      return successResponse(result, 'Pemasukan non iuran berhasil dibuat');
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all pemasukan non iuran' })
  @Get()
  async findAll() {
    try {
      const result = await this.pemasukkanNonIuranService.findAll();
      return successResponse(result, 'Pemasukan non iuran berhasil diambil');
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get pemasukan non iuran by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.pemasukkanNonIuranService.findOne(id);
      return successResponse(
        result,
        `Pemasukan non iuran ${id} berhasil diambil`,
      );
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update pemasukan non iuran by ID' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() body: UpdatePemasukkanNonIuranDto,
  ) {
    try {
      const result = await this.pemasukkanNonIuranService.update(
        user.sub,
        id,
        body,
      );
      return successResponse(
        result,
        `Pemasukan non iuran ${id} berhasil diperbarui`,
      );
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete pemasukan non iuran by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.pemasukkanNonIuranService.remove(user.sub, id);
      return successResponse(
        null,
        `Pemasukan non iuran ${id} berhasil dihapus`,
      );
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
