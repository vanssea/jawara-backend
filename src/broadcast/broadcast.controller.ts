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
import { BroadcastService } from './broadcast.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { UpdateBroadcastDto } from './dto/update-broadcast.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorator/auth.decorator';
import { errorResponse, successResponse } from 'utils/response.utils';
import { AuthUser } from 'src/common/types/types';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Broadcast')
@Controller('broadcast')
export class BroadcastController {
  constructor(private readonly broadcastService: BroadcastService) {}

  @ApiOperation({ summary: 'Create new broadcast' })
  @Post()
  async create(@Auth() user: AuthUser, @Body() body: CreateBroadcastDto) {
    try {
      const result = await this.broadcastService.create(user.sub, body);
      const message = 'Broadcast created successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all broadcasts' })
  @Get()
  async findAll() {
    try {
      const result = await this.broadcastService.findAll();
      const message = 'Broadcasts fetched successfully';

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get broadcast by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.broadcastService.findOne(id);
      const message = `Broadcast ${id} fetched successfully`;

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update broadcast by ID' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() body: UpdateBroadcastDto,
  ) {
    try {
      const result = await this.broadcastService.update(user.sub, id, body);
      const message = `Broadcasts ${id} updated successfully`;

      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete broadcast by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.broadcastService.remove(user.sub, id);
      const message = `Broadcasts ${id} deleted successfully`;

      return successResponse(null, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
