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
    private readonly tagihanService: PemasukkanTagihanService,
  ) {}

  @ApiOperation({ summary: 'Create new pemasukan tagihan' })
  @Post()
  async create(
    @Auth() user: AuthUser,
    @Body() body: CreatePemasukkanTagihanDto,
  ) {
    try {
      const result = await this.tagihanService.create(user.sub, body);
      const message = 'Pemasukan tagihan created successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all pemasukan tagihan' })
  @Get()
  async findAll() {
    try {
      const result = await this.tagihanService.findAll();
      const message = 'Pemasukan tagihan fetched successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get pemasukan tagihan by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.tagihanService.findOne(id);
      const message = `Pemasukan tagihan ${id} fetched successfully`;

      return successResponse(result, message);
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
      const result = await this.tagihanService.update(user.sub, id, body);
      const message = `Pemasukan tagihan ${id} updated successfully`;

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete pemasukan tagihan by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.tagihanService.remove(user.sub, id);
      const message = `Pemasukan tagihan ${id} deleted successfully`;

      return successResponse(null, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}