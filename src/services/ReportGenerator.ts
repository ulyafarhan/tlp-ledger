import { db } from '@/db';
import { appStore } from '@/stores/useAppStore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const ReportGenerator = {
  /**
   * [FIXED] Mengambil data gabungan (Header + Items)
   * Mengatasi error 'undefined reading toArray' karena db.transactions tidak ada.
   */
  async getTransactionData(startDate: Date, endDate: Date) {
    // 1. Ambil data dari tabel headers dan details terpisah
    const allHeaders = await db.headers.toArray();
    const allDetails = await db.details.toArray();
    
    // 2. Filter Header berdasarkan rentang tanggal
    const filteredHeaders = allHeaders.filter(h => {
      const tDate = new Date(h.date);
      return tDate >= startDate && tDate <= endDate;
    });

    // 3. GABUNGKAN (JOIN): Header + Details
    // Agar struktur data sesuai dengan yang diharapkan View (ada properti .items)
    const transactions = filteredHeaders.map(header => {
        // Cari detail barang yang punya headerId ini
        const myItems = allDetails.filter(d => d.headerId === header.id);
        return {
            ...header,
            items: myItems // Tempelkan array items ke objek transaksi
        };
    });

    // 4. Urutkan berdasarkan tanggal (Terlama -> Terbaru)
    return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  /**
   * GENERATE EXCEL (CSV) YANG RAPI
   */
  async generateCSV(startDate: Date, endDate: Date) {
    // Panggil fungsi getTransactionData yang sudah diperbaiki di atas
    const transactions = await this.getTransactionData(startDate, endDate);
    
    const shopName = appStore.shopName || 'Toko Saya';
    const ownerName = appStore.ownerName || 'Pemilik';
    const periodStr = `${format(startDate, 'dd MMM yyyy', { locale: id })} - ${format(endDate, 'dd MMM yyyy', { locale: id })}`;

    // 1. KOP SURAT
    let csvContent = `DATA LAPORAN KEUANGAN\n`;
    csvContent += `${shopName.toUpperCase()}\n`;
    csvContent += `PERIODE: ${periodStr}\n`;
    csvContent += `Dicetak pada: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}\n\n`;

    // 2. HEADER TABEL
    csvContent += `No,Tanggal,Tipe,Keterangan / Item,Kategori,Pemasukan (Debet),Pengeluaran (Kredit)\n`;

    // 3. ISI DATA
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((t, index) => {
      const date = format(new Date(t.date), 'dd/MM/yyyy');
      
      // Gabungkan nama item untuk kolom keterangan
      // Pastikan t.items ada (berkat perbaikan di atas)
      const desc = t.items ? t.items.map(i => i.itemName).join(' + ') : 'Item dihapus'; 
      const safeDesc = `"${desc} ${t.notes ? '(' + t.notes + ')' : ''}"`; // Escape koma
      const category = t.items ? `"${t.items.map(i => i.category).join(', ')}"` : 'Umum';
      
      let debit = 0;
      let credit = 0;

      if (t.type === 'INCOME') {
        debit = t.totalAmount;
        totalIncome += t.totalAmount;
      } else {
        credit = t.totalAmount;
        totalExpense += t.totalAmount;
      }

      csvContent += `${index + 1},${date},${t.type},${safeDesc},${category},${debit},${credit}\n`;
    });

    // 4. FOOTER (TOTAL)
    csvContent += `,,,,TOTAL,${totalIncome},${totalExpense}\n`;
    csvContent += `,,,,SALDO BERSIH,${totalIncome - totalExpense},\n`;
    csvContent += `\n\n`;
    csvContent += `Mengetahui,\n\n\n\n`;
    csvContent += `(${ownerName})`;

    return csvContent;
  },

  downloadCSV(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};