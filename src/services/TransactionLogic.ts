import { db } from '@/db';

export const TransactionLogic = {
  /**
   * MODE PEMECAH (SPLIT MODE)
   * Mengubah 1 Form dengan 5 Item menjadi 5 Transaksi Terpisah di Database.
   */
  async saveAsSeparateTransactions(
    headerData: { date: Date; type: 'INCOME' | 'EXPENSE'; notes: string },
    items: any[]
  ) {
    // Kita gunakan Transaction API dari Dexie agar atomic (semua sukses atau semua batal)
    return db.transaction('rw', db.headers, db.details, async () => {
      const promises = items.map(async (item, index) => {
        
        // 1. Hitung Total per Item ini saja
        const itemTotal = item.quantity * item.pricePerUnit;
        
        // 2. Modifikasi Catatan agar unik (Opsional, agar user tau ini pecahan)
        // Jika user mengisi note "Belanja Toko", item 1 jadi "Belanja Toko (Semen)"
        let splitNote = headerData.notes;
        if (item.itemName) {
            splitNote = splitNote ? `${splitNote} - ${item.itemName}` : item.itemName;
        }

        // 3. Simpan HEADER baru untuk setiap item
        const headerId = await db.headers.add({
          date: headerData.date,
          type: headerData.type,
          totalAmount: itemTotal, // Total header = Total item ini saja
          notes: splitNote,
          createdAt: new Date()
        });

        // 4. Simpan DETAIL (tetap kita simpan strukturnya untuk konsistensi data)
        await db.details.add({
          headerId: Number(headerId),
          itemName: item.itemName,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          totalPrice: itemTotal,
          category: item.category
        });
      });

      await Promise.all(promises);
      return items.length; // Mengembalikan jumlah transaksi yang berhasil dibuat
    });
  }
};