import { Injectable, HttpException } from '@nestjs/common';
import { SupabaseService } from 'src/common/service/supabase.service';
import * as PDFDocument from 'pdfkit';

// ------------------------------------------------------------------
// INTERFACE YANG DISESUAIKAN (EXPENSE)
// ------------------------------------------------------------------

interface PengeluaranRow {
    id: string;
    nama: string;
    kategori_id: number | null;
    tanggal_transaksi: string | null;
    nominal: number;
    tanggal_terverifikasi: string | null;
    created_at: string | null;
}

interface KegiatanAnggaranRow {
    id: string;
    anggaran: number | null;
    tanggal: string | null;
    created_at: string | null;
}

interface TagihanRow {
    id: string;
    kategori_id: string | null;
    nama?: string | null;
    periode: string | null;
    created_at: string | null;
    status: string | null;
}

interface NonIuranRow {
    id: string;
    nominal: number | null;
    tanggal_pemasukan: string | null;
    kategori_pemasukan: string | null;
    created_at: string | null;
}

@Injectable()
export class ReportsService {
    constructor(private readonly supabase: SupabaseService) {}

    // ------------------------------------------------------------------
    // GET EXPENSES DATA (Diperbarui untuk skema baru)
    // ------------------------------------------------------------------

    async findAllExpense() {
        const client = this.supabase.getClient();

        // Ambil pengeluaran terverifikasi
        const { data: pengeluaranData, error: pengeluaranError } = await client
            .from('pengeluaran')
            .select('id, nama, kategori_id, tanggal_transaksi, nominal, tanggal_terverifikasi, created_at')
            .not('tanggal_terverifikasi', 'is', null)
            .order('tanggal_transaksi', { ascending: false });
        if (pengeluaranError) throw new HttpException(pengeluaranError.message, 500);

        // Ambil kegiatan ber-anggaran (dianggap pengeluaran)
        const { data: kegiatanData, error: kegiatanError } = await client
            .from('kegiatan')
            .select('id, anggaran, tanggal, created_at')
            .not('anggaran', 'is', null)
            .order('tanggal', { ascending: false });
        if (kegiatanError) throw new HttpException(kegiatanError.message, 500);

        const mappedPengeluaran = (pengeluaranData || []).map((row: any) => ({
            ...row,
            tipe_transaksi: 'pengeluaran',
        }));

        const mappedKegiatan = (kegiatanData || []).map((row: any) => ({
            id: row.id,
            nama: 'Pengeluaran Kegiatan',
            kategori_id: null,
            tanggal_transaksi: row.tanggal,
            nominal: row.anggaran,
            tanggal_terverifikasi: null,
            created_at: row.created_at,
            tipe_transaksi: 'pengeluaran',
        }));

        const combined = [...mappedPengeluaran, ...mappedKegiatan].sort((a, b) => {
            const ta = a.tanggal_transaksi || a.created_at || '';
            const tb = b.tanggal_transaksi || b.created_at || '';
            return tb.localeCompare(ta);
        });

        return combined;
    }

    async findOneExpense(id: string) {
        // Cari di pengeluaran dulu
        const { data, error } = await this.supabase
            .getClient()
            .from('pengeluaran')
            .select('id, nama, kategori_id, tanggal_transaksi, nominal, tanggal_terverifikasi, created_at')
            .eq('id', id)
            .single();

        if (!error && data) {
            return { ...data, tipe_transaksi: 'pengeluaran' };
        }

        // Jika tidak ada, coba cari di kegiatan ber-anggaran
        const { data: kegiatan, error: kegiatanError } = await this.supabase
            .getClient()
            .from('kegiatan')
            .select('id, anggaran, tanggal, created_at')
            .eq('id', id)
            .not('anggaran', 'is', null)
            .single();

        if (kegiatanError || !kegiatan) throw new HttpException('Data tidak ditemukan', 404);

        return {
            id: kegiatan.id,
            nama: 'Pengeluaran Kegiatan',
            kategori_id: null,
            tanggal_transaksi: kegiatan.tanggal,
            nominal: kegiatan.anggaran,
            tanggal_terverifikasi: null,
            created_at: kegiatan.created_at,
            tipe_transaksi: 'pengeluaran',
        };
    }

    // ------------------------------------------------------------------
    // GET INCOME DATA (Tetap sama)
    // ------------------------------------------------------------------

