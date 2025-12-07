import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { WargaService } from './warga.service';
import { CreateWargaDto } from './dto/create-warga.dto';
import { UpdateWargaDto } from './dto/update-warga.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth } from 'src/common/decorator/auth.decorator';
import { errorResponse, successResponse } from 'utils/response.utils';
import { AuthUser } from 'src/common/types/types';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Warga')
@Controller('warga')
export class WargaController {
  constructor(private readonly wargaService: WargaService) {}

  @ApiOperation({ summary: 'Create new warga' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama: { type: 'string' },
        tempat_lahir: { type: 'string' },
        tanggal_lahir: { type: 'string', example: '2000-01-15' },
        no_telp: { type: 'string' },
        jenis_kelamin: { type: 'string' },
        agama: { type: 'string' },
        golongan_darah: { type: 'string' },
        pendidikan_terakhir: { type: 'string' },
        pekerjaan: { type: 'string' },
        peran: { type: 'string' },
        status: { type: 'string' },
        keluarga_id: { type: 'string', format: 'uuid' },
        foto_identitas: { type: 'string', format: 'binary' },
      },
      required: ['nama'],
    },
  })
  @Post()
  @UseInterceptors(FileInterceptor('foto_identitas'))
  async create(
    @Auth() user: AuthUser,
    @Body() createWargaDto: CreateWargaDto,
    @UploadedFile() fotoFile?: Express.Multer.File,
  ) {
    try {
      const result = await this.wargaService.create(createWargaDto, fotoFile);
      const message = 'Warga created successfully';
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all warga' })
  @Get()
  async findAll() {
    try {
      const result = await this.wargaService.findAll();
      const message = 'Warga fetched successfully';
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get warga by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.wargaService.findOne(id);
      const message = `Warga ${id} fetched successfully`;
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update warga by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama: { type: 'string' },
        tempat_lahir: { type: 'string' },
        tanggal_lahir: { type: 'string', example: '2000-01-15' },
        no_telp: { type: 'string' },
        jenis_kelamin: { type: 'string' },
        agama: { type: 'string' },
        golongan_darah: { type: 'string' },
        pendidikan_terakhir: { type: 'string' },
        pekerjaan: { type: 'string' },
        peran: { type: 'string' },
        status: { type: 'string' },
        keluarga_id: { type: 'string', format: 'uuid' },
        foto_identitas: { type: 'string', format: 'binary' },
      },
    },
  })
  @Patch(':id')
  @UseInterceptors(FileInterceptor('foto_identitas'))
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() updateWargaDto: UpdateWargaDto,
    @UploadedFile() fotoFile?: Express.Multer.File,
  ) {
    try {
      const result = await this.wargaService.update(id, updateWargaDto, fotoFile);
      const message = `Warga ${id} updated successfully`;
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete warga by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.wargaService.remove(id);
      const message = `Warga ${id} deleted successfully`;
      return successResponse(null, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
