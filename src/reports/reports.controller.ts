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
import { ReportsService } from './reports.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AuthUser } from 'src/common/types/types';
import { errorResponse, successResponse } from 'utils/response.utils';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Expenses')
@Controller('expenses')
export class ReportsController {
  constructor(private readonly ReportsService: ReportsService) {}

  @ApiOperation({ summary: 'Get all expenses' })
  @Get()
  async findAll() {
    try {
      const result = await this.ReportsService.findAll();
      return successResponse(result, 'Expenses fetched successfully');
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get expense by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.ReportsService.findOne(id);
      return successResponse(result, `Expense ${id} fetched successfully`);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