    async findAllIncome() {
        const client = this.supabase.getClient();

        const { data: kategoriData, error: kategoriError } = await client
            .from('pemasukan_kategori_iuran')
            .select('id, nama, nominal');
        if (kategoriError) throw new HttpException(kategoriError.message, 500);

        const kategoriMap = new Map<string, { nama: string; nominal: number }>();
        (kategoriData || []).forEach((row: any) => {
            kategoriMap.set(row.id, {
                nama: row.nama || 'Tidak diketahui',
                nominal: Number(row.nominal) || 0,
            });
        });

        const { data: tagihanData, error: tagihanError } = await client
            .from('pemasukan_tagihan')
            .select('id, nama, kategori_id, created_at, status, periode')
            .eq('status', 'Lunas')
            .order('periode', { ascending: false });
        if (tagihanError) throw new HttpException(tagihanError.message, 500);

        const { data: nonIuranData, error: nonIuranError } = await client
            .from('pemasukan_non_iuran')
            .select('id, nominal, tanggal_pemasukan, kategori_pemasukan, created_at')
            .order('tanggal_pemasukan', { ascending: false });
        if (nonIuranError) throw new HttpException(nonIuranError.message, 500);

        const mappedTagihan = (tagihanData || []).map((row: any) => {
            const kategori = row.kategori_id ? kategoriMap.get(row.kategori_id) : undefined;
            return {
                id: row.id,
                nama: row.nama || kategori?.nama || 'Tagihan Iuran',
                kategori_id: row.kategori_id,
                nominal: kategori?.nominal || 0,
                periode: row.periode,
                created_at: row.created_at,
                status: row.status,
                tipe_transaksi: 'pemasukan_tagihan',
            };
        });

        const mappedNonIuran = (nonIuranData || []).map((row: any) => ({
            id: row.id,
            nama: row.kategori_pemasukan || 'Pemasukan Non Iuran',
            kategori_id: null,
            nominal: Number(row.nominal) || 0,
            tanggal_transaksi: row.tanggal_pemasukan,
            created_at: row.created_at,
            status: null,
            tipe_transaksi: 'pemasukan_non_iuran',
        }));

        const combined = [...mappedTagihan, ...mappedNonIuran]
            .map((row: any) => ({
                ...row,
                tanggal_sort: (row.periode || row.tanggal_transaksi || row.created_at || '').toString(),
            }))
            .sort((a, b) => {
                const da = new Date(a.tanggal_sort).getTime();
                const db = new Date(b.tanggal_sort).getTime();
                if (Number.isFinite(da) && Number.isFinite(db)) return db - da;
                return b.tanggal_sort.localeCompare(a.tanggal_sort);
            });

        return combined;
    }

    async findOneIncome(id: string) {
        const client = this.supabase.getClient();

        const { data: kategoriData, error: kategoriError } = await client
            .from('pemasukan_kategori_iuran')
            .select('id, nama, nominal');
        if (kategoriError) throw new HttpException(kategoriError.message, 500);

        const kategoriMap = new Map<string, { nama: string; nominal: number }>();
        (kategoriData || []).forEach((row: any) => {
            kategoriMap.set(row.id, {
                nama: row.nama || 'Tidak diketahui',
                nominal: Number(row.nominal) || 0,
            });
        });

        const { data, error } = await client
            .from('pemasukan_tagihan')
            .select('id, kategori_id, created_at, status, periode')
            .eq('id', id)
            .single();

        if (!error && data) {
            const kategori = data.kategori_id ? kategoriMap.get(data.kategori_id) : undefined;
            return {
                id: data.id,
                nama: kategori?.nama || 'Tagihan Iuran',
                kategori_id: data.kategori_id,
                nominal: kategori?.nominal || 0,
                periode: data.periode,
                created_at: data.created_at,
                status: data.status,
                tipe_transaksi: 'pemasukan_tagihan',
            };
        }

        const { data: nonIuran, error: nonIuranError } = await client
            .from('pemasukan_non_iuran')
            .select('id, nominal, tanggal_pemasukan, kategori_pemasukan, created_at')
            .eq('id', id)
            .single();

        if (nonIuranError || !nonIuran) throw new HttpException('Data tidak ditemukan', 404);

        return {
            id: nonIuran.id,
            nama: nonIuran.kategori_pemasukan || 'Pemasukan Non Iuran',
            kategori_id: null,
            nominal: Number(nonIuran.nominal) || 0,
            tanggal_transaksi: nonIuran.tanggal_pemasukan,
            created_at: nonIuran.created_at,
            status: null,
            tipe_transaksi: 'pemasukan_non_iuran',
        };
    }

    // ------------------------------------------------------------------
    // GENERATE PDF (Dengan penyesuaian query dan tampilan PDF)
    // ------------------------------------------------------------------

