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
  totalPrice: number;
}

let vocabMap: Map<string, number> | null = null;
let model: NBModel | null = null;

const UNITS = ['kg', 'kilo', 'gram', 'gr', 'ons', 'liter', 'ltr', 'ml', 'pcs', 'sak', 'zak', 'dus', 'buah', 'bks', 'pack', 'rit', 'cm', 'm', 'mm', 'lembar', 'btg', 'bungkus', 'kotak', 'botol', 'galon', 'set', 'pasang', 'lsn', 'kodi', 'ikat'];
const VERBS = ['beli', 'pesan', 'order', 'butuh', 'cari', 'minta', 'ambil', 'jual', 'laku', 'keluar', 'masuk', 'dapat', 'income', 'terjual', 'bayar', 'belanja', 'biaya', 'ongkos', 'tuku', 'tumbas', 'mundut', 'jupuk', 'meser', 'ngagaleuh', 'meuli', 'bloe', 'cok', 'lakee'];
const MONEY_SFX = ['rb', 'k', 'ribu', 'rebu', 'ribee', 'rebe', 'jt', 'juta', '000', 'rp', 'perak', 'cepek', 'gopek', 'seceng', 'goceng', 'ceban', 'goban'];
const NOISE = ['bang', 'mas', 'pak', 'bu', 'mbak', 'kak', 'om', 'tolong', 'dong', 'ya', 'yuk', 'nih', 'tuh', 'sih', 'deh', 'kok', 'besok', 'kemarin', 'nanti', 'sekarang', 'ini', 'itu', 'yang', 'dan', 'sama', 'buat'];

