import { PartialType } from '@nestjs/mapped-types';
import { CreateRumahDto } from './create-rumah.dto';

export class UpdateRumahDto extends PartialType(CreateRumahDto) {}
