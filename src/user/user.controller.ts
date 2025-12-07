import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AuthUser } from 'src/common/types/types';
import { errorResponse, successResponse } from 'utils/response.utils';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create new user account' })
  @Post()
  async create(@Auth() user: AuthUser, @Body() body: CreateUserDto) {
    try {
      const result = await this.usersService.create(user.sub, body);
      return successResponse(result, 'User created successfully');
    } catch (error: any) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get all users' })
  @Get()
  async findAll() {
    try {
      const result = await this.usersService.findAll();
      return successResponse(result, 'Users fetched successfully');
    } catch (error: any) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const result = await this.usersService.findOne(id);
      return successResponse(result, `User ${id} fetched successfully`);
    } catch (error: any) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Update user by ID' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Auth() user: AuthUser,
    @Body() body: UpdateUserDto,
  ) {
    try {
      const result = await this.usersService.update(user.sub, id, body);
      return successResponse(result, `User ${id} updated successfully`);
    } catch (error: any) {
      return errorResponse(500, error.message);
    }
  }

  @ApiOperation({ summary: 'Delete user by ID' })
  @Delete(':id')
  async remove(@Param('id') id: string, @Auth() user: AuthUser) {
    try {
      await this.usersService.remove(user.sub, id);
      return successResponse(null, `User ${id} deleted successfully`);
    } catch (error: any) {
      return errorResponse(500, error.message);
    }
  }
}
