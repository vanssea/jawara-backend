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
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KegiatanService } from './kegiatan.service';
import { CreateKegiatanDto } from './dto/create-kegiatan.dto';
import { UpdateKegiatanDto } from './dto/update-kegiatan.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorator/auth.decorator';
import { errorResponse, successResponse } from 'utils/response.utils';
import { AuthUser } from 'src/common/types/types';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Kegiatan')
@Controller('kegiatan')
export class KegiatanController {
  constructor(private readonly kegiatanService: KegiatanService) {}

  @ApiOperation({ summary: 'Create new kegiatan' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama: { type: 'string', example: 'Kegiatan Bakti Sosial' },
        kategori_id: { type: 'number', example: 1 },
        deskripsi: { type: 'string', example: 'Deskripsi kegiatan' },
        tanggal: { type: 'string', example: '2025-11-23T10:00:00+07:00' },
        lokasi: { type: 'string', example: 'Balai RW 01' },
        penanggung_jawab: { type: 'string', example: '5795b3b9-d8c0-4de5-9c6e-f7253456c79e' },
        link_dokumentasi: { type: 'string', format: 'binary', description: 'File dokumentasi (gambar/dokumen) yang akan disimpan sebagai URL di link_dokumentasi' },
      },
      required: ['nama', 'kategori_id', 'tanggal', 'lokasi', 'penanggung_jawab'],
    },
  })
  @Post()
  @UseInterceptors(FileInterceptor('link_dokumentasi'))
  async create(
    @Auth() user: AuthUser,
    @Body() body: CreateKegiatanDto,
    @UploadedFile() dokumentasiFile?: Express.Multer.File,
  ) {
    try {
      const result = await this.kegiatanService.create(user.sub, body, dokumentasiFile);
      const message = 'Kegiatan created successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all kegiatan' })
  @Get()
  async findAll() {
    try {
      const result = await this.kegiatanService.findAll();
      const message = 'Kegiatan fetched successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get kegiatan by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.kegiatanService.findOne(id);
      const message = `Kegiatan ${id} fetched successfully`;

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update kegiatan by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama: { type: 'string', example: 'Kegiatan Bakti Sosial' },
        kategori_id: { type: 'number', example: 1 },
        deskripsi: { type: 'string', example: 'Deskripsi kegiatan' },
        tanggal: { type: 'string', example: '2025-11-23T10:00:00+07:00' },
        lokasi: { type: 'string', example: 'Balai RW 01' },
        penanggung_jawab: { type: 'string', example: '5795b3b9-d8c0-4de5-9c6e-f7253456c79e' },
        link_dokumentasi: { type: 'string', format: 'binary', description: 'File dokumentasi baru untuk menggantikan URL di link_dokumentasi' },
      },
    },
  })
  @Patch(':id')
  @UseInterceptors(FileInterceptor('link_dokumentasi'))
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() body: UpdateKegiatanDto,
    @UploadedFile() dokumentasiFile?: Express.Multer.File,
  ) {
    try {
      const result = await this.kegiatanService.update(user.sub, id, body, dokumentasiFile);
      const message = `Kegiatan ${id} updated successfully`;

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete kegiatan by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.kegiatanService.remove(user.sub, id);
      const message = `Kegiatan ${id} deleted successfully`;

      return successResponse(null, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
