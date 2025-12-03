import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalyticsService } from './AnalyticsService';
import { formatRupiah } from '@/lib/format';
import { appStore } from '@/stores/useAppStore'; // [NEW] Import Store

export const generatePDFReport = async () => {
  const doc = new jsPDF();
  const rawData = await AnalyticsService.getAllForExport();

  // --- KOP SURAT DINAMIS ---
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(appStore.shopName.toUpperCase(), 14, 20); // Nama Toko

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${appStore.address} | ${appStore.phone}`, 14, 26); // Alamat & Telp
  doc.text(`Pemilik: ${appStore.ownerName}`, 14, 31);
  
  doc.setLineWidth(0.5);
  doc.line(14, 35, 196, 35); // Garis pemisah
  // -------------------------

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Laporan Keuangan Transaksi', 14, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 51);

  // ... (Sisa kode tabel autoTable tetap sama, hanya ubah startY jadi 60 agar tidak nabrak)
  const tableRows = rawData.map(row => {
     // ... logic mapping row sama ...
     const h = row.header;
     const items = row.details.map(d => `${d.itemName} (${d.quantity})`).join(', ');
     return [
      new Date(h.date).toLocaleDateString('id-ID'),
      h.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      items,
      h.notes || '-',
      formatRupiah(h.totalAmount)
    ];
  });

  autoTable(doc, {
    head: [['Tanggal', 'Tipe', 'Item Detail', 'Catatan', 'Total']],
    body: tableRows,
    startY: 60, // [NEW] Geser ke bawah
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  doc.save(`Laporan-${appStore.shopName.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
};