import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyD0z3TJZlDDOiAyKwgv1Ey6qORicJj265I"; 

export const GeminiAI = {
  async parse(text: string) {
    if (!navigator.onLine) return null; // Safety check
    
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

      const prompt = `
        Parse teks transaksi ini menjadi JSON array.
        Teks: "${text}"
        Aturan:
        - Identifikasi: itemName, quantity (number), price (number total), category.
        - Normalisasi angka (50rb -> 50000).
        - Output HANYA JSON murni, tanpa markdown.
        
        Contoh format: [{"itemName": "Semen", "quantity": 2, "price": 100000, "category": "Bahan"}]
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text().replace(/```json|```/g, '').trim();
      
      return JSON.parse(textResponse);
    } catch (error) {
      console.error("Gemini Gagal:", error);
      throw error; // Lempar agar ditangkap fallback
    }
  }
};