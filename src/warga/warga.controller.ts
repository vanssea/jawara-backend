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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @Post()
  async create(@Auth() user: AuthUser, @Body() createWargaDto: CreateWargaDto) {
    try {
      const result = await this.wargaService.create(createWargaDto);
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
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() updateWargaDto: UpdateWargaDto,
  ) {
    try {
      const result = await this.wargaService.update(id, updateWargaDto);
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
