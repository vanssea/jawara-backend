import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { MutasiService } from './mutasi.service';
import { CreateMutasiDto } from './dto/create-mutasi.dto';
import { UpdateMutasiDto } from './dto/update-mutasi.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@UseGuards(AuthGuard)
@Controller('mutasi')
export class MutasiController {
  constructor(private readonly mutasiService: MutasiService) {}

  @Post()
  create(@Body() createMutasiDto: CreateMutasiDto) {
    return this.mutasiService.create(createMutasiDto);
  }

  @Get()
  findAll() {
    return this.mutasiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mutasiService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMutasiDto: UpdateMutasiDto,
  ) {
    return this.mutasiService.update(id, updateMutasiDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.mutasiService.remove(id);
  }
}
