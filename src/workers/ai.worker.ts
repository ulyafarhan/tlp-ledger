import * as tf from '@tensorflow/tfjs';

// KONFIGURASI
const MAX_LEN = 40; 
const MODEL_URL = '/models/ner/model.json';
const METADATA_URL = '/models/ner/'; 

let model: tf.GraphModel | null = null;
let wordIndex: Record<string, number> = {};
let labelMap: Record<string, string> = {};
let isReady = false;

const initAI = async () => {
  try {
    console.log('[AI Worker] Memulai inisialisasi...');
    model = await tf.loadGraphModel(MODEL_URL);
    
    // Load Metadata
    const vocabReq = await fetch(`${METADATA_URL}word_index.json`);
    wordIndex = await vocabReq.json();
    const labelReq = await fetch(`${METADATA_URL}label_map.json`);
    labelMap = await labelReq.json();

    isReady = true;
    console.log('[AI Worker] Siap! Graph Model dimuat.');
    
    // Warmup (float32)
    const dummy = tf.zeros([1, MAX_LEN], 'float32');
    try {
        const res = await model.executeAsync(dummy);
        if (Array.isArray(res)) res.forEach(t => t.dispose());
        else (res as tf.Tensor).dispose();
    } catch(e) { console.warn(e); }
    dummy.dispose();

    self.postMessage({ type: 'READY' });

  } catch (error) {
    self.postMessage({ type: 'ERROR', error: `Gagal Load AI: ${error}` });
  }
};

initAI();

// [FIX] Tokenizer dikembalikan ke versi simpel (Sesuai Keras)
const tokenize = (text: string): number[] => {
  // Hapus tanda baca saja, JANGAN pisahkan angka dan huruf (50rb harus tetap 50rb)
  const clean = text.toLowerCase().replace(/[.,]/g, ''); 
  
  const words = clean.split(/\s+/);
  
  const sequence = words.map(w => wordIndex[w] || 1); // 1 = UNK
  
  if (sequence.length < MAX_LEN) {
    return [...sequence, ...Array(MAX_LEN - sequence.length).fill(0)];
  } else {
    return sequence.slice(0, MAX_LEN);
  }
};

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'PARSE_TEXT') {
    if (!isReady || !model) return;

    try {
      // Tokenisasi payload asli
      const inputIds = tokenize(payload);
      const inputTensor = tf.tensor2d([inputIds], [1, MAX_LEN], 'float32');

      // Inference
      let prediction = await model.executeAsync(inputTensor);
      if (Array.isArray(prediction)) prediction = prediction[0];
      
      const predTensor = prediction as tf.Tensor;
      const labelIndices = predTensor.argMax(-1).dataSync();
      
      // [FIX] Gunakan split yang sama dengan tokenizer agar sinkron
      const words = payload.toLowerCase().replace(/[.,]/g, '').split(/\s+/);
      
      const tags = Array.from(labelIndices)
        .slice(0, words.length)
        .map(idx => labelMap[idx.toString()] || 'O');

      const results = parseBIO(words, tags);
      self.postMessage({ type: 'PARSE_RESULT', data: results });
      
      inputTensor.dispose();
      predTensor.dispose();

    } catch (err) {
      self.postMessage({ type: 'ERROR', error: 'Gagal prediksi.' });
    }
  }
};

// [FIX] Parser BIO yang menangani suffix (rb, k, juta)
function parseBIO(words: string[], tags: string[]) {
  const items: any[] = [];
  let currentItem: any = { itemName: '', quantity: 1, price: 0, category: 'Umum' };
  let isCollecting = false;

  const pushItem = () => {
    if (currentItem.itemName.trim() || currentItem.price > 0) {
        if (!currentItem.itemName.trim()) currentItem.itemName = "Item Tanpa Nama";
        // Bersihkan nama item dari spasi berlebih
        currentItem.itemName = currentItem.itemName.trim();
        items.push({...currentItem});
    }
    currentItem = { itemName: '', quantity: 1, price: 0, category: 'Umum' };
    isCollecting = false;
  };

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const t = tags[i];
    
    // Separator logic
    if (t === 'O' && ['dan', 'lalu', 'serta', ',', '+'].includes(w)) {
        if (isCollecting) pushItem();
        continue;
    }

    if (t.startsWith('B-')) {
        if (t === 'B-ITEM' && isCollecting) pushItem();
        isCollecting = true;
        updateItem(currentItem, t.split('-')[1], w);
    } 
    else if (t.startsWith('I-')) {
        updateItem(currentItem, t.split('-')[1], w);
    }
  }
  
  pushItem();
  return items;
}

function updateItem(item: any, type: string, word: string) {
    if (type === 'ITEM') {
        item.itemName += (item.itemName ? ' ' : '') + word;
    } else if (type === 'QTY') {
        const val = parseNumber(word, false); // false = jangan kali 1000 untuk qty
        if (val > 0) item.quantity = val;
    } else if (type === 'PRICE') {
        const val = parseNumber(word, true); // true = aktifkan logika mata uang
        if (val > 0) item.price = val;
    }
}

// [FIX] Fungsi Parse Number yang menangani '65rb'
function parseNumber(text: string, isPrice: boolean): number {
    let str = text.toLowerCase();
    let multiplier = 1;

    // Deteksi suffix umum
    if (str.includes('rb') || str.includes('ribu') || str.includes('k')) {
        multiplier = 1000;
    } else if (str.includes('jt') || str.includes('juta')) {
        multiplier = 1000000;
    }

    // Bersihkan semua huruf
    let clean = str.replace(/[^\d]/g, '');
    let num = parseFloat(clean);

    if (isNaN(num)) return 0;

    // Jika ini harga dan angkanya kecil (misal "65" tanpa suffix), tapi konteksnya harga,
    // AI Python Anda kadang melatih "50" = "50000" jika formatnya ".000" hilang,
    // TAPI aman-nya kita ikuti multiplier eksplisit dulu.
    
    return num * multiplier;
}