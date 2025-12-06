import { parse } from 'date-fns';
import { id } from 'date-fns/locale';

export interface ParsedMeta {
  date?: Date;
  type?: 'INCOME' | 'EXPENSE';
  cleanText: string;
}

export const SmartParser = {
  /**
   * Tokenizer: Memecah kalimat menjadi array kata
   * Menjaga format angka (10.000) tapi memisahkan tanda baca.
   */
  tokenize(text: string): string[] {
    if (!text) return [];
    return text.toLowerCase()
      // Pisahkan tanda baca di akhir kata (contoh: "sabun." -> "sabun .")
      .replace(/([^0-9])([\.,]+)(?=$|\s)/g, '$1 $2') 
      // Ganti karakter aneh selain alphanumeric, dot, comma, dash dengan spasi
      .replace(/[^a-z0-9\.,\-]/g, ' ') 
      .split(/\s+/)
      .filter(t => t.length > 0);
  },

  /**
   * [FIXED] Helper Parse Harga
   * Sekarang mendukung format menempel (65rb, 10k) maupun terpisah (65 rb).
   */
  parsePrice(text: string): number {
      if (!text) return 0;
      
      // Bersihkan format 'rp' dan spasi
      let clean = text.toLowerCase().replace(/rp\.?/g, '').trim();
      let multiplier = 1;
      
      // --- LOGIKA BARU: DETEKSI SUFFIX ---
      // Regex ini mengecek suffix (rb/k/jt) yang diawali oleh:
      // (^): Awal string
      // (\d): Angka (untuk kasus menempel '65rb')
      // (\s): Spasi (untuk kasus terpisah '65 rb')
      
      const millionRegex = /(?:^|\d|\s)(jt|juta|juti)\b/i;
      const thousandRegex = /(?:^|\d|\s)(rb|k|ribu|rebu|ribee)\b/i;

      // 1. Cek Jutaan
      if (millionRegex.test(clean)) {
          multiplier = 1000000;
          // Hapus suffix saja, sisakan angkanya
          clean = clean.replace(/jt|juta|juti/gi, ''); 
      } 
      // 2. Cek Ribuan
      else if (thousandRegex.test(clean)) {
          multiplier = 1000;
          clean = clean.replace(/rb|k|ribu|rebu|ribee/gi, '');
      }
      
      // --- CLEANUP ANGKA ---
      // 1. Hapus titik ribuan (10.000 -> 10000)
      // 2. Ganti koma desimal jadi titik (10,5 -> 10.5)
      clean = clean.replace(/\./g, '').replace(/,/g, '.');
      
      // 3. Hapus sisa karakter non-angka (jika ada sisa typo)
      clean = clean.replace(/[^0-9\.]/g, '');
      
      const val = parseFloat(clean);
      return (isNaN(val) ? 0 : val) * multiplier;
  },

  /**
   * PRE-PROCESSING: Analisis Awal (Tanggal & Tipe)
   */
  extractMeta(text: string): ParsedMeta {
    let cleanText = text;
    let type: 'INCOME' | 'EXPENSE' | undefined = undefined;
    let date: Date | undefined = undefined;

    const incomeKeywords = ['terjual', 'laku', 'masuk', 'pendapatan', 'jual', 'dapat', 'income'];
    const expenseKeywords = ['beli', 'belanja', 'keluar', 'bayar', 'expense', 'biaya'];

    if (incomeKeywords.some(k => cleanText.toLowerCase().includes(k))) {
      type = 'INCOME';
      cleanText = removeKeywords(cleanText, incomeKeywords);
    } 
    else if (expenseKeywords.some(k => cleanText.toLowerCase().includes(k))) {
      type = 'EXPENSE';
      cleanText = removeKeywords(cleanText, expenseKeywords);
    }

    // Deteksi Tanggal
    const dateRegex = /(?:tgl\s*)?(\d{1,2})\s*(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)[a-z]*\s*(\d{2,4})?/i;
    const match = cleanText.match(dateRegex);

    if (match) {
      try {
        const day = match[1];
        const monthStr = match[2].toLowerCase();
        const year = match[3] ? (match[3].length === 2 ? `20${match[3]}` : match[3]) : new Date().getFullYear();
        
        const months: Record<string, number> = {
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'jun': 5,
            'jul': 6, 'agu': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'des': 11
        };
        
        const monthIndex = months[monthStr.substring(0, 3)];
        date = new Date(Number(year), monthIndex, Number(day));
        
        cleanText = cleanText.replace(match[0], '').trim();
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
   * POST-PROCESSING: Koreksi Angka Redundan
   */
  fixNumber(rawPrice: number, originalWord?: string): number {
    if (!originalWord) return rawPrice;
    
    const lowerWord = originalWord.toLowerCase();
    const redundantPattern = /(\d+)\.(\d{3})\s*(rb|k|ribu|rebu|ribee)/i;
    
    if (redundantPattern.test(lowerWord)) {
        const clean = lowerWord.replace(/rb|k|ribu|rebu|ribee/g, '').replace(/\./g, '');
        return parseFloat(clean);
    }
    return rawPrice;
  }
};

function removeKeywords(text: string, keywords: string[]): string {
    let res = text;
    keywords.forEach(k => {
        const reg = new RegExp(`\\b${k}\\b`, 'gi');
        res = res.replace(reg, '');
    });
    return res;
}