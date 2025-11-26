import { PartialType } from '@nestjs/swagger';
import { CreateExpensesDto } from './create-expenses.dto';

export class UpdateExpensesDto extends PartialType(CreateExpensesDto) {}
