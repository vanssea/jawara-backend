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
    // CSV WITHOUT FILTER
    // ----------------------------------------------------------------------

    @Get('csv/incoming')
    @ApiOperation({ summary: 'Generate CSV for incoming transactions' })
    async getIncomingCsvReport(@Res() res: Response) {
        try {
            const csvString = await this.reportsService.generateIncomingCsvReport();
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="laporan_pemasukan.csv"');
            res.status(200).send(csvString);
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    @Get('csv/outgoing')
    @ApiOperation({ summary: 'Generate CSV for outgoing transactions' })
    async getOutgoingCsvReport(@Res() res: Response) {
        try {
            const csvString = await this.reportsService.generateOutgoingCsvReport();
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="laporan_pengeluaran.csv"');
            res.status(200).send(csvString);
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    @Get('csv/all')
    @ApiOperation({ summary: 'Generate CSV for all transactions' })
    async getAllCsvReport(@Res() res: Response) {
        try {
            const csvString = await this.reportsService.generateAllTransactionsCsvReport();
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="laporan_gabungan.csv"');
            res.status(200).send(csvString);
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    // ----------------------------------------------------------------------
    // CSV WITH DATE FILTER
    // ----------------------------------------------------------------------

    @Post('csv/outgoing/filtered')
    @ApiOperation({ summary: 'CSV outgoing filtered by date' })
    async getOutgoingCsvFiltered(@Body() body: FilterDateDto, @Res() res: Response) {
        try {
            const csvString = await this.reportsService.generateOutgoingCsvReportFiltered(
                body.startDate,
                body.endDate
            );
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="laporan_pengeluaran_filtered.csv"');
            res.status(200).send(csvString);
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    @Post('csv/incoming/filtered')
    @ApiOperation({ summary: 'CSV incoming filtered by date' })
    async getIncomingCsvFiltered(@Body() body: FilterDateDto, @Res() res: Response) {
        try {
            const csvString = await this.reportsService.generateIncomingCsvReportFiltered(
                body.startDate,
                body.endDate
            );
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="laporan_pemasukan_filtered.csv"');
            res.status(200).send(csvString);
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    @Post('csv/all/filtered')
    @ApiOperation({ summary: 'CSV all transactions filtered by date' })
    async getAllCsvFiltered(@Body() body: FilterDateDto, @Res() res: Response) {
        try {
            const csvString = await this.reportsService.generateAllTransactionsCsvReportFiltered(
                body.startDate,
                body.endDate
            );
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="laporan_gabungan_filtered.csv"');
            res.status(200).send(csvString);
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    // ----------------------------------------------------------------------
    // PDF (FILTERED)
    // ----------------------------------------------------------------------

    @Post('pdf/outgoing')
    @ApiOperation({ summary: 'PDF outgoing filtered by date' })
    async getOutgoingPdf(@Body() body: FilterDateDto, @Res() res: Response) {
        try {
            const pdf = await this.reportsService.generatePdfReport(
                'outgoing',
                body.startDate,
                body.endDate
            );
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="laporan_pengeluaran_filtered.pdf"');
            res.status(200).send(pdf);
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    @Post('pdf/incoming')
    @ApiOperation({ summary: 'PDF incoming filtered by date' })
    async getIncomingPdf(@Body() body: FilterDateDto, @Res() res: Response) {
        try {
            const pdf = await this.reportsService.generatePdfReport(
                'incoming',
                body.startDate,
                body.endDate
            );
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="laporan_pemasukan_filtered.pdf"');
            res.status(200).send(pdf);
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }

    @Post('pdf/all')
    @ApiOperation({ summary: 'PDF all transactions filtered by date' })
    async getAllPdf(@Body() body: FilterDateDto, @Res() res: Response) {
        try {
            const pdf = await this.reportsService.generatePdfReport(
                'all',
                body.startDate,
                body.endDate
            );
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="laporan_gabungan_filtered.pdf"');
            res.status(200).send(pdf);
        } catch (error) {
            throw new HttpException(error.message, 500);
        }
    }
}
