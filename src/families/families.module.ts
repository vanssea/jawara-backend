import { Module } from '@nestjs/common';
import { FamiliesService } from './families.service';
import { FamiliesController } from './families.controller';
import { SupabaseService } from 'src/common/service/supabase.service';

@Module({
  controllers: [FamiliesController],
  providers: [FamiliesService, SupabaseService],
})
export class FamiliesModule {}
