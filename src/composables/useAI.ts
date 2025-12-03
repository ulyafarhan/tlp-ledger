import { ref, onMounted } from 'vue';
import { GeminiAI } from '@/services/GeminiAI';
import { OfflineNaiveBayes } from '@/services/OfflineNaiveBayes';
import { SmartParser } from '@/services/SmartParser'; // Import Baru

export function useAI() {
  const isProcessing = ref(false);
  const mode = ref<'ONLINE' | 'OFFLINE' | 'FALLBACK'>('ONLINE');

  // State tambahan untuk hasil parsing meta
  const detectedMeta = ref<{ date?: Date, type?: 'INCOME' | 'EXPENSE' }>({});

  onMounted(() => {
    OfflineNaiveBayes.loadModel();
    mode.value = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    window.addEventListener('offline', () => { mode.value = 'OFFLINE'; });
    window.addEventListener('online', () => { mode.value = 'ONLINE'; });
  });

  const processText = async (text: string): Promise<any[]> => {
    isProcessing.value = true;
    let results = [];
    
    // 1. SMART PARSING: Ekstrak Tanggal & Tipe dulu
    const { cleanText, date, type } = SmartParser.extractMeta(text);
    
    // Simpan meta untuk dipakai di UI (TransactionForm) nanti
    detectedMeta.value = { date, type };
    
    console.log(`[Smart Parser] Teks Bersih: "${cleanText}" | Date: ${date} | Type: ${type}`);

    try {
      // Gunakan CLEAN TEXT untuk dikirim ke AI (biar AI gak bingung sama tanggal)
      if (navigator.onLine) {
        try {
          results = await GeminiAI.parse(cleanText);
          if (!results?.length) throw new Error("Empty");
          mode.value = 'ONLINE';
        } catch (error) {
          console.warn('Fallback Offline...');
          mode.value = 'FALLBACK';
          results = OfflineNaiveBayes.predict(cleanText);
        }
      } else {
        mode.value = 'OFFLINE';
        results = OfflineNaiveBayes.predict(cleanText);
      }

      if (!results || results.length === 0) throw new Error("AI Gagal.");
      return results;

    } catch (err) {
      alert('Gagal memproses data.');
      return [];
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    isProcessing,
    processText,
    mode,
    detectedMeta 
  };
}