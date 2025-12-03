import { SmartParser } from '@/services/SmartParser';
/**
 * Definisi Tipe Data
 */
interface NBModel {
  classes: string[]; // Label: ['ITEM', 'QTY', 'PRICE', 'O']
  class_log_prior: number[];
  feature_log_prob: number[][]; 
  feature_names: string[];
}

interface TransactionItem {
  itemName: string;
  quantity: number;
  price: number;
  category: string;
  originalText?: string;
}

// Database kata kunci (Vocabulary)
// Diperkaya untuk mencakup material, makanan, sembako, dan elektronik
const KNOWN_UNITS = [
  "kg", "sak", "pcs", "bungkus", "bks", "pak", "dus", "liter", "ltr", "meter", "m", 
  "galon", "kaleng", "batang", "btg", "lembar", "ikat", "biji", "buah", "rit", "rol"
];

const KNOWN_ITEMS = [
  "semen", "paku", "cat", "pasir", "bata", "hebel", "besi", "pipa", "kabel",
  "nasi", "mie", "ayam", "telur", "minyak", "beras", "gula", "garam",
  "pulsa", "token", "kopi", "teh", "susu", "rokok", "sabun", "sampo"
]; 

let model: NBModel | null = null;

export const OfflineNaiveBayes = {
  /**
   * Memuat model JSON dari folder public/assets
   */
  async loadModel(): Promise<void> {
    if (model) return;
    try {
      const req = await fetch('/models/nb_model_complex_new.json');
      const data = await req.json();
      
      if (!data.feature_names || !data.classes) {
        throw new Error("Struktur JSON Model NB tidak valid atau rusak.");
      }
      
      model = data;
      console.log('[Offline AI] Naive Bayes System Ready.');
    } catch (e) {
      console.error('[Offline AI] Critical: Gagal memuat model.', e);
    }
  },

  /**
   * Fungsi Prediksi Cerdas
   * Mengubah teks mentah menjadi array objek transaksi
   */
  predict(text: string): TransactionItem[] {
    if (!model || !model.feature_names) {
      console.warn('[Offline AI] Peringatan: Model belum dimuat. Mengembalikan array kosong.');
      return [];
    }

    // 1. PREPROCESSING CERDAS
    // Menggunakan Regex untuk memisahkan angka yang menempel dengan huruf
    // Contoh: "10kg" -> "10 kg", "rp50rb" -> "rp 50 rb"
    const cleanText = text.toLowerCase()
      .replace(/(\d+)([a-z]+)/g, '$1 $2') // Pisah angka-huruf
      .replace(/([a-z]+)(\d+)/g, '$1 $2') // Pisah huruf-angka
      .replace(/[,.]/g, ' ')              // Hapus tanda baca
      .replace(/\s+/g, ' ')               // Normalisasi spasi ganda
      .trim();

    const tokens = cleanText.split(' ');
    const results: TransactionItem[] = [];
    
    // 2. STATE MANAGEMENT
    let currentItem: TransactionItem = { 
      itemName: '', 
      quantity: 1, 
      price: 0, 
      category: 'Umum' 
    };
    
    // Flags untuk mendeteksi kelengkapan item saat ini
    let hasQty = false;
    let hasPrice = false;

    // Fungsi utilitas untuk menyimpan item ke hasil
    const saveAndReset = () => {
      // Hanya simpan jika ada nama barang
      if (currentItem.itemName.trim()) {
        currentItem.itemName = currentItem.itemName.trim();
        results.push({ ...currentItem });
      }
      // Reset state untuk item berikutnya
      currentItem = { itemName: '', quantity: 1, price: 0, category: 'Umum' };
      hasQty = false;
      hasPrice = false;
    };

    // 3. LOOP PREDIKSI PER KATA
    tokens.forEach((word, i) => {
      if (!word) return;

      const prevWord = i > 0 ? tokens[i - 1] : null;
      const nextWord = i < tokens.length - 1 ? tokens[i + 1] : null;

      // A. LOGIKA PEMISAH EKSPLISIT
      // Jika bertemu kata hubung, paksa simpan item sebelumnya
      if (['dan', 'sama', 'lalu', 'tambah', 'plus', 'serta', 'juga', 'dengan'].includes(word)) {
        saveAndReset();
        return; 
      }

      // B. KLASIFIKASI (NAIVE BAYES SCORING)
      const features = extractFeatures(word, prevWord, nextWord);
      
      const scores = model!.classes.map((label, classIdx) => {
        let logProb = model!.class_log_prior[classIdx];
        
        model!.feature_names.forEach((featName, featIdx) => {
          // Cek apakah fitur aktif (Boolean check pada object features)
          if ((features as any)[featName]) {
            logProb += model!.feature_log_prob[classIdx][featIdx];
          }
        });
        
        return { label, score: logProb };
      });

      // Ambil label dengan probabilitas tertinggi
      scores.sort((a, b) => b.score - a.score);
      const bestTag = scores[0].label; // Output: 'ITEM', 'QTY', 'PRICE', atau 'O'

      // C. LOGIKA PEMISAH IMPLISIT (SMART SPLIT)
      // Ini menangani kasus tanpa kata hubung, misal: "kopi 5rb gula 10rb"
      
      // Aturan 1: Ketemu ITEM baru, tapi sudah ada PRICE sebelumnya -> Item Baru
      if (bestTag === 'ITEM' && hasPrice) {
        saveAndReset();
      }
      // Aturan 2: Ketemu PRICE baru, tapi sudah ada PRICE sebelumnya -> Item Baru
      if (bestTag === 'PRICE' && hasPrice) {
        saveAndReset();
      }
      // Aturan 3: Ketemu QTY baru, tapi sudah ada QTY sebelumnya -> Item Baru
      // (Kecuali jika kata sebelumnya adalah angka juga, mungkin "10 000")
      if (bestTag === 'QTY' && hasQty && prevWord && isNaN(parseInt(prevWord))) {
        saveAndReset();
      }

      // D. MAPPING NILAI KE OBJEK
      switch (bestTag) {
        case 'ITEM':
          // Filter kata kerja/stopword agar tidak masuk ke nama barang
          if (!['beli', 'pesan', 'tolong', 'minta', 'cari', 'buat', 'pak', 'bu', 'mas', 'bang'].includes(word)) {
            currentItem.itemName += (currentItem.itemName ? ' ' : '') + word;
          }
          break;
          
        case 'QTY':
          const val = parseInt(word.replace(/\D/g, ''));
          if (!isNaN(val) && val > 0) {
            currentItem.quantity = val;
            hasQty = true;
          } else {
             // Fallback untuk angka teks
             if (word === 'satu' || word === 'sa') { currentItem.quantity = 1; hasQty = true; }
             if (word === 'dua') { currentItem.quantity = 2; hasQty = true; }
             if (word === 'tiga') { currentItem.quantity = 3; hasQty = true; }
          }
          break;
          
        case 'PRICE':
          // Parsing dasar
          let priceVal = parsePrice(word);
          
          // Koreksi Redundansi (21.000rb -> 21.000, 5000k -> 5.000.000)
          priceVal = SmartParser.fixNumber(priceVal, word);

          if (priceVal > 0) {
            currentItem.price = priceVal;
            hasPrice = true;
          }
          break;
          
        case 'O':
        default:
          // Abaikan noise
          break;
      }
    });

    // Simpan sisa item terakhir di memori
    saveAndReset();
    
    return results;
  }
};

