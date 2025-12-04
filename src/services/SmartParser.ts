import { parse } from 'date-fns';
import { id } from 'date-fns/locale';

export interface ParsedMeta {
  date?: Date;
  type?: 'INCOME' | 'EXPENSE';
  cleanText: string;
}

export const SmartParser = {
  /**
   * [Wajib Ada] Tokenizer: Memecah kalimat menjadi array kata
   */
  tokenize(text: string): string[] {
    if (!text) return [];
    // Pisahkan spasi, tapi pertahankan alphanumeric, dot, comma, dash
    return text.toLowerCase()
      .replace(/[^a-z0-9\.,\-]/g, ' ') 
      .split(/\s+/)
      .filter(t => t.length > 0);
  },

  /**
   * [FIX] Helper Parse Harga (Mengatasi 'ribu' dan 'k')
   */
  parsePrice(text: string): number {
      if (!text) return 0;
      
      let clean = text.toLowerCase().replace(/rp\.?/g, '').trim();
      let multiplier = 1;
      
      // 1. Deteksi Multiplier (PENTING: Gunakan RegEx word boundary untuk 'ribu')
      if (/\brb\b|\bk\b|\bribu\b|\brebu\b/i.test(clean)) {
          multiplier = 1000;
          // Hapus semua penanda ribuan secara spesifik
          clean = clean.replace(/\b(rb|k|ribu|rebu)\b/g, ''); 
      } else if (/\bjt\b|\bjuta\b/i.test(clean)) {
          multiplier = 1000000;
          clean = clean.replace(/\b(jt|juta)\b/g, '');
      }
      
      // 2. Bersihkan Angka
      // Hapus titik/koma pemisah ribuan (Misal: 10.000 -> 10000)
      // Jaga titik jika ada koma (Misal: 10,5 -> 10.5)
      clean = clean.replace(/\./g, '').replace(/,/g, '.');
      
      return (parseFloat(clean) || 0) * multiplier;
  },

  /**
   * 1. PRE-PROCESSING: Analisis Awal (Tanggal & Tipe)
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
   * 2. POST-PROCESSING: Koreksi Angka (Tetap dipertahankan)
   */
  fixNumber(rawPrice: number, originalWord?: string): number {
    if (!originalWord) return rawPrice;
    
    const lowerWord = originalWord.toLowerCase();

    // Deteksi pola redundan: Ada titik ribuan (ex: 21.xxx) DAN ada suffix (rb/k)
    const redundantPattern = /(\d+)\.(\d{3})\s*(rb|k|ribu|rebu)/i;
    
    if (redundantPattern.test(lowerWord)) {
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