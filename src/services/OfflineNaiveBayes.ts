import { SmartParser } from '@/services/SmartParser';

interface NBModel {
  classes: string[];
  class_log_prior: number[];
  feature_log_prob: number[][];
  vocabulary?: { [key: string]: number }; 
  feature_names?: string[];
}

interface TransactionItem {
  itemName: string;
  quantity: number;
  price: number;
  category: string;
}

// Cache di memori
let vocabMap: Map<string, number> | null = null;
let model: NBModel | null = null;

export const OfflineNaiveBayes = {
  /**
   * Memuat model JSON dengan path dinamis
   */
  async loadModel(): Promise<void> {
    if (model && vocabMap) return;

    try {
      // 1. DETEKSI PATH OTOMATIS (Fix Failed to Fetch)
      // Menggunakan BASE_URL dari Vite agar aman meski dijalankan di sub-folder
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const modelUrl = `${cleanBase}models/nb_model_complex_new.json`;

      console.log(`[Offline AI] Downloading model from: ${modelUrl}`);

      // 2. FETCH DATA
      const req = await fetch(modelUrl);
      
      // Cek jika file tidak ditemukan (404)
      if (!req.ok) {
        throw new Error(`Gagal download file (${req.status}: ${req.statusText}). Cek path public/models/`);
      }

      const data = await req.json();

      // 3. VALIDASI STRUKTUR
      if (!data.classes || !data.class_log_prior || !data.feature_log_prob) {
        throw new Error("Struktur JSON Model NB rusak (Missing core arrays).");
      }
      
      if (!data.vocabulary && !data.feature_names) {
        throw new Error("Vocabulary tidak ditemukan di JSON.");
      }

      model = data;
      
      // 4. KONVERSI VOCABULARY KE MAP (Optimasi Performa)
      vocabMap = new Map<string, number>();
      
      if (model?.vocabulary) {
        Object.entries(model.vocabulary).forEach(([k, v]) => vocabMap!.set(k, v));
      } else if (model?.feature_names) {
        model.feature_names.forEach((k, i) => vocabMap!.set(k, i));
      }

      console.log(`[Offline AI] Ready. Loaded ${vocabMap!.size} features.`);

    } catch (e) {
      // Tampilkan error detail di console agar mudah didebug
      console.error('[Offline AI] Critical Error:', e);
      throw e; // Lempar error agar UI tahu loading gagal
    }
  },

  /**
   * Fungsi Prediksi Sparse (Cepat & Ringan)
   */
  predict(text: string): TransactionItem[] {
    if (!model || !vocabMap) return [];

    const tokens = SmartParser.tokenize(text); 
    const results: TransactionItem[] = [];
    
    let currentItem: TransactionItem = { itemName: '', quantity: 1, price: 0, category: 'Umum' };
    let hasItem = false;

    tokens.forEach((word, i) => {
        const cleanWord = word.toLowerCase().trim();
        if (!cleanWord) return;

        // --- UPDATE BAGIAN INI (MENGHASILKAN FITUR YANG SAMA DGN PYTHON) ---
        const activeFeatures: string[] = [];

        // 1. Fitur Utama
        activeFeatures.push(`word=${cleanWord}`); 
        
        // 2. Fitur Sub-word (BARU)
        if (cleanWord.length > 2) activeFeatures.push(`suffix_2=${cleanWord.slice(-2)}`);
        if (cleanWord.length > 3) activeFeatures.push(`suffix_3=${cleanWord.slice(-3)}`);
        if (cleanWord.length > 3) activeFeatures.push(`prefix_3=${cleanWord.slice(0, 3)}`);

        // 3. Fitur Context
        if (i > 0) {
            activeFeatures.push(`prev_word=${tokens[i-1].toLowerCase()}`);
        } else {
            activeFeatures.push(`prev_word=__BOS__`);
        }

        if (i < tokens.length - 1) {
             activeFeatures.push(`next_word=${tokens[i+1].toLowerCase()}`);
        } else {
             activeFeatures.push(`next_word=__EOS__`);
        }
        // ------------------------------------------------------------------

        // HITUNG SKOR (Sama seperti sebelumnya)
        const scores = model!.classes.map((label, classIdx) => {
            let totalScore = model!.class_log_prior[classIdx];
            activeFeatures.forEach(featKey => {
                const featIdx = vocabMap!.get(featKey);
                if (featIdx !== undefined) {
                    totalScore += model!.feature_log_prob[classIdx][featIdx];
                }
            });
            return { label, score: totalScore };
        });

        scores.sort((a, b) => b.score - a.score);
        let bestTag = scores[0].label; 

        // --- SOLUSI 3: RULE-BASED CORRECTION (POST-PROCESSING) ---
        // Memaksa logika jika AI ragu atau salah tebak fatal
        
        // Aturan 1: Jika formatnya angka murni atau harga (10rb), JANGAN anggap ITEM
        const isPriceLike = /^\d+(rb|k|ribu|000)?$/i.test(cleanWord);
        const isPureNumber = /^\d+$/.test(cleanWord);
        
        if (bestTag.includes('ITEM')) {
            if (isPriceLike && cleanWord.length > 1) {
                // Koreksi: Ini kemungkinan besar PRICE atau QTY, bukan ITEM
                bestTag = isPureNumber && parseInt(cleanWord) < 100 ? 'B-QTY' : 'B-PRICE';
            }
        }
        
        // Aturan 2: Satuan (kg, sak, pcs) tidak boleh jadi ITEM
        const units = ['kg', 'gram', 'ltr', 'liter', 'pcs', 'sak', 'zak', 'dus', 'buah'];
        if (units.includes(cleanWord) && bestTag.includes('ITEM')) {
            bestTag = 'B-QTY'; // Atau anggap bagian dari QTY
        }
        // ---------------------------------------------------------

        // LOGIKA BIO TAGGING (Sama seperti sebelumnya)
        const tagBase = bestTag.replace(/^[BI]-/, ''); 

        if (tagBase === 'ITEM') {
             if (bestTag.startsWith('B-') && hasItem) {
                 if (currentItem.itemName) results.push({ ...currentItem });
                 currentItem = { itemName: '', quantity: 1, price: 0, category: 'Umum' };
             }
             currentItem.itemName += (currentItem.itemName ? ' ' : '') + word;
             hasItem = true;
        } 
        else if (tagBase === 'QTY') {
             const val = parseInt(word.replace(/\D/g, ''));
             if (!isNaN(val)) currentItem.quantity = val;
        } 
        else if (tagBase === 'PRICE') {
             const val = SmartParser.parsePrice(word); 
             if (val > 0) currentItem.price = val;
        }
    });

    if (hasItem && currentItem.itemName) {
        results.push(currentItem);
    }

    return results;
  }
};