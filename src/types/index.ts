export type TransactionType = 'INCOME' | 'EXPENSE';

export interface TransactionHeader {
  id?: number;
  date: Date;
  type: TransactionType;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
}

export interface TransactionDetail {
  id?: number;
  headerId: number; // Foreign Key
  itemName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  category: string;
}

// Untuk keperluan AI Self-Learning
export interface UserFeedback {
  id?: number;
  rawInput: string;       // Teks asli dari chat/OCR
  correctedJson: string;  // Hasil koreksi user (JSON stringified)
  timestamp: Date;
  isProcessed: boolean;   // Status apakah sudah dipakai training
}

// DTO untuk input form
export interface FullTransactionPayload {
  header: Omit<TransactionHeader, 'id' | 'createdAt'>;
  details: Omit<TransactionDetail, 'id' | 'headerId'>[];
}