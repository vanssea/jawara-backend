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
import { ExpensesService } from './expenses.service';
import { CreateExpensesDto } from './dto/create-expenses.dto';
import { UpdateExpensesDto } from './dto/update-expenses.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AuthUser } from 'src/common/types/types';
import { errorResponse, successResponse } from 'utils/response.utils';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @ApiOperation({ summary: 'Create new expense' })
  @Post()
  async create(@Auth() user: AuthUser, @Body() body: CreateExpensesDto) {
    try {
      const result = await this.expensesService.create(user.sub, body);
      return successResponse(result, 'Expense created successfully');
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all expenses' })
  @Get()
  async findAll() {
    try {
      const result = await this.expensesService.findAll();
      return successResponse(result, 'Expenses fetched successfully');
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get expense by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.expensesService.findOne(id);
      return successResponse(result, `Expense ${id} fetched successfully`);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update expense by ID' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() body: UpdateExpensesDto,
  ) {
    try {
      const result = await this.expensesService.update(user.sub, id, body);
      return successResponse(result, `Expense ${id} updated successfully`);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete expense by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.expensesService.remove(user.sub, id);
      return successResponse(null, `Expense ${id} deleted successfully`);
    } catch (error) {
      return errorResponse(500, error.message);
    }
  }
}
