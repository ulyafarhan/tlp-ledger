// src/models/AIProcessor.ts
// Ini adalah "Model" logika, bukan model database.

export class TextProcessor {
  // Logic membersihkan teks sebelum dikirim ke AI
  static cleanInput(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s.,]/g, '') // Hapus simbol aneh
      .trim();
  }

  // Logic memformat hasil AI agar seragam
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
  }
}