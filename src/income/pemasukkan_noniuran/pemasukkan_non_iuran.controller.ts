import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PemasukkanNonIuranService } from './pemasukkan_non_iuran.service';
import { CreatePemasukkanNonIuranDto } from './dto/create-pemasukkan_non_iuran.dto';
import { UpdatePemasukkanNonIuranDto } from './dto/update-pemasukkan_non_iuran.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AuthUser } from 'src/common/types/types';
import { errorResponse, successResponse } from 'utils/response.utils';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Pemasukan Non Iuran')
@Controller('pemasukan-non-iuran')
export class PemasukkanNonIuranController {
  constructor(
    private readonly pemasukkanNonIuranService: PemasukkanNonIuranService,
  ) {}

  // ========================= CREATE =========================

  @ApiOperation({ summary: 'Create pemasukan non iuran' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama: { type: 'string', example: 'Donasi Acara Kampung' },
        tanggal_pemasukan: { type: 'string', example: '2025-12-03T10:16:00+07:00' },
        kategori_pemasukan: { type: 'string', example: 'Donasi' },
        nominal: { type: 'number', example: 1500000 },
        link_bukti_pemasukan: { type: 'string', format: 'binary' },
      },
      required: ['nama', 'tanggal_pemasukan', 'kategori_pemasukan', 'nominal'],
    },
  })
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'bukti', maxCount: 1 }]),
  )
  async create(
    @Auth() user: AuthUser,
    @Body() body: CreatePemasukkanNonIuranDto,
    @UploadedFiles()
    files: { bukti?: Express.Multer.File[] },
  ) {
    try {
      const result = await this.pemasukkanNonIuranService.create(
        user.sub,
        body,
        files,
      );
      return successResponse(result, 'Pemasukan non iuran berhasil dibuat');
    } catch (e) {
      return errorResponse(500, e.message);
    }
  }

  // ========================= FIND ALL =========================

  @ApiOperation({ summary: 'Get all pemasukan non iuran' })
  @Get()
  async findAll() {
    try {
      const result = await this.pemasukkanNonIuranService.findAll();
      return successResponse(result, 'Data berhasil diambil');
    } catch (e) {
      return errorResponse(500, e.message);
    }
  }

  // ========================= FIND ONE =========================

  @ApiOperation({ summary: 'Get pemasukan non iuran by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.pemasukkanNonIuranService.findOne(id);
      return successResponse(result, `Data ${id} berhasil diambil`);
    } catch (e) {
      return errorResponse(500, e.message);
    }
  }

  // ========================= UPDATE =========================

  @ApiOperation({ summary: 'Update pemasukan non iuran by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama: { type: 'string', example: 'Donasi Acara Kampung Update' },
        tanggal_pemasukan: { type: 'string', example: '2025-12-03T12:00:00+07:00' },
        kategori_pemasukan: { type: 'string', example: 'Sponsor' },
        nominal: { type: 'number', example: 2000000 },
        link_bukti_pemasukan: { type: 'string', format: 'binary' },
      },
    },
  })
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'bukti', maxCount: 1 }]),
  )
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() body: UpdatePemasukkanNonIuranDto,
    @UploadedFiles()
    files: { bukti?: Express.Multer.File[] },
  ) {
    try {
      const result = await this.pemasukkanNonIuranService.update(
        user.sub,
        id,
        body,
        files,
      );

      return successResponse(result, `Pemasukan non iuran ${id} berhasil diupdate`);
    } catch (e) {
      return errorResponse(500, e.message);
    }
  }

  // ========================= DELETE =========================

  @ApiOperation({ summary: 'Delete pemasukan non iuran by ID' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Auth() user: AuthUser,
  ) {
    try {
      await this.pemasukkanNonIuranService.remove(user.sub, id);
      return successResponse(null, `Pemasukan non iuran ${id} berhasil dihapus`);
    } catch (e) {
      return errorResponse(500, e.message);
    }
  }
}