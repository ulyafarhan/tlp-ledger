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
    super('FinanceLedgerDB');
    this.version(1).stores({
      headers: '++id, date, type', 
      details: '++id, headerId, category',
      feedback: '++id, isProcessed'
    });
  }

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

  async updateTransaction(id: number, payload: FullTransactionPayload): Promise<void> {
    return this.transaction('rw', this.headers, this.details, async () => {
      await this.headers.update(id, {
        ...payload.header,
        totalAmount: payload.details.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0)
      });

      await this.details.where('headerId').equals(id).delete();

      const detailsWithKey = payload.details.map(d => ({
        ...d,
        headerId: id,
        totalPrice: d.quantity * d.pricePerUnit
      }));

      await this.details.bulkAdd(detailsWithKey);
    });
  }

  async deleteTransaction(id: number): Promise<void> {
    return this.transaction('rw', this.headers, this.details, async () => {
      await this.details.where('headerId').equals(id).delete();
      await this.headers.delete(id);
    });
  }

  async getFullTransaction(headerId: number) {
    const header = await this.headers.get(headerId);
    if (!header) throw new Error('Transaction not found');
    
    const details = await this.details.where('headerId').equals(headerId).toArray();
    return { header, details };
  }
}

export const db = new AppDatabase();