export const OfflineNaiveBayes = {
  async loadModel(): Promise<void> {
    if (model && vocabMap) return;

    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const modelUrl = `${cleanBase}models/nb_model_complex_new.json`;

      console.log(`[Offline AI] Downloading model from: ${modelUrl}`);

      const req = await fetch(modelUrl);
      if (!req.ok) throw new Error(`Gagal download model (${req.status})`);

      const data = await req.json();
      if (!data.classes || !data.class_log_prior || !data.feature_log_prob) {
        throw new Error("Struktur Model JSON rusak.");
      }

      model = data;
      vocabMap = new Map<string, number>();
      
      if (model?.vocabulary) {
        Object.entries(model.vocabulary).forEach(([k, v]) => vocabMap!.set(k, v));
      } else if (model?.feature_names) {
        model.feature_names.forEach((k, i) => vocabMap!.set(k, i));
      }

      console.log(`[Offline AI] Ready. Loaded ${vocabMap!.size} features.`);

    } catch (e) {
      console.error('[Offline AI] Critical Error:', e);
      throw e;
    }
  },

  predict(text: string): TransactionItem[] {
    if (!model || !vocabMap) return [];

    const tokens = SmartParser.tokenize(text); 
    const results: TransactionItem[] = [];
    
    let currentItem: TransactionItem = { itemName: '', quantity: 1, price: 0, category: 'Umum', totalPrice: 0 };
    let hasItem = false;
    
    const orphanWords: string[] = [];
    let globalQuantity = 1;
    let globalPrice = 0;

    const explicitMoneyRegex = /[\d\.,]+(rb|k|ribu|rebu|ribee|jt|juta)$/i;
    const unitRegex = /^(kg|gram|ltr|liter|pcs|sak|zak|dus|buah|bks|bungkus|pack|ons)$/i;

    for (let i = 0; i < tokens.length; i++) {
        const word = tokens[i];
        const cleanWord = word.toLowerCase().trim();
        if (!cleanWord) continue;

        const activeFeatures: string[] = [];
        
        const isNumeric = /^\d+([,\.]\d+)?$/.test(cleanWord);
        const isPriceFormat = /^rp|^\d+(rb|k|ribu|rebu|ribee|jt|juta)|^\d{1,3}(\.\d{3})+$/.test(cleanWord);
        const isUnit = UNITS.includes(cleanWord);

        activeFeatures.push(`word=${cleanWord}`);
        if (isNumeric) activeFeatures.push('is_numeric');
        if (isPriceFormat) activeFeatures.push('is_price_like');
        if (isUnit) activeFeatures.push('is_unit');
        
        if (/^[A-Z]/.test(word)) activeFeatures.push('is_capitalized');
        if (/\d/.test(word)) activeFeatures.push('has_digit');

        activeFeatures.push(`suffix_1=${cleanWord.slice(-1)}`);
        if (cleanWord.length > 1) {
            activeFeatures.push(`suffix_2=${cleanWord.slice(-2)}`);
            activeFeatures.push(`prefix_2=${cleanWord.slice(0, 2)}`);
        }
        if (cleanWord.length > 2) {
            activeFeatures.push(`suffix_3=${cleanWord.slice(-3)}`);
            activeFeatures.push(`prefix_3=${cleanWord.slice(0, 3)}`);
            activeFeatures.push(`prefix_1=${cleanWord.slice(0, 1)}`);
        }

        const prev = i > 0 ? tokens[i-1].toLowerCase() : '__BOS__';
        const next = i < tokens.length - 1 ? tokens[i+1].toLowerCase() : '__EOS__';
        
        activeFeatures.push(`prev_word=${prev}`);
        activeFeatures.push(`next_word=${next}`);
        if (VERBS.includes(prev)) activeFeatures.push('prev_is_verb');
        if (UNITS.includes(prev)) activeFeatures.push('prev_is_unit');
        if (UNITS.includes(next)) activeFeatures.push('next_is_unit');
        if (MONEY_SFX.includes(next)) activeFeatures.push('next_is_price_suffix');

        const scores = model!.classes.map((label, classIdx) => {
            let totalScore = model!.class_log_prior[classIdx];
            activeFeatures.forEach(featKey => {
                const featIdx = vocabMap!.get(featKey);
                if (featIdx !== undefined) totalScore += model!.feature_log_prob[classIdx][featIdx];
            });
            return { label, score: totalScore };
        });

        scores.sort((a, b) => b.score - a.score);
        let bestTag = scores[0].label; 

        const numericVal = SmartParser.parsePrice(cleanWord);
        const isNumber = !isNaN(numericVal) && numericVal > 0;
        const isStandaloneSuffix = /^(rb|k|ribu|rebu|ribee|jt|juta)$/i.test(cleanWord);

        if (isNumber) {
            const hasMoneySuffix = explicitMoneyRegex.test(cleanWord);
            const looksLikeMoneyFormat = cleanWord.includes('.') && cleanWord.length > 4;
            const nextIsMoneySuffix = /^(rb|k|ribu|rebu|ribee|jt|juta)$/i.test(next);

            if (hasMoneySuffix || looksLikeMoneyFormat || nextIsMoneySuffix) bestTag = 'B-PRICE';
            else if (unitRegex.test(next)) bestTag = 'B-QTY';
            else {
                if (numericVal < 50 && !cleanWord.startsWith('0')) bestTag = 'B-QTY';
                else bestTag = 'B-PRICE';
            }
        } 
        
        if (isStandaloneSuffix) bestTag = 'O';

        const tagBase = bestTag.replace(/^[BI]-/, ''); 

        if (tagBase === 'ITEM') {
             if (bestTag.startsWith('B-') && hasItem) {
                 if (currentItem.itemName) results.push(finalizeItem(currentItem));
                 currentItem = { itemName: '', quantity: 1, price: 0, category: 'Umum', totalPrice: 0 };
             }
             currentItem.itemName += (currentItem.itemName ? ' ' : '') + word;
             hasItem = true;
        } 
        else if (tagBase === 'QTY') {
             const val = parseInt(cleanWord.replace(/[^0-9]/g, ''));
             if (!isNaN(val) && val > 0) {
                 currentItem.quantity = val;
                 globalQuantity = val;
             }
        } 
        else if (tagBase === 'PRICE') {
             let val = SmartParser.parsePrice(word);
             if (isNumber && !explicitMoneyRegex.test(cleanWord) && /^(rb|k|ribu|rebu|ribee|jt|juta)$/i.test(next)) {
                 const suffixMult = /jt|juta/i.test(next) ? 1000000 : 1000;
                 val = val * suffixMult;
             }
             if (val > 0) {
                 currentItem.price = val;
                 globalPrice = val;
             }
        }
        else {
            if (!isNumber && !isStandaloneSuffix && !UNITS.includes(cleanWord) && !VERBS.includes(cleanWord) && !NOISE.includes(cleanWord)) {
                orphanWords.push(word);
            }
        }
    }

    if (hasItem && currentItem.itemName) {
        results.push(finalizeItem(currentItem));
    }

    if (results.length === 0 && orphanWords.length > 0) {
        const fallbackItem: TransactionItem = {
            itemName: orphanWords.join(' '),
            quantity: globalQuantity,
            price: globalPrice,
            category: 'Umum',
            totalPrice: 0
        };
        results.push(finalizeItem(fallbackItem));
    }

    return results;
  }
};

function finalizeItem(item: TransactionItem): TransactionItem {
    // Logika Harga: Input dianggap TOTAL harga, lalu dibagi Quantity untuk dapat Harga Satuan
    if (item.quantity > 1 && item.price > 0) {
        item.totalPrice = item.price; // Simpan harga asli input sebagai Total
        item.price = item.price / item.quantity; // Hitung harga satuan
    } else {
        item.totalPrice = item.price * item.quantity;
    }
    return item;
}