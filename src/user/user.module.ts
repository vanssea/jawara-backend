import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { WargaModule } from 'src/warga/warga.module';

@Module({
  imports: [CommonModule, WargaModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
