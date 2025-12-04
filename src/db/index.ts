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
    this.version(1).stores({
      headers: '++id, date, type', 
      details: '++id, headerId, category',
      feedback: '++id, isProcessed'
    });
  }

  // Save (Create) - Sudah ada
  async saveTransaction(payload: FullTransactionPayload): Promise<number> {
    return this.transaction('rw', this.headers, this.details, async () => {
      const headerId = await this.headers.add({
        ...payload.header,
        createdAt: new Date(),
        totalAmount: payload.details.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0)
      });

      const detailsWithKey = payload.details.map(d => ({
        ...d,
        headerId: Number(headerId),
        totalPrice: d.quantity * d.pricePerUnit
      }));

      await this.details.bulkAdd(detailsWithKey);
      return Number(headerId);
    });
  }

  // [BARU] Update Transaction
  async updateTransaction(id: number, payload: FullTransactionPayload): Promise<void> {
    return this.transaction('rw', this.headers, this.details, async () => {
      // 1. Update Header
      await this.headers.update(id, {
        ...payload.header,
        // Recalculate total
        totalAmount: payload.details.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0)
      });

      // 2. Delete Old Details (Cara paling aman untuk update one-to-many)
      await this.details.where('headerId').equals(id).delete();

      // 3. Insert New Details
      const detailsWithKey = payload.details.map(d => ({
        ...d,
        headerId: id,
        totalPrice: d.quantity * d.pricePerUnit
      }));

      await this.details.bulkAdd(detailsWithKey);
    });
  }

  // [BARU] Delete Transaction (Cascade)
  async deleteTransaction(id: number): Promise<void> {
    return this.transaction('rw', this.headers, this.details, async () => {
      await this.details.where('headerId').equals(id).delete();
      await this.headers.delete(id);
    });
  }

  // Helper: Ambil transaksi lengkap
  async getFullTransaction(headerId: number) {
    const header = await this.headers.get(headerId);
    if (!header) throw new Error('Transaction not found');
    
    const details = await this.details.where('headerId').equals(headerId).toArray();
    return { header, details };
  }
}

export const db = new AppDatabase();