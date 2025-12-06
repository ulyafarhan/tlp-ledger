import { db } from '@/db';
import { startOfDay, subDays, subYears, format, isSameDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  recentTransactions: any[];
}

export const AnalyticsService = {
  async getDashboardData(): Promise<DashboardStats> {
    const headers = await db.headers.toArray();
    const details = await db.details.toArray();

    let totalIncome = 0;
    let totalExpense = 0;

    headers.forEach(t => {
      if (t.type === 'INCOME') {
        totalIncome += t.totalAmount;
      } else {
        totalExpense += t.totalAmount;
      }
    });

    const sortedHeaders = headers
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const recentTransactions = sortedHeaders.map(h => {
      const myItems = details.filter(d => d.headerId === h.id);
      const itemSummary = myItems.map(i => i.itemName).join(', ');
      
      return {
        ...h,
        notes: h.notes || itemSummary || 'Tanpa Keterangan', 
        items: myItems
      };
    });

    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      recentTransactions
    };
  },

  async getChartDataForPeriod(period: '7d' | '30d' | '1y') {
    const today = new Date();
    let startDate = new Date();

    if (period === '7d') startDate = subDays(today, 7);
    else if (period === '30d') startDate = subDays(today, 30);
    else if (period === '1y') startDate = subYears(today, 1);

    const allHeaders = await db.headers.toArray();
    const filtered = allHeaders.filter(h => new Date(h.date) >= startOfDay(startDate));

    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    const dateMap = new Map<string, { income: number, expense: number }>();

    filtered.forEach(t => {
      const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { income: 0, expense: 0 });
      }

      const entry = dateMap.get(dateKey)!;
      if (t.type === 'INCOME') entry.income += t.totalAmount;
      else entry.expense += t.totalAmount;
    });

    const sortedKeys = Array.from(dateMap.keys()).sort();

    sortedKeys.forEach(key => {
      const label = format(parseISO(key), 'dd MMM', { locale: id });
      labels.push(label);
      
      const data = dateMap.get(key)!;
      incomeData.push(data.income);
      expenseData.push(data.expense);
    });

    return {
      labels,
      income: incomeData,
      expense: expenseData
    };
  }
};