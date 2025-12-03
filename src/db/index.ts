import Dexie, { type Table } from 'dexie';
import type { 
  TransactionHeader, 
  TransactionDetail, 
  UserFeedback, 
  FullTransactionPayload 
} from '@/types';

export class AppDatabase extends Dexie {
  headers!: Table<TransactionHeader>;
  details!: Table<TransactionDetail>;
  feedback!: Table<UserFeedback>;

  constructor() {
    super('TLPLedgerDB');
    
    // Versi 1: Definisi Schema & Indexing
    this.version(1).stores({
      headers: '++id, date, type', 
      details: '++id, headerId, category',
      feedback: '++id, isProcessed'
    });
  }

  // Atomic Operation: Header & Detail tersimpan bersamaan atau batal semua
  async saveTransaction(payload: FullTransactionPayload): Promise<number> {
    return this.transaction('rw', this.headers, this.details, async () => {
      // 1. Simpan Header
      const headerId = await this.headers.add({
        ...payload.header,
        createdAt: new Date(),
        // Pastikan total dihitung ulang dari detail untuk keamanan data
        totalAmount: payload.details.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0)
      });

      // 2. Siapkan Details dengan Foreign Key
      const detailsWithKey = payload.details.map(d => ({
        ...d,
        headerId: Number(headerId), // Link ke Header
        totalPrice: d.quantity * d.pricePerUnit
      }));

      // 3. Simpan Batch Details
      await this.details.bulkAdd(detailsWithKey);

      return Number(headerId);
    });
  }

  // Helper: Ambil transaksi lengkap (Header + Children)
  async getFullTransaction(headerId: number) {
    const header = await this.headers.get(headerId);
    if (!header) throw new Error('Transaction not found');
    
    const details = await this.details.where('headerId').equals(headerId).toArray();
    return { header, details };
  }
}

export const db = new AppDatabase();