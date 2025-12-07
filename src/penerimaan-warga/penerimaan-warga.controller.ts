import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PenerimaanWargaService } from './penerimaan-warga.service';
import { CreatePenerimaanWargaDto } from './dto/create-penerimaan-warga.dto';
import { UpdatePenerimaanWargaDto } from './dto/update-penerimaan-warga.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from 'src/common/decorator/auth.decorator';
import { errorResponse, successResponse } from 'utils/response.utils';
import { AuthUser } from 'src/common/types/types';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Penerimaan Warga')
@Controller('penerimaan-warga')
export class PenerimaanWargaController {
  constructor(
    private readonly penerimaanWargaService: PenerimaanWargaService,
  ) {}

  @ApiOperation({ summary: 'Create new penerimaan warga' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama: { type: 'string', example: 'Budi Santoso' },
        tempat_lahir: { type: 'string', example: 'Jakarta' },
        tanggal_lahir: { type: 'string', example: '2000-01-15' },
        no_telp: { type: 'string', example: '081234567890' },
        jenis_kelamin: { type: 'string', example: 'laki-laki' },
        agama: { type: 'string', example: 'Islam' },
        golongan_darah: { type: 'string', example: 'O' },
        pendidikan_terakhir: { type: 'string', example: 'S1' },
        pekerjaan: { type: 'string', example: 'Karyawan Swasta' },
        peran: { type: 'string', example: 'Warga' },
        foto_identitas: {
          type: 'string',
          format: 'binary',
          description: 'File foto identitas (KTP/SIM)',
        },
      },
      required: ['nama'],
    },
  })
  @Post()
  @UseInterceptors(FileInterceptor('foto_identitas'))
  async create(
    @Auth() user: AuthUser,
    @Body() createDto: CreatePenerimaanWargaDto,
    @UploadedFile() fotoIdentitas?: Express.Multer.File,
  ) {
    try {
      const result = await this.penerimaanWargaService.create(
        createDto,
        fotoIdentitas,
      );
      const message = 'Penerimaan warga created successfully with status pending';
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all penerimaan warga (with status_penerimaan only)' })
  @Get()
  async findAll() {
    try {
      const result = await this.penerimaanWargaService.findAll();
      const message = 'Penerimaan warga fetched successfully';
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get penerimaan warga by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.penerimaanWargaService.findOne(id);
      const message = `Penerimaan warga ${id} fetched successfully`;
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update penerimaan warga by ID (change status_penerimaan to diterima will activate warga)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama: { type: 'string', example: 'Budi Santoso' },
        tempat_lahir: { type: 'string', example: 'Jakarta' },
        tanggal_lahir: { type: 'string', example: '2000-01-15' },
        no_telp: { type: 'string', example: '081234567890' },
        jenis_kelamin: { type: 'string', example: 'laki-laki' },
        agama: { type: 'string', example: 'Islam' },
        golongan_darah: { type: 'string', example: 'O' },
        pendidikan_terakhir: { type: 'string', example: 'S1' },
        pekerjaan: { type: 'string', example: 'Karyawan Swasta' },
        peran: { type: 'string', example: 'Warga' },
        status_penerimaan: { type: 'string', example: 'diterima' },
        foto_identitas: {
          type: 'string',
          format: 'binary',
          description: 'File foto identitas baru (optional)',
        },
      },
    },
  })
  @Patch(':id')
  @UseInterceptors(FileInterceptor('foto_identitas'))
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() updateDto: UpdatePenerimaanWargaDto,
    @UploadedFile() fotoIdentitas?: Express.Multer.File,
  ) {
    try {
      const result = await this.penerimaanWargaService.update(
        id,
        updateDto,
        fotoIdentitas,
      );
      const message = `Penerimaan warga ${id} updated successfully`;
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete penerimaan warga by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.penerimaanWargaService.remove(id);
      const message = `Penerimaan warga ${id} deleted successfully`;
      return successResponse(null, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
