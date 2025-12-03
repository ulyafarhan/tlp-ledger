// Service untuk menjalankan SVM Linear di Browser

let model: any = null;

export const OfflineSVM = {
  async loadModel() {
    if (model) return;
    try {
      const req = await fetch('/models/svm_weights.json');
      model = await req.json();
      console.log('[Offline AI] Model SVM Dimuat');
    } catch (e) {
      console.error('Gagal muat model SVM:', e);
    }
  },

  predict(text: string) {
    if (!model) return [];

    const tokens = text.split(/\s+/);
    const results = [];
    
    // Loop setiap kata untuk klasifikasi
    let currentItem: any = { itemName: '', quantity: 1, price: 0, category: 'Umum' };

    tokens.forEach((word, i) => {
      // 1. Buat Fitur (Sama seperti di Python)
      const features: any = {
        'bias': 1,
        'word.lower()': word.toLowerCase(),
        'word.isdigit()': /^\d+$/.test(word) ? 1 : 0,
        'word.is_price': (word.includes('rb') || word.includes('k')) ? 1 : 0,
        'prev_word.lower()': i === 0 ? '' : tokens[i-1].toLowerCase(),
        'prev_word.is_digit': (i > 0 && /^\d+$/.test(tokens[i-1])) ? 1 : 0
      };

      // 2. Hitung Dot Product (Matematika SVM)
      const scores = model.classes.map((label: string, classIdx: number) => {
        let score = model.intercepts[classIdx];
        
        // Jumlahkan bobot fitur yang aktif
        for (const [featName, featVal] of Object.entries(features)) {
          // Cek apakah fitur ini ada di vocabulary model
          // (Di Python DictVectorizer memetakan "word.lower()=semen" ke index tertentu)
          const vocabKey = `${featName}=${featVal}`;
          if (model.vocabulary[vocabKey] !== undefined) {
            const featureIndex = model.vocabulary[vocabKey];
            score += model.coefficients[classIdx][featureIndex];
          }
        }
        return { label, score };
      });

      // 3. Ambil Label dengan Skor Tertinggi
      scores.sort((a: any, b: any) => b.score - a.score);
      const bestLabel = scores[0].label;

      // 4. Mapping ke Objek (Parsing Logic)
      if (bestLabel === 'ITEM') currentItem.itemName = word;
      if (bestLabel === 'QTY') currentItem.quantity = parseInt(word.replace(/\D/g,'')) || 1;
      if (bestLabel === 'PRICE') currentItem.price = parsePrice(word);
    });
    
    // Sederhana: 1 input = 1 item (SVM per kata agak kaku untuk multi-item tanpa logika CRF)
    // Tapi cukup untuk fallback offline
    if(currentItem.itemName) results.push(currentItem);
    
    return results;
  }
};

function parsePrice(t: string) {
    return parseFloat(t.toLowerCase().replace(/rb|k/g, '000').replace(/\D/g, '')) || 0;
}