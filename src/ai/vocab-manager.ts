// src/ai/vocab-manager.ts
export const LABELS = ['O', 'ITEM', 'QTY', 'PRICE'];

export class VocabManager {
  wordIndex: Record<string, number> = { '<PAD>': 0, '<UNK>': 1 };
  indexWord: Record<number, string> = { 0: '<PAD>', 1: '<UNK>' };
  currentIndex = 2;

  constructor() {
    // Pre-load kata-kata umum UMKM agar model tidak buta huruf di awal
    const commons = ['beli', 'jual', 'nasi', 'goreng', 'ayam', 'kopi', 'gula', 'kg', 'pcs', 'bungkus', 'ribu', 'rb', 'rp'];
    commons.forEach(w => this.add(w));
  }

  add(word: string) {
    const w = word.toLowerCase().replace(/[.,]/g, '');
    if (!this.wordIndex[w]) {
      this.wordIndex[w] = this.currentIndex;
      this.indexWord[this.currentIndex] = w;
      this.currentIndex++;
    }
  }

  encode(sentence: string, maxLen = 10): number[] {
    const words = sentence.split(/\s+/);
    const tokens = words.map(w => {
      const clean = w.toLowerCase().replace(/[.,]/g, '');
      return this.wordIndex[clean] || 1; // 1 = <UNK>
    });

    // Padding / Truncating
    if (tokens.length < maxLen) {
      return [...tokens, ...Array(maxLen - tokens.length).fill(0)];
    }
    return tokens.slice(0, maxLen);
  }

  decodeLabel(index: number): string {
    return LABELS[index] || 'O';
  }
}

export const vocab = new VocabManager();