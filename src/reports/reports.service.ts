import { Injectable, HttpException } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import * as PDFDocument from 'pdfkit';

// ------------------------------------------------------------------
// INTERFACE YANG DISESUAIKAN (EXPENSE)
// ------------------------------------------------------------------

interface Expense {
    id: string;
    nama: string;
    kategori_id: number; // Disarankan number jika di DB adalah bigint/integer
    tanggal_transaksi: string; // Menggunakan ini untuk filtering tanggal
    nominal: number;
    tanggal_terverifikasi: string | null;
    verifikator: string | null;
    created_at: string; // Untuk tanggal pembuatan record
}

// Interface Income tetap sama karena skema tabelnya tidak diberikan
interface Income {
    id: string;
    nama: string;
    kategori_id: string;
    periode: string;
    status: string;
    keluarga_id: string;
    created_at: string;
}

@Injectable()
export class ReportsService {
    constructor(private readonly supabase: SupabaseService) {}

    // ------------------------------------------------------------------
    // GET EXPENSES DATA (Diperbarui untuk skema baru)
    // ------------------------------------------------------------------

    async findAllExpense() {
        const { data, error } = await this.supabase
            .getClient()
            .from('pengeluaran')
            .select('*')
            .order('tanggal_transaksi', { ascending: false }); // Menggunakan tanggal_transaksi

        if (error) throw new HttpException(error.message, 500);
        return data;
    }

    async findOneExpense(id: string) {
        const { data, error } = await this.supabase
            .getClient()
            .from('pengeluaran')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw new HttpException(error.message, 500);
        return data;
    }

    // ------------------------------------------------------------------
    // GET INCOME DATA (Tetap sama)
    // ------------------------------------------------------------------

    async findAllIncome() {
        const { data, error } = await this.supabase
            .getClient()
            .from('pemasukan_tagihan')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new HttpException(error.message, 500);
        return data;
    }

    async findOneIncome(id: string) {
        const { data, error } = await this.supabase
            .getClient()
            .from('pemasukan_tagihan')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw new HttpException(error.message, 500);
        return data;
    }

    // ------------------------------------------------------------------
    // GENERATE PDF (Dengan penyesuaian query dan tampilan PDF)
    // ------------------------------------------------------------------

    async generatePdfReport(
        type: 'incoming' | 'outgoing' | 'all',
        startDate: string,
        endDate: string
    ): Promise<Buffer> {
        let expenses: Expense[] = [];
        let incomes: Income[] = [];

        // --- Query Pengeluaran (Filtering berdasarkan tanggal_transaksi) ---
        if (type === 'outgoing' || type === 'all') {
            const { data, error } = await this.supabase
                .getClient()
                .from('pengeluaran')
                .select('*')
                // Mengubah filter dari 'created_at' menjadi 'tanggal_transaksi'
                .gte('tanggal_transaksi', startDate) 
                .lte('tanggal_transaksi', endDate)
                .order('tanggal_transaksi', { ascending: true }); // Mengurutkan berdasarkan tanggal_transaksi

            if (error) throw new HttpException(error.message, 500);
            expenses = data as Expense[];
        }

        // --- Query Pemasukan (Tetap) ---
        if (type === 'incoming' || type === 'all') {
            const { data, error } = await this.supabase
                .getClient()
                .from('pemasukan_tagihan')
                .select('*')
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .order('created_at', { ascending: true });

            if (error) throw new HttpException(error.message, 500);
            incomes = data as Income[];
        }

        // ------------------------------------------------------------
        // GENERATE PDF
        // ------------------------------------------------------------

        const doc = new PDFDocument.default();
        const buffers: Uint8Array[] = [];

        doc.on('data', buffers.push.bind(buffers));

        doc.fontSize(20).text('LAPORAN KEUANGAN', { align: 'center' });
        doc.moveDown();
        doc.text(`Periode: ${startDate} - ${endDate}`);
        doc.text(`Jenis Laporan: ${type.toUpperCase()}`);
        doc.moveDown();

        const formatRupiah = (nominal: number) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
            }).format(nominal);
        };
        
        // -------------------- OUTGOING ----------------------
        if (type === 'outgoing' || type === 'all') {
            doc.fontSize(16).text('Pengeluaran', { underline: true });
            doc.moveDown(0.5);

            if (expenses.length === 0) {
                doc.text('- Tidak ada data pengeluaran -');
            } else {
                // Tambahkan header tabel sederhana
                doc.fontSize(10).text('TGL TRANSAKSI | NOMINAL | NAMA | KATEGORI | STATUS VERIFIKASI', { underline: true });
                doc.moveDown(0.2);

                expenses.forEach((e) => {
                    const formattedNominal = formatRupiah(e.nominal);
                    const statusVerif = e.tanggal_terverifikasi ? 'TERVERIFIKASI' : 'BELUM';
                    const tanggalTrans = e.tanggal_transaksi.substring(0, 10); // Ambil hanya tanggal
                    
                    doc.text(
                        `${tanggalTrans} | ${formattedNominal} | ${e.nama} | Kategori ID: ${e.kategori_id} | Status: ${statusVerif}`
                    );
                });
            }

            doc.moveDown();
        }

        // -------------------- INCOMING ----------------------
        if (type === 'incoming' || type === 'all') {
            doc.fontSize(16).text('Pemasukan', { underline: true });
            doc.moveDown(0.5);

            if (incomes.length === 0) {
                doc.text('- Tidak ada data pemasukan -');
            } else {
                incomes.forEach((i) => {
                    doc.text(
                        `${i.created_at} | ${i.nama} | Kategori: ${i.kategori_id} | Status: ${i.status}`
                    );
                });
            }
        }

        doc.end();

        return await new Promise<Buffer>((resolve) =>
            doc.on('end', () => resolve(Buffer.concat(buffers)))
        );
    }
}