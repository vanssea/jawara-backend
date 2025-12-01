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
import { TransferChannelService } from './transfer-channel.service';
import { CreateTransferChannelDto } from './dto/create-transfer-channel.dto';
import { UpdateTransferChannelDto } from './dto/update-transfer-channel.dto';
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
@ApiTags('Transfer Channel')
@Controller('transfer-channel')
export class TransferChannelController {
  constructor(
    private readonly transferChannelService: TransferChannelService,
  ) {}

  @ApiOperation({ summary: 'Create new transfer channel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama_channel: { type: 'string', example: 'BRI Rekening Utama' },
        tipe_channel: { type: 'string', example: 'BANK_TRANSFER' },
        pemilik: {
          type: 'string',
          example: '32a3d6ce-0a92-4e9e-b64e-88e7e2c1afaa',
        },
        catatan: {
          type: 'string',
          example: 'Digunakan untuk pembayaran utama',
        },
        thumbnail: { type: 'string', format: 'binary' },
        qr: { type: 'string', format: 'binary' },
      },
      required: ['nama_channel', 'tipe_channel', 'pemilik'],
    },
  })
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'qr', maxCount: 1 },
    ]),
  )
  async create(
    @Auth() user: AuthUser,
    @Body() body: CreateTransferChannelDto,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      qr?: Express.Multer.File[];
    },
  ) {
    try {
      const result = await this.transferChannelService.create(
        user.sub,
        body,
        files,
      );
      const message = 'Transfer channel created successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all transfer channels' })
  @Get()
  async findAll() {
    try {
      const result = await this.transferChannelService.findAll();
      const message = 'Transfer channels fetched successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get transfer channel by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.transferChannelService.findOne(id);
      const message = `Transfer channel ${id} fetched successfully`;

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update transfer channel by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nama_channel: { type: 'string', example: 'BRI Rekening Utama' },
        tipe_channel: { type: 'string', example: 'BANK_TRANSFER' },
        pemilik: {
          type: 'string',
          example: '32a3d6ce-0a92-4e9e-b64e-88e7e2c1afaa',
        },
        catatan: {
          type: 'string',
          example: 'Digunakan untuk pembayaran utama',
        },
        thumbnail: { type: 'string', format: 'binary' },
        qr: { type: 'string', format: 'binary' },
      },
    },
  })
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'qr', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() body: UpdateTransferChannelDto,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      qr?: Express.Multer.File[];
    },
  ) {
    try {
      const result = await this.transferChannelService.update(
        user.sub,
        id,
        body,
        files,
      );
      const message = `Transfer channel ${id} updated successfully`;

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete transfer channel by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.transferChannelService.remove(user.sub, id);
      const message = `Transfer channel ${id} deleted successfully`;

      return successResponse(null, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
