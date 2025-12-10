import {
    Controller,
    Get,
    UseGuards,
    Param,
    Res,
    HttpException,
    Post,
    Body,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { errorResponse, successResponse } from 'utils/response.utils';
import { FilterDateDto } from './dto/filter-date.dto';
import { FilterPdfDto } from './dto/filter-pdf.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    // ----------------------------------------------------------------------
    // GET DATA LIST
    // ----------------------------------------------------------------------

    @ApiOperation({ summary: 'Get all expenses' })
    @Get('expenses')
    async findAllExpenses() {
        try {
            const result = await this.reportsService.findAllExpense();
            return successResponse(result, 'Expenses fetched successfully');
        } catch (error) {
            return errorResponse(500, error.message);
        }
    }

    @ApiOperation({ summary: 'Get expense by ID' })
    @Get('expenses/:id')
    async findOneExpense(@Param('id') id: string) {
        try {
            const result = await this.reportsService.findOneExpense(id);
            return successResponse(result, `Expense ${id} fetched successfully`);
        } catch (error) {
            return errorResponse(500, error.message);
        }
    }

    @ApiOperation({ summary: 'Get all incomes' })
    @Get('incomes')
    async findAllIncomes() {
        try {
            const result = await this.reportsService.findAllIncome();
            return successResponse(result, 'Incomes fetched successfully');
        } catch (error) {
            return errorResponse(500, error.message);
        }
    }

    @ApiOperation({ summary: 'Get income by ID' })
    @Get('incomes/:id')
    async findOneIncome(@Param('id') id: string) {
        try {
            const result = await this.reportsService.findOneIncome(id);
            return successResponse(result, `Income ${id} fetched successfully`);
        } catch (error) {
            return errorResponse(500, error.message);
        }
    }

    // ----------------------------------------------------------------------
    // POST PDF EXPORT
    // ----------------------------------------------------------------------
    @ApiOperation({ summary: 'Generate PDF report (incoming/outgoing/all)' })
    @Post('pdf')
    async downloadPdf(@Body() body: FilterPdfDto, @Res() res: Response) {
        try {
            const pdfBuffer = await this.reportsService.generatePdfReport(
                body.reportType,
                body.startDate,
                body.endDate,
            );

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="report-${body.reportType}-${body.startDate}-${body.endDate}.pdf"`,
            );

            return res.send(pdfBuffer);
        } catch (error) {
            throw new HttpException(error.message || 'Failed to generate PDF', 500);
        }
    }
}
