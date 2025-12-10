import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RumahService } from './rumah.service';
import { CreateRumahDto } from './dto/create-rumah.dto';
import { UpdateRumahDto } from './dto/update-rumah.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AuthUser } from 'src/common/types/types';
import { successResponse, errorResponse } from 'utils/response.utils';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Rumah')
@Controller('rumah')
export class RumahController {
  constructor(private readonly rumahService: RumahService) {}

  @ApiOperation({ summary: 'Create new rumah' })
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Auth() user: AuthUser, @Body() body: CreateRumahDto) {
    try {
      const result = await this.rumahService.create(user.sub, body);
      return successResponse(result, 'Rumah created successfully');
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all rumah' })
  @Get()
  async findAll() {
    try {
      const result = await this.rumahService.findAll();
      return successResponse(result, 'Rumah fetched successfully');
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get rumah by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.rumahService.findOne(id);
      return successResponse(result, `Rumah ${id} fetched successfully`);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update rumah by ID' })
  @Patch(':id')
  async update(@Param('id') id: string, @Auth() user: AuthUser, @Body() body: UpdateRumahDto) {
    try {
      const result = await this.rumahService.update(user.sub, id, body);
      return successResponse(result, `Rumah ${id} updated successfully`);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete rumah by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      const result = await this.rumahService.remove(user.sub, id);
      return successResponse(result, `Rumah ${id} deleted successfully`);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
