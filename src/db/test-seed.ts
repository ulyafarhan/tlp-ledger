import { db } from './index';

export async function seedDummyData() {
  try {
    const id = await db.saveTransaction({
      header: {
        date: new Date(),
        type: 'EXPENSE',
        totalAmount: 0, // Akan dihitung ulang otomatis
        notes: 'Belanja stok awal'
      },
      details: [
        { itemName: 'Beras 5kg', quantity: 2, pricePerUnit: 65000, category: 'Bahan Baku', totalPrice: 0 },
        { itemName: 'Minyak Goreng', quantity: 5, pricePerUnit: 14000, category: 'Bahan Baku', totalPrice: 0 }
      ]
    });
    console.log(`[DB Success] Transaksi dummy tersimpan dengan ID: ${id}`);
  } catch (error) {
    console.error('[DB Error] Gagal menyimpan data:', error);
  }
}