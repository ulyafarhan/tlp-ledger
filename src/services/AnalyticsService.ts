import { db } from '@/db';
import { startOfDay, subDays, subYears, format, isSameDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  recentTransactions: any[];
  // Chart data dipisah agar lebih fleksibel
}

export const AnalyticsService = {
  /**
   * Ambil Ringkasan Statistik & Transaksi Terbaru
   */
  async getDashboardData(): Promise<DashboardStats> {
    const headers = await db.headers.toArray();
    const details = await db.details.toArray();

    let totalIncome = 0;
    let totalExpense = 0;

    // 1. Hitung Total Akumulasi
    headers.forEach(t => {
      if (t.type === 'INCOME') {
        totalIncome += t.totalAmount;
      } else {
        totalExpense += t.totalAmount;
      }
    });

    // 2. Ambil 5 Transaksi Terakhir (Join Manual)
    const sortedHeaders = headers
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const recentTransactions = sortedHeaders.map(h => {
      // Gabungkan dengan detail untuk info tooltip/display jika perlu
      const myItems = details.filter(d => d.headerId === h.id);
      // Buat ringkasan nama item
      const itemSummary = myItems.map(i => i.itemName).join(', ');
      
      return {
        ...h,
        // Jika notes kosong, pakai nama item sebagai keterangan
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

  /**
   * Ambil Data Grafik Berdasarkan Periode
   */
  async getChartDataForPeriod(period: '7d' | '30d' | '1y') {
    const today = new Date();
    let startDate = new Date();

    // Tentukan Tanggal Mulai
    if (period === '7d') startDate = subDays(today, 7);
    else if (period === '30d') startDate = subDays(today, 30);
    else if (period === '1y') startDate = subYears(today, 1);

    // Ambil transaksi dalam rentang waktu
    const allHeaders = await db.headers.toArray();
    const filtered = allHeaders.filter(h => new Date(h.date) >= startOfDay(startDate));

    // Siapkan Array Tanggal (Label)
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    // Grouping Data per Hari/Bulan
    // Untuk 7d & 30d -> Harian
    // Untuk 1y -> Sebaiknya Bulanan (tapi untuk simplisitas kita buat harian dulu atau condensed)
    
    const dateMap = new Map<string, { income: number, expense: number }>();

    filtered.forEach(t => {
      // Format Key: YYYY-MM-DD
      const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { income: 0, expense: 0 });
      }

      const entry = dateMap.get(dateKey)!;
      if (t.type === 'INCOME') entry.income += t.totalAmount;
      else entry.expense += t.totalAmount;
    });

    // Sort Map keys (Tanggal)
    const sortedKeys = Array.from(dateMap.keys()).sort();

    sortedKeys.forEach(key => {
      // Format Label Grafik (misal: 05 Okt)
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