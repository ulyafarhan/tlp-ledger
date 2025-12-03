import { db } from '@/db';
import type { TransactionHeader } from '@/types';

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  chartData: {
    labels: string[];
    income: number[];
    expense: number[];
  };
  recentTransactions: TransactionHeader[];
}

export const AnalyticsService = {
  async getDashboardData(): Promise<DashboardStats> {
    const headers = await db.headers.orderBy('date').toArray();
    
    let totalIncome = 0;
    let totalExpense = 0;
    const dailyMap = new Map<string, { income: number; expense: number }>();

    // Agregasi Data
    headers.forEach(h => {
      const dateStr = new Date(h.date).toLocaleDateString('id-ID');
      
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { income: 0, expense: 0 });
      }
      
      const dayStat = dailyMap.get(dateStr)!;

      if (h.type === 'INCOME') {
        totalIncome += h.totalAmount;
        dayStat.income += h.totalAmount;
      } else {
        totalExpense += h.totalAmount;
        dayStat.expense += h.totalAmount;
      }
    });

    // Format untuk Chart.js
    const sortedDates = Array.from(dailyMap.keys());
    
    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      recentTransactions: headers.slice(-5).reverse(), // 5 Terakhir
      chartData: {
        labels: sortedDates,
        income: sortedDates.map(d => dailyMap.get(d)!.income),
        expense: sortedDates.map(d => dailyMap.get(d)!.expense)
      }
    };
  },

  async getAllForExport() {
    const headers = await db.headers.orderBy('date').toArray();
    // Fetch details untuk laporan lengkap (opsional: bisa di-optimize dengan cursor)
    const exportData = [];
    
    for (const h of headers) {
      const details = await db.details.where('headerId').equals(h.id!).toArray();
      exportData.push({ header: h, details });
    }
    return exportData;
  }
};