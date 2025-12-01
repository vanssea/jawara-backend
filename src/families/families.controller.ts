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
import { FamiliesService } from './families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AuthUser } from 'src/common/types/types';
import { successResponse, errorResponse } from 'utils/response.utils';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Families')
@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @ApiOperation({ summary: 'Create new family' })
  @Post()
  async create(@Auth() user: AuthUser, @Body() body: CreateFamilyDto) {
    try {
      const result = await this.familiesService.create(user.sub, body);
      const message = 'Family created successfully';
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all families' })
  @Get()
  async findAll() {
    try {
      const result = await this.familiesService.findAll();
      const message = 'Families fetched successfully';
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get family by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.familiesService.findOne(id);
      const message = `Family ${id} fetched successfully`;
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update family by ID' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() body: UpdateFamilyDto,
  ) {
    try {
      const result = await this.familiesService.update(user.sub, id, body);
      const message = `Family ${id} updated successfully`;
      return successResponse(result, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete family by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.familiesService.remove(user.sub, id);
      const message = `Family ${id} deleted successfully`;
      return successResponse(null, message);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
