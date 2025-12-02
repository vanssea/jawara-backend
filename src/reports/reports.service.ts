import { HttpException, Injectable } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import { stringify } from 'csv-stringify/sync';

@Injectable()
export class ReportsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // READ ALL
  async findAll() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('pengeluaran')
      .select('*');

    if (error) throw new HttpException(error.message, 500);
    return data;
  }

  // READ ONE by ID
  async findOne(id: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('pengeluaran')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new HttpException(error.message, 500);
    return data;
  }

  // Method untuk membuat laporan CSV
  async generateCsvReport(): Promise<string> {
        // 1. Ambil Data
        const expenses = await this.findAll();

        if (expenses.length === 0) {
            return 'No expense data available.';
        }

        // 2. Tentukan Header Kolom
        const columns = [
            { key: 'id', header: 'ID' },
            { key: 'nama_pengeluaran', header: 'Nama Pengeluaran' },
            { key: 'jumlah', header: 'Jumlah' },
            { key: 'tanggal', header: 'Tanggal' },
            // ... tambahkan kolom lain sesuai struktur data Anda
        ];

        // 3. Konversi data menjadi string CSV
        const csvString = stringify(expenses, {
            header: true,
            columns: columns.map(col => col.key),
            cast: {
                // Contoh: memastikan jumlah di-format dengan benar jika perlu
                number: (value) => String(value),
            }
        });

        return csvString;
    }

    // ⭐ NEW: Method untuk membuat laporan PDF (Logika tergantung library yang digunakan,
    // di sini hanya contoh kerangka)
    async generatePdfReport(): Promise<Buffer> {
        // Anda akan menggunakan library seperti 'pdfkit' di sini.
        // Proses ini lebih kompleks dan menghasilkan Buffer (data biner).
        // return await pdfKitLogic(expenses); 
        throw new Error('PDF generation logic not implemented yet.');
    }
}
