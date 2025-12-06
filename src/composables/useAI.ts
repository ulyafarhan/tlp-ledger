import { ref } from 'vue';
import { GeminiAI } from '@/services/GeminiAI';
import { OfflineNaiveBayes } from '@/services/OfflineNaiveBayes';
import { SmartParser, type ParsedMeta } from '@/services/SmartParser';

export function useAI() {
  const isProcessing = ref(false);
  const error = ref<string | null>(null);
  const detectedMeta = ref<ParsedMeta>({ cleanText: '' });
  
  // Indikator UI: Sedang pakai mode apa? (Opsional, agar user tau)
  const activeMode = ref<'ONLINE' | 'OFFLINE'>('OFFLINE');

  /**
   * Cek Koneksi Internet Browser (Realtime)
   */
  const checkOnlineStatus = (): boolean => {
    return navigator.onLine; 
  };

  /**
   * Helper: Jalankan AI Offline (Naive Bayes)
   */
  const runOfflineAI = async (cleanText: string) => {
    console.log('[AI Strategy] Menggunakan Mode OFFLINE (Naive Bayes)...');
    activeMode.value = 'OFFLINE';
    
    // Pastikan model dimuat dulu
    await OfflineNaiveBayes.loadModel();
    return OfflineNaiveBayes.predict(cleanText);
  };

  /**
   * Strategi Hybrid Real-time
   */
  const processText = async (text: string) => {
    isProcessing.value = true;
    error.value = null;
    
    // 1. Pre-processing
    detectedMeta.value = SmartParser.extractMeta(text);
    const textToProcess = detectedMeta.value.cleanText;

    try {
      // 2. CEK KONEKSI FISIK
      // Jika kabel internet putus / Wifi mati -> Langsung Offline
      if (!checkOnlineStatus()) {
        console.warn('[AI Strategy] Tidak ada koneksi internet.');
        return await runOfflineAI(textToProcess);
      }

      // 3. COBA GEMINI (ONLINE)
      // Kita coba tembak server Google.
      try {
        console.log('[AI Strategy] Mencoba Gemini ONLINE...');
        
        // Race Condition: Kalau Gemini loading lebih dari 5 detik, kita anggap timeout & switch offline
        const result = await Promise.race([
          GeminiAI.parse(textToProcess),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
        ]);

        // Jika berhasil sampai sini, berarti Online lancar & Kuota aman
        activeMode.value = 'ONLINE';
        return result;

      } catch (err: any) {
        // 4. PENANGANAN ERROR "CERDAS" (FALLBACK)
        // Masuk ke sini jika: 
        // - Kuota Habis (Error 429)
        // - API Key Salah (Error 403)
        // - Koneksi RTO/Timeout
        // - Jaringan tidak stabil (Failed to fetch)
        
        const errMsg = err.message || '';
        console.warn(`[AI Strategy] Gagal Online (${errMsg}). Mengalihkan ke Offline...`);

        // Apapun alasannya gagal online, JANGAN BERHENTI. 
        // Langsung oper ke AI Offline.
        return await runOfflineAI(textToProcess);
      }

    } catch (e) {
      // Safety net terakhir jika Offline AI pun error (sangat jarang)
      console.error('[AI Strategy] Critical Error:', e);
      alert('Gagal memproses data baik Online maupun Offline.');
      return [];
      
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    processText,
    isProcessing,
    error,
    detectedMeta,
    activeMode 
  };
}