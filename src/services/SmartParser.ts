import { parse } from 'date-fns';
import { id } from 'date-fns/locale';

export interface ParsedMeta {
  date?: Date;
  type?: 'INCOME' | 'EXPENSE';
  cleanText: string;
}

export const SmartParser = {
  /**
   * 1. PRE-PROCESSING: Analisis Awal (Tanggal & Tipe)
   * Memisahkan informasi tanggal/tipe dari teks barang agar AI fokus ke barang saja.
   */
  extractMeta(text: string): ParsedMeta {
    let cleanText = text;
    let type: 'INCOME' | 'EXPENSE' | undefined = undefined;
    let date: Date | undefined = undefined;

    // A. DETEKSI TIPE TRANSAKSI (Income Detection)
    const incomeKeywords = ['terjual', 'laku', 'masuk', 'pendapatan', 'jual', 'dapat', 'income'];
    const expenseKeywords = ['beli', 'belanja', 'keluar', 'bayar', 'expense', 'biaya'];

    // Cek keyword Pemasukan
    if (incomeKeywords.some(k => cleanText.toLowerCase().includes(k))) {
      type = 'INCOME';
      // Hapus keyword agar tidak dianggap nama barang oleh AI
      cleanText = removeKeywords(cleanText, incomeKeywords);
    } 
    // Cek keyword Pengeluaran (jika eksplisit)
    else if (expenseKeywords.some(k => cleanText.toLowerCase().includes(k))) {
      type = 'EXPENSE';
      cleanText = removeKeywords(cleanText, expenseKeywords);
    }

    // B. DETEKSI TANGGAL (Basic Regex untuk format Indonesia)
    // Contoh: "18 nov", "18 november", "tgl 18"
    const dateRegex = /(\d{1,2})\s*(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)[a-z]*\s*(\d{2,4})?/i;
    const match = cleanText.match(dateRegex);

    if (match) {
      try {
        const day = match[1];
        const monthStr = match[2].toLowerCase();
        const year = match[3] ? (match[3].length === 2 ? `20${match[3]}` : match[3]) : new Date().getFullYear();
        
        // Mapping bulan ID ke Index
        const months: Record<string, number> = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'jun': 5,
            'jul': 6, 'agu': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'des': 11
        };
        
        const monthIndex = months[monthStr.substring(0, 3)];
        date = new Date(Number(year), monthIndex, Number(day));
        
        // Hapus tanggal dari teks agar tidak mengganggu AI
        cleanText = cleanText.replace(match[0], '').trim();
        
        // Hapus nama hari jika ada (Senin, Selasa...)
        const dayNames = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
        dayNames.forEach(d => {
            const dayReg = new RegExp(`\\b${d}\\b`, 'gi');
            cleanText = cleanText.replace(dayReg, '');
        });

      } catch (e) {
        console.warn("Gagal parse tanggal:", e);
      }
    }

    return {
      date,
      type,
      cleanText: cleanText.replace(/\s+/g, ' ').trim()
    };
  },

  /**
   * 2. POST-PROCESSING: Koreksi Angka
   * Memperbaiki "21.000rb" menjadi 21000
   */
  fixNumber(rawPrice: number, originalWord?: string): number {
    if (!originalWord) return rawPrice;
    
    const lowerWord = originalWord.toLowerCase();

    // Deteksi pola redundan: Ada titik ribuan (ex: 21.xxx) DAN ada suffix (rb/k)
    // Regex: Digit + Titik + 3 Digit + (rb/k/ribu)
    // Contoh: 21.000rb
    const redundantPattern = /(\d+)\.(\d{3})\s*(rb|k|ribu|rebu)/i;
    
    if (redundantPattern.test(lowerWord)) {
        // Jika pola ini ketemu, buang suffix-nya, ambil angkanya saja
        // 21.000rb -> 21000
        const clean = lowerWord.replace(/rb|k|ribu|rebu/g, '').replace(/\./g, '');
        return parseFloat(clean);
    }

    return rawPrice;
  }
};

// Helper untuk menghapus keyword dari kalimat
function removeKeywords(text: string, keywords: string[]): string {
    let res = text;
    keywords.forEach(k => {
        // Hapus keyword (case insensitive, whole word match)
        const reg = new RegExp(`\\b${k}\\b`, 'gi');
        res = res.replace(reg, '');
    });
    return res;
}