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
import { PemasukkanTagihanService } from './pemasukkan_tagihan.service';
import { CreatePemasukkanTagihanDto } from './dto/create-pemasukkan_tagihan.dto';
import { UpdatePemasukkanTagihanDto } from './dto/update-pemasukkan_tagihan.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AuthUser } from 'src/common/types/types';
import { errorResponse, successResponse } from 'utils/response.utils';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Pemasukan Tagihan')
@Controller('pemasukan-tagihan')
export class PemasukkanTagihanController {
  constructor(
    private readonly pemasukanTagihanService: PemasukkanTagihanService,
  ) {}

  @ApiOperation({ summary: 'Create pemasukan tagihan' })
  @Post()
  async create(
    @Auth() user: AuthUser,
    @Body() body: CreatePemasukkanTagihanDto,
  ) {
    try {
      const result = await this.pemasukanTagihanService.create(user.sub, body);
      return successResponse(result, 'Pemasukan tagihan berhasil dibuat');
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all pemasukan tagihan' })
  @Get()
  async findAll() {
    try {
      const result = await this.pemasukanTagihanService.findAll();
      return successResponse(
        result,
        'Pemasukan tagihan berhasil diambil',
      );
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get pemasukan tagihan by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.pemasukanTagihanService.findOne(id);
      return successResponse(
        result,
        `Pemasukan tagihan ${id} berhasil diambil`,
      );
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update pemasukan tagihan by ID' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() body: UpdatePemasukkanTagihanDto,
  ) {
    try {
      const result = await this.pemasukanTagihanService.update(
        user.sub,
        id,
        body,
      );
      return successResponse(
        result,
        `Pemasukan tagihan ${id} berhasil diperbarui`,
      );
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete pemasukan tagihan by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.pemasukanTagihanService.remove(user.sub, id);
      return successResponse(
        null,
        `Pemasukan tagihan ${id} berhasil dihapus`,
      );
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
