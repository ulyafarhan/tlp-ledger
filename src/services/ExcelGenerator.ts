import ExcelJS from 'exceljs';
import { db } from '@/db';
import { appStore } from '@/stores/useAppStore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const ExcelGenerator = {
  /**
   * Fungsi utama untuk menghasilkan file Excel Profesional
   */
  async generateExcel(startDate: Date, endDate: Date) {
    // 1. Ambil & Siapkan Data
    const allHeaders = await db.headers.toArray();
    const allDetails = await db.details.toArray();
    
    // Filter by Date
    const transactions = allHeaders
      .filter(h => {
        const tDate = new Date(h.date);
        return tDate >= startDate && tDate <= endDate;
      })
      .map(header => {
        const myItems = allDetails.filter(d => d.headerId === header.id);
        return { ...header, items: myItems };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 2. Setup Workbook & Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Keuangan', {
      views: [{ showGridLines: false }] // Hilangkan gridlines default biar bersih
    });

    // 3. Setup Kolom & Lebar
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Tipe', key: 'type', width: 10 },
      { header: 'Uraian / Keterangan', key: 'desc', width: 40 },
      { header: 'Kategori', key: 'cat', width: 15 },
      { header: 'Pemasukan (Debet)', key: 'in', width: 20 },
      { header: 'Pengeluaran (Kredit)', key: 'out', width: 20 },
    ];

    // 4. HEADER & KOP SURAT (Styling Manual)
    // Judul Toko
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = (appStore.shopName || 'NAMA TOKO ANDA').toUpperCase();
    titleCell.font = { name: 'Arial', size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Sub Judul
    worksheet.mergeCells('A2:G2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = 'LAPORAN ARUS KAS & LABA RUGI';
    subtitleCell.font = { name: 'Arial', size: 12, bold: true };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Periode
    worksheet.mergeCells('A3:G3');
    const periodStr = `${format(startDate, 'dd MMMM yyyy', { locale: id })} s/d ${format(endDate, 'dd MMMM yyyy', { locale: id })}`;
    const periodCell = worksheet.getCell('A3');
    periodCell.value = `Periode: ${periodStr}`;
    periodCell.font = { name: 'Arial', size: 10, italic: true };
    periodCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Spasi
    worksheet.addRow([]);

    // 5. HEADER TABEL (Baris ke-5)
    const headerRow = worksheet.getRow(5);
    headerRow.values = ['No', 'Tanggal', 'Tipe', 'Nama Barang', 'Kategori', 'Pemasukan', 'Pengeluaran'];
    headerRow.height = 25;
    
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2F4F4F' } // Dark Slate Gray (Profesional)
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'medium' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    });

    // 6. ISI DATA
    let totalIncome = 0;
    let totalExpense = 0;
    let currentRowIdx = 6;

    transactions.forEach((t, index) => {
      const row = worksheet.getRow(currentRowIdx);
      
      const itemNames = t.items.map(i => i.itemName).join(', ');
      const categories = [...new Set(t.items.map(i => i.category))].join(', ');
      const fullDesc = itemNames;

      let income = 0;
      let expense = 0;

      if (t.type === 'INCOME') {
        income = t.totalAmount;
        totalIncome += t.totalAmount;
      } else {
        expense = t.totalAmount;
        totalExpense += t.totalAmount;
      }

      row.values = [
        index + 1,
        format(new Date(t.date), 'dd/MM/yyyy'),
        t.type === 'INCOME' ? 'Masuk' : 'Keluar',
        fullDesc,
        categories,
        income || '', // Kosongkan jika 0 agar bersih
        expense || ''
      ];

      // Styling Baris
      row.getCell(4).alignment = { wrapText: true, vertical: 'top', horizontal: 'left' }; // Kolom Deskripsi
      row.getCell(2).alignment = { vertical: 'top', horizontal: 'center' }; // Tanggal
      row.getCell(1).alignment = { vertical: 'top', horizontal: 'center' }; // No

      // Format Uang
      const moneyFormat = '#,##0';
      row.getCell(6).numFmt = moneyFormat;
      row.getCell(7).numFmt = moneyFormat;

      // Border Tipis untuk setiap sel
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
          right: { style: 'thin', color: { argb: 'FFD3D3D3' } }
        };
        cell.font = { name: 'Arial', size: 10 };
      });

      currentRowIdx++;
    });

    // 7. FOOTER (TOTAL)
    const totalRow = worksheet.getRow(currentRowIdx);
    totalRow.values = ['', '', '', 'TOTAL', '', totalIncome, totalExpense];
    totalRow.height = 30;

    // Styling Total
    totalRow.getCell(4).font = { bold: true, size: 11 };
    totalRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    
    [6, 7].forEach(colIdx => {
      const cell = totalRow.getCell(colIdx);
      cell.numFmt = '#,##0';
      cell.font = { bold: true, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F8FF' } }; // Alice Blue
      cell.border = { top: { style: 'double' }, bottom: { style: 'double' } };
    });

    // 8. SALDO BERSIH
    currentRowIdx++;
    const netRow = worksheet.getRow(currentRowIdx);
    const netProfit = totalIncome - totalExpense;
    
    // Gabungkan sel untuk label
    worksheet.mergeCells(`D${currentRowIdx}:E${currentRowIdx}`);
    netRow.getCell(4).value = 'KEUNTUNGAN BERSIH';
    netRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    netRow.getCell(4).font = { bold: true, color: { argb: 'FF555555' } };

    // Nilai Saldo (Gabung kolom F dan G agar besar)
    worksheet.mergeCells(`F${currentRowIdx}:G${currentRowIdx}`);
    const netCell = netRow.getCell(6);
    netCell.value = netProfit;
    netCell.numFmt = '"Rp "#,##0';
    netCell.font = { bold: true, size: 12, color: { argb: netProfit >= 0 ? 'FF006400' : 'FFFF0000' } }; // Hijau jika untung, Merah jika rugi
    netCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE0' } }; // Light Yellow
    netCell.alignment = { horizontal: 'center', vertical: 'middle' };
    netCell.border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } };
    netRow.height = 35;

    // 9. TANDA TANGAN
    currentRowIdx += 3;
    const signRow = worksheet.getRow(currentRowIdx);
    signRow.getCell(6).value = `Dicetak: ${format(new Date(), 'dd/MM/yyyy')}`;
    signRow.getCell(6).font = { italic: true, size: 9 };
    
    currentRowIdx += 1;
    worksheet.getCell(`F${currentRowIdx}`).value = 'Mengetahui,';
    
    currentRowIdx += 4;
    const ownerCell = worksheet.getCell(`F${currentRowIdx}`);
    ownerCell.value = `( ${appStore.ownerName || 'Pemilik'} )`;
    ownerCell.font = { bold: true, underline: true };

    // 10. GENERATE & DOWNLOAD
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `Laporan-${appStore.shopName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyyMMdd')}.xlsx`;
    
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
};