    async generatePdfReport(
        type: 'incoming' | 'outgoing' | 'all',
        startDate: string,
        endDate: string
    ): Promise<Buffer> {
        // Ambil peta kategori untuk nama kategori pengeluaran
        const { data: pengeluaranKategoriData, error: pengeluaranKategoriError } = await this.supabase
            .getClient()
            .from('pengeluaran_kategori')
            .select('id, nama');
        if (pengeluaranKategoriError) throw new HttpException(pengeluaranKategoriError.message, 500);
        const pengeluaranKategoriMap = (pengeluaranKategoriData || []).reduce((acc: Record<number, string>, row: any) => {
            acc[row.id] = row.nama || 'Tidak diketahui';
            return acc;
        }, {});

        // Ambil peta kategori untuk pemasukan (iuran)
        const { data: pemasukanKategoriData, error: pemasukanKategoriError } = await this.supabase
            .getClient()
            .from('pemasukan_kategori_iuran')
            .select('id, nama, nominal');
        if (pemasukanKategoriError) throw new HttpException(pemasukanKategoriError.message, 500);
        const pemasukanKategoriMap = (pemasukanKategoriData || []).reduce((acc: Record<string, string>, row: any) => {
            acc[row.id] = row.nama || 'Tidak diketahui';
            return acc;
        }, {});
        const pemasukanKategoriNominalMap = (pemasukanKategoriData || []).reduce((acc: Record<string, number>, row: any) => {
            acc[row.id] = this.safeNumber(row.nominal);
            return acc;
        }, {});

        // Ambil data sumber sesuai Finance Dashboard
        let pengeluaranRows: PengeluaranRow[] = [];
        let kegiatanRows: KegiatanAnggaranRow[] = [];
        let tagihanRows: TagihanRow[] = [];
        let nonIuranRows: NonIuranRow[] = [];

        // --- Query Pengeluaran (verified) ---
        if (type === 'outgoing' || type === 'all') {
            const { data, error } = await this.supabase
                .getClient()
                .from('pengeluaran')
                .select('id, nama, kategori_id, tanggal_transaksi, nominal, tanggal_terverifikasi, created_at')
                .not('tanggal_terverifikasi', 'is', null)
                .gte('tanggal_transaksi', startDate)
                .lte('tanggal_transaksi', endDate)
                .order('tanggal_transaksi', { ascending: true });

            if (error) throw new HttpException(error.message, 500);
            pengeluaranRows = data as PengeluaranRow[];

            // Kegiatan dengan anggaran (diperlakukan sebagai pengeluaran)
            const { data: kegiatanData, error: kegiatanError } = await this.supabase
                .getClient()
                .from('kegiatan')
                .select('id, anggaran, tanggal, created_at')
                .not('anggaran', 'is', null)
                .gte('tanggal', startDate)
                .lte('tanggal', endDate)
                .order('tanggal', { ascending: true });
            if (kegiatanError) throw new HttpException(kegiatanError.message, 500);
            kegiatanRows = kegiatanData as KegiatanAnggaranRow[];
        }

        // --- Query Pemasukan: tagihan lunas + non-iuran ---
        if (type === 'incoming' || type === 'all') {
            const { data: tagihanData, error: tagihanError } = await this.supabase
                .getClient()
                .from('pemasukan_tagihan')
                .select('id, nama, kategori_id, created_at, status, periode')
                .eq('status', 'Lunas')
                .gte('periode', startDate)
                .lte('periode', endDate)
                .order('periode', { ascending: true });
            if (tagihanError) throw new HttpException(tagihanError.message, 500);
            tagihanRows = tagihanData as TagihanRow[];

            const { data: nonIuranData, error: nonIuranError } = await this.supabase
                .getClient()
                .from('pemasukan_non_iuran')
                .select('id, nominal, tanggal_pemasukan, kategori_pemasukan, created_at')
                .gte('tanggal_pemasukan', startDate)
                .lte('tanggal_pemasukan', endDate)
                .order('tanggal_pemasukan', { ascending: true });
            if (nonIuranError) throw new HttpException(nonIuranError.message, 500);
            nonIuranRows = nonIuranData as NonIuranRow[];
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

        const pad = (value: string, len: number) => {
            if (value.length > len) return value.slice(0, len - 1) + '…';
            return value.padEnd(len, ' ');
        };

        const addTable = (headers: string[], rows: string[][]) => {
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text(headers.map((h, i) => pad(h, columnWidths[i])).join(' | '));
            doc.moveDown(0.2);
            doc.font('Helvetica');
            rows.forEach((r) => {
                const line = r.map((c, i) => pad(c, columnWidths[i])).join(' | ');
                doc.text(line, { continued: false });
            });
        };

        // Lebar kolom yang lebih longgar agar muat satu baris
        const columnWidths = [12, 18, 28, 22, 14];

        const outgoingTotal = (type === 'outgoing' || type === 'all')
            ? pengeluaranRows.reduce((sum, r) => sum + this.safeNumber(r.nominal), 0)
                + kegiatanRows.reduce((sum, r) => sum + this.safeNumber(r.anggaran), 0)
            : 0;

        const totalTagihan = (type === 'incoming' || type === 'all')
            ? tagihanRows.reduce((sum, i) => {
                const nominal = i.kategori_id ? this.safeNumber(pemasukanKategoriNominalMap[i.kategori_id]) : 0;
                return sum + nominal;
            }, 0)
            : 0;

        const totalNonIuran = (type === 'incoming' || type === 'all')
            ? nonIuranRows.reduce((sum, n) => sum + this.safeNumber(n.nominal), 0)
            : 0;

        const incomingTotal = totalTagihan + totalNonIuran;
        
        // -------------------- OUTGOING ----------------------
        if (type === 'outgoing' || type === 'all') {
            doc.fontSize(16).text('Pengeluaran', { underline: true });
            doc.moveDown(0.5);

            const rows = [...pengeluaranRows, ...kegiatanRows].map((e) => {
                const isKegiatan = 'anggaran' in e;
                const nominal = isKegiatan ? Number((e as KegiatanAnggaranRow).anggaran) || 0 : Number((e as PengeluaranRow).nominal) || 0;
                const tanggal = (isKegiatan ? (e as KegiatanAnggaranRow).tanggal : (e as PengeluaranRow).tanggal_transaksi) || (e.created_at ?? '') || '';
                const tanggalStr = tanggal.toString().substring(0, 10);
                const nama = isKegiatan ? 'Pengeluaran Kegiatan' : (e as PengeluaranRow).nama;
                const kategoriNama = isKegiatan
                    ? 'Kegiatan'
                    : ((e as PengeluaranRow).kategori_id != null
                        ? pengeluaranKategoriMap[(e as PengeluaranRow).kategori_id!] || 'Tidak diketahui'
                        : 'Lainnya');
                const status = isKegiatan
                    ? 'KEGIATAN'
                    : ((e as PengeluaranRow).tanggal_terverifikasi ? 'TERVERIFIKASI' : 'BELUM');

                return [
                    tanggalStr,
                    formatRupiah(nominal),
                    nama || '-',
                    kategoriNama,
                    status,
                ];
            }).sort((a, b) => a[0].localeCompare(b[0]));

            if (rows.length === 0) {
                doc.text('- Tidak ada data pengeluaran -');
            } else {
                addTable(
                    ['Tgl', 'Nominal', 'Nama', 'Kategori', 'Status'],
                    rows,
                );
                doc.moveDown(0.3);
                doc.font('Helvetica-Bold').text(`Total Pengeluaran: ${formatRupiah(outgoingTotal)}`);
                doc.font('Helvetica');
            }

            doc.moveDown();
        }

        // -------------------- INCOMING ----------------------
        if (type === 'incoming' || type === 'all') {
            doc.fontSize(16).text('Pemasukan', { underline: true });
            doc.moveDown(0.5);

            const rows = [
                ...tagihanRows.map((i) => {
                    const tanggal = (i.periode || i.created_at || '').toString().substring(0, 10);
                    const kategoriNama = i.kategori_id ? (pemasukanKategoriMap[i.kategori_id] || 'Tidak diketahui') : 'Lainnya';
                    const nominal = i.kategori_id ? (this.safeNumber(pemasukanKategoriNominalMap[i.kategori_id]) || 0) : 0;
                    const status = i.status || '-';
                    return [tanggal, i.nama || '-', kategoriNama, status, formatRupiah(nominal)];
                }),
                ...nonIuranRows.map((n) => {
                    const tanggal = (n.tanggal_pemasukan || n.created_at || '').toString().substring(0, 10);
                    const kategoriNama = n.kategori_pemasukan || 'Lainnya';
                    const nominal = Number(n.nominal) || 0;
                    return [tanggal, '-', kategoriNama, '-', formatRupiah(nominal)];
                })
            ].sort((a, b) => a[0].localeCompare(b[0]));

            if (rows.length === 0) {
                doc.text('- Tidak ada data pemasukan -');
            } else {
                addTable(
                    ['Tgl', 'Nama', 'Kategori', 'Status', 'Nominal'],
                    rows,
                );
                doc.moveDown(0.3);
                doc.font('Helvetica-Bold').text(`Total Pemasukan: ${formatRupiah(incomingTotal)}`);
                doc.font('Helvetica');
            }
        }

        if (type === 'all') {
            doc.moveDown(0.8);
            doc.fontSize(14).text('Ringkasan', { underline: true });
            doc.moveDown(0.3);
            doc.font('Helvetica');
            doc.text(`Total Pemasukan: ${formatRupiah(incomingTotal)}`);
            doc.text(`Total Pengeluaran: ${formatRupiah(outgoingTotal)}`);
            doc.font('Helvetica-Bold').text(`Saldo Akhir: ${formatRupiah(incomingTotal - outgoingTotal)}`);
            doc.font('Helvetica');
        }

        doc.end();

        return await new Promise<Buffer>((resolve) =>
            doc.on('end', () => resolve(Buffer.concat(buffers)))
        );
    }

    private safeNumber(value: any): number {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
    }
}