/**
 * FEATURE EXTRACTION
 * Harus sinkron dengan logika training di Python.
 * Mengubah kata menjadi vektor fitur boolean.
 */
function extractFeatures(word: string, prevWord: string | null, nextWord: string | null) {
  const isDigit = /^\d+$/.test(word);
  
  return {
    'is_digit': isDigit,
    'is_alphanumeric': /^[a-z0-9]+$/i.test(word),
    // Deteksi format harga (termasuk dialek)
    'is_price_fmt': ['rb', 'k', 'rp', '000', 'jt', 'juta', 'ribe', 'sen'].some(x => word.includes(x)),
    // Deteksi satuan
    'is_unit': KNOWN_UNITS.includes(word),
    // Deteksi kata kerja beli
    'prefix_beli': ['beli', 'pesan', 'order', 'ambil', 'cari'].includes(word),
    
    // Fitur Konteks (Kata sebelum/sesudah)
    'prev_is_digit': prevWord ? /^\d+$/.test(prevWord) : false,
    'next_is_digit': nextWord ? /^\d+$/.test(nextWord) : false,
    
    // Dictionary Lookup (Membantu model mengenali kategori)
    'in_material': KNOWN_ITEMS.includes(word), // Simplifikasi: satu list besar items
    'in_food': KNOWN_ITEMS.includes(word),
    'in_grocery': KNOWN_ITEMS.includes(word),
    
    // Fitur Panjang Kata (opsional, kadang membantu membedakan singkatan)
    'len_lt_3': word.length < 3
  };
}

/**
 * PARSE PRICE
 * Menangani format angka standar, ribuan, dan bahasa gaul/daerah.
 */
function parsePrice(text: string): number {
  let multiplier = 1;
  const t = text.toLowerCase();

  // 1. Deteksi Multiplier (Ribu/Juta)
  if (t.includes('rb') || t.includes('k') || t.includes('ribu') || t.includes('ribe') || t.includes('rebu')) multiplier = 1000;
  if (t.includes('jt') || t.includes('juta')) multiplier = 1000000;

  // 2. Bersihkan karakter non-digit untuk parsing angka dasar
  let cleanNumber = t.replace(/[^\d]/g, '');
  
  // 3. Deteksi Bahasa Gaul/Daerah (Slang) jika tidak ada angka
  if (cleanNumber === '') {
    if (t.includes('cepek')) return 100;
    if (t.includes('gopek')) return 500;
    if (t.includes('seceng')) return 1000;
    if (t.includes('goceng')) return 2000;
    if (t.includes('goban')) return 50000;
    if (t.includes('noceng')) return 2000;
    
    // Logika Aceh / Daerah (Sa/Si/Dua)
    if (t.startsWith('sa') || t.startsWith('si')) return 1 * multiplier; 
    if (t.startsWith('dua') || t.startsWith('dwa')) return 2 * multiplier;
    
    return 0; // Gagal parse
  }

  // 4. Kalkulasi Akhir
  return (parseFloat(cleanNumber) || 0) * multiplier;
}