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
import { MutasiService } from './mutasi.service';
import { CreateMutasiDto } from './dto/create-mutasi.dto';
import { UpdateMutasiDto } from './dto/update-mutasi.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/common/types/types';
import { Auth } from 'src/common/decorator/auth.decorator';
import { errorResponse, successResponse } from 'utils/response.utils';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Mutasi')
@Controller('mutasi')
export class MutasiController {
  constructor(private readonly mutasiService: MutasiService) {}

  @ApiOperation({ summary: 'Create new mutasi' })
  @Post()
  async create(@Auth() user: AuthUser, @Body() body: CreateMutasiDto) {
    try {
      const result = await this.mutasiService.create(user.sub, body);
      const message = 'Mutasi created successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(
        error.status || 500,
        error.response?.message || error.message,
      );
    }
  }

  @ApiOperation({ summary: 'Get all mutasi' })
  @Get()
  async findAll() {
    try {
      const result = await this.mutasiService.findAll();
      const message = 'Mutasis fetched successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get mutasi by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.mutasiService.findOne(id);
      const message = `Mutasi ${id} fetched successfully`;

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update mutasi by ID' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() body: UpdateMutasiDto,
  ) {
    try {
      const result = await this.mutasiService.update(user.sub, id, body);
      const message = `Mutasi ${id} updated successfully`;

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete mutasi by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.mutasiService.remove(user.sub, id);
      const message = `Mutasi ${id} deleted successfully`;

      return successResponse(null, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
