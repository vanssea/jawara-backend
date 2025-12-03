import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { stringify } from 'csv-stringify/sync';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
    constructor(private readonly supabaseService: SupabaseService) {}

    // ----------------------------------------------------------------------
    // --- PRIVATE HELPERS UNTUK MENGAMBIL DATA DARI DB (DENGAN FILTER TANGGAL) ---
    // ----------------------------------------------------------------------

    /**
     * Mengambil data dari satu tabel Supabase, dengan filter tanggal opsional.
     * @param startDate Format YYYY-MM-DD
     * @param endDate Format YYYY-MM-DD
     */
    private async fetchSingleTableDataFiltered(
        tableName: string, 
        startDate?: string, 
        endDate?: string,   
    ) {
        let query = this.supabaseService.getClient().from(tableName).select('*');

        if (startDate) {
            // Filter: tanggal_transaksi >= startDate
            query = query.gte('tanggal_transaksi', startDate); 
        }
        
        if (endDate) {
            // Filter: tanggal_transaksi <= endDate (Ditambahkan ' 23:59:59' untuk mencakup seluruh hari)
            query = query.lte('tanggal_transaksi', endDate + ' 23:59:59'); 
        }

        const { data, error } = await query;

        if (error) {
            throw new HttpException(`Failed to fetch data from ${tableName}: ${error.message}`, 500);
        }
        return data;
    }

    /**
     * Mengambil data dengan filter tanggal dan menambahkan label tipe transaksi.
     */
    private async fetchTableDataWithLabelFiltered(
        tableName: string, 
        startDate?: string, 
        endDate?: string
    ) {
        const data = await this.fetchSingleTableDataFiltered(tableName, startDate, endDate);
        
        // Tambahkan label 'tipe' transaksi
        return data.map(item => ({
            ...item,
            tipe_transaksi: tableName.replace(/_/g, ' '),
        }));
    }

    // ----------------------------------------------------------------------
    // --- FUNGSI DASAR FETCH DATA (Untuk Endpoint CRUD Biasa) ---
    // ----------------------------------------------------------------------

    // Semua fungsi dasar fetch (findAll/findOne) TIDAK MENGGUNAKAN FILTER TANGGAL
    // findAllExpense dan findAllIncome akan dipanggil tanpa parameter tanggal
    async findAllExpense() {
        return this.fetchSingleTableDataFiltered('pengeluaran');
    }
    
    // findOne tetap menggunakan ID
    async findOneExpense(id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('pengeluaran')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw new HttpException(error.message, 500);
        return data;
    }

    async findAllIncome() {
        return this.fetchSingleTableDataFiltered('pemasukan_tagihan'); 
    }

    // findOne tetap menggunakan ID
    async findOneIncome(id: string) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('pemasukan_tagihan')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw new HttpException(error.message, 500);
        return data;
    }

    // ----------------------------------------------------------------------
    // --- FUNGSI UTAMA UNTUK LAPORAN (Penggabungan Data) ---
    // ----------------------------------------------------------------------

    /** Mengambil data pemasukan gabungan (non-iuran & tagihan) dengan filter tanggal opsional. */
    async fetchIncomingTransactions(startDate?: string, endDate?: string) {
        const [pemasukanNonIuran, pemasukanTagihan] = await Promise.all([
            this.fetchTableDataWithLabelFiltered('pemasukan_non_iuran', startDate, endDate),
            this.fetchTableDataWithLabelFiltered('pemasukan_tagihan', startDate, endDate),
        ]);

        return [...pemasukanNonIuran, ...pemasukanTagihan];
    }

    /** Mengambil semua data transaksi (pemasukan & pengeluaran) dengan filter tanggal opsional. */
    private async fetchAllTransactions(startDate?: string, endDate?: string) {
        const [outgoing, incoming] = await Promise.all([
            // Pengeluaran (harus ditambahkan label secara manual)
            this.fetchSingleTableDataFiltered('pengeluaran', startDate, endDate).then(data => data.map(item => ({
                ...item,
                tipe_transaksi: 'pengeluaran',
            }))),
            // Pemasukan 
            this.fetchIncomingTransactions(startDate, endDate),
        ]);

        return [...outgoing, ...incoming];
    }


    // ----------------------------------------------------------------------
    // FUNGSI GENERATE LAPORAN CSV (TANPA FILTER TANGGAL)
    // ----------------------------------------------------------------------

    async generateOutgoingCsvReport(): Promise<string> {
        const outgoingTransactions = await this.findAllExpense(); 
        if (outgoingTransactions.length === 0) return 'No outgoing transaction data available.';
        
        const columns = [ { key: 'id', header: 'ID Transaksi' }, { key: 'nama', header: 'Nama Pengeluaran' }, { key: 'nominal', header: 'Nominal' }, { key: 'tanggal_transaksi', header: 'Tanggal Transaksi' }, { key: 'kategori_id', header: 'ID Kategori' }, { key: 'tanggal_terverifikasi', header: 'Tanggal Verifikasi' }, { key: 'verifikator', header: 'ID Verifikator' }, { key: 'created_at', header: 'Waktu Dibuat' },];
        
        return stringify(outgoingTransactions, { header: true, columns: columns.map(col => col.key), cast: { number: (value) => String(value) } });
    }

    async generateIncomingCsvReport(): Promise<string> {
        const incomingTransactions = await this.fetchIncomingTransactions();
        if (incomingTransactions.length === 0) return 'No incoming transaction data available.';
        
        const columns = [ { key: 'tipe_transaksi', header: 'Tipe Pemasukan' }, { key: 'id', header: 'ID' }, { key: 'nama', header: 'Deskripsi Pemasukan' }, { key: 'nominal', header: 'Nominal' }, { key: 'tanggal_transaksi', header: 'Tanggal Transaksi' }, { key: 'created_at', header: 'Waktu Dibuat (Tagihan)' },];

        return stringify(incomingTransactions, { header: true, columns: columns.map(col => col.key), cast: { number: (value) => String(value) } });
    }

    async generateAllTransactionsCsvReport(): Promise<string> {
        const allTransactions = await this.fetchAllTransactions();
        if (allTransactions.length === 0) return 'No transaction data available.';

        const columns = [ { key: 'tipe_transaksi', header: 'Tipe Transaksi' }, { key: 'id', header: 'ID Transaksi' }, { key: 'nama', header: 'Nama/Deskripsi' }, { key: 'nominal', header: 'Nominal' }, { key: 'tanggal_transaksi', header: 'Tanggal Transaksi' }, { key: 'created_at', header: 'Waktu Dibuat' }, { key: 'kategori_id', header: 'ID Kategori (Keluar)' }, { key: 'verifikator', header: 'ID Verifikator (Keluar)' },];

        return stringify(allTransactions, { header: true, columns: columns.map(col => col.key), cast: { number: (value) => String(value) } });
    }


    // ----------------------------------------------------------------------
    // FUNGSI GENERATE LAPORAN CSV (DENGAN FILTER TANGGAL)
    // ----------------------------------------------------------------------

    /** NEW: Menggunakan startDate dan endDate untuk memfilter laporan pengeluaran. */
    async generateOutgoingCsvReportFiltered(startDate: string, endDate: string): Promise<string> {
        const outgoingTransactions = await this.fetchSingleTableDataFiltered('pengeluaran', startDate, endDate);
        if (outgoingTransactions.length === 0) return 'No outgoing transaction data available for the selected dates.';
        
        const columns = [ { key: 'id', header: 'ID Transaksi' }, { key: 'nama', header: 'Nama Pengeluaran' }, { key: 'nominal', header: 'Nominal' }, { key: 'tanggal_transaksi', header: 'Tanggal Transaksi' }, { key: 'kategori_id', header: 'ID Kategori' }, { key: 'tanggal_terverifikasi', header: 'Tanggal Verifikasi' }, { key: 'verifikator', header: 'ID Verifikator' }, { key: 'created_at', header: 'Waktu Dibuat' },];
        return stringify(outgoingTransactions, { header: true, columns: columns.map(col => col.key), cast: { number: (value) => String(value) } });
    }

    /** NEW: Menggunakan startDate dan endDate untuk memfilter laporan pemasukan. */
    async generateIncomingCsvReportFiltered(startDate: string, endDate: string): Promise<string> {
        const incomingTransactions = await this.fetchIncomingTransactions(startDate, endDate);
        if (incomingTransactions.length === 0) return 'No incoming transaction data available for the selected dates.';
        
        const columns = [ { key: 'tipe_transaksi', header: 'Tipe Pemasukan' }, { key: 'id', header: 'ID' }, { key: 'nama', header: 'Deskripsi Pemasukan' }, { key: 'nominal', header: 'Nominal' }, { key: 'tanggal_transaksi', header: 'Tanggal Transaksi' }, { key: 'created_at', header: 'Waktu Dibuat (Tagihan)' },];
        return stringify(incomingTransactions, { header: true, columns: columns.map(col => col.key), cast: { number: (value) => String(value) } });
    }

    /** NEW: Menggunakan startDate dan endDate untuk memfilter laporan gabungan. */
    async generateAllTransactionsCsvReportFiltered(startDate: string, endDate: string): Promise<string> {
        const allTransactions = await this.fetchAllTransactions(startDate, endDate);
        if (allTransactions.length === 0) return 'No transaction data available for the selected dates.';
        
        const columns = [ { key: 'tipe_transaksi', header: 'Tipe Transaksi' }, { key: 'id', header: 'ID Transaksi' }, { key: 'nama', header: 'Nama/Deskripsi' }, { key: 'nominal', header: 'Nominal' }, { key: 'tanggal_transaksi', header: 'Tanggal Transaksi' }, { key: 'created_at', header: 'Waktu Dibuat' }, { key: 'kategori_id', header: 'ID Kategori (Keluar)' }, { key: 'verifikator', header: 'ID Verifikator (Keluar)' },];
        return stringify(allTransactions, { header: true, columns: columns.map(col => col.key), cast: { number: (value) => String(value) } });
    }


    // ----------------------------------------------------------------------
    // FUNGSI GENERATE LAPORAN PDF (DENGAN FILTER TANGGAL)
    // ----------------------------------------------------------------------

    /** NEW: Menggunakan startDate dan endDate untuk memfilter laporan PDF. */
    async generatePdfReport(reportType: 'incoming' | 'outgoing' | 'all', startDate?: string, endDate?: string): Promise<Buffer> {
        let data: any[];
        let title: string;

        // 1. Ambil Data Berdasarkan Tipe Laporan dan Filter Tanggal
        if (reportType === 'outgoing') {
            data = await this.fetchSingleTableDataFiltered('pengeluaran', startDate, endDate);
            title = 'Laporan Pengeluaran';
        } else if (reportType === 'incoming') {
            data = await this.fetchIncomingTransactions(startDate, endDate);
            title = 'Laporan Pemasukan';
        } else { // 'all'
            data = await this.fetchAllTransactions(startDate, endDate);
            title = 'Laporan Gabungan Transaksi';
        }

        if (data.length === 0) {
            throw new HttpException('No data available to generate PDF.', 404);
        }
        
        // 2. Logika Pembuatan PDF
        return new Promise((resolve) => {
            const doc = new PDFDocument();
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                resolve(Buffer.concat(buffers));
            });

            doc.fontSize(16).text(title, { align: 'center' });
            doc.fontSize(10).moveDown();
            
            // Tampilkan rentang tanggal yang difilter jika ada
            let dateRangeText = `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`;
            if (startDate && endDate) {
                dateRangeText = `Rentang: ${startDate} s/d ${endDate} | ${dateRangeText}`;
            }
            doc.text(`Total Transaksi: ${data.length} | ${dateRangeText}`);
            doc.moveDown(0.5);

            // Tampilkan Header Kolom
            doc.fontSize(8).text('Tipe | ID | Deskripsi | Nominal | Tanggal Transaksi', 
                { underline: true });
            doc.moveDown(0.1);

            // Tampilkan Data
            data.forEach(item => {
                doc.text(`${item.tipe_transaksi || 'n/a'} | ${item.id} | ${item.nama || '-'} | Rp ${item.nominal ? item.nominal.toLocaleString('id-ID') : '0'} | ${item.tanggal_transaksi || '-'}`);
            });

            doc.end();
        });
    }
}