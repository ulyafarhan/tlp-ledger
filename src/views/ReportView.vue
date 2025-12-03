<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { db } from '@/db';
import { generatePDFReport } from '@/services/ReportGenerator';
import { formatRupiah } from '@/lib/format';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Download, FileSpreadsheet, FileText, Search, ArrowUpDown } from 'lucide-vue-next';
import * as XLSX from 'xlsx';

// Shadcn UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const transactions = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');

// Load Data (Headers + Details Flattened for Table)
const loadData = async () => {
  loading.value = true;
  const headers = await db.headers.orderBy('date').reverse().toArray();
  
  // Kita hanya menampilkan Header di tabel utama agar tidak terlalu panjang
  // Detail bisa dilihat jika kita buat fitur expand (untuk fase berikutnya)
  transactions.value = headers;
  loading.value = false;
};

// Export to Excel Logic
const exportExcel = async () => {
  const data = await db.headers.toArray();
  const ws = XLSX.utils.json_to_sheet(data.map(d => ({
    Tanggal: format(new Date(d.date), 'dd/MM/yyyy'),
    Tipe: d.type,
    Catatan: d.notes,
    Total: d.totalAmount
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan Keuangan");
  XLSX.writeFile(wb, `Laporan-Keuangan-${Date.now()}.xlsx`);
};

onMounted(loadData);
</script>

<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
    
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h2 class="text-3xl font-bold tracking-tight text-slate-900">Laporan Keuangan</h2>
        <p class="text-muted-foreground">Arsip lengkap seluruh transaksi Anda.</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="exportExcel">
          <FileSpreadsheet class="w-4 h-4 mr-2 text-green-600" />
          Excel
        </Button>
        <Button @click="generatePDFReport" class="bg-indigo-600 hover:bg-indigo-700">
          <FileText class="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>

    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Riwayat Transaksi</CardTitle>
            <CardDescription>Menampilkan {{ transactions.length }} transaksi terbaru.</CardDescription>
          </div>
          <div class="relative w-full max-w-sm hidden md:block">
            <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari catatan..." class="pl-8" v-model="searchQuery" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow class="bg-slate-50">
                <TableHead class="w-[150px]">Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Catatan / Keterangan</TableHead>
                <TableHead class="text-right">Jumlah Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loading">
                <TableCell colspan="4" class="h-24 text-center">Memuat data...</TableCell>
              </TableRow>
              
              <TableRow v-else v-for="t in transactions" :key="t.id">
                <TableCell class="font-medium">
                  {{ format(new Date(t.date), 'dd MMM yyyy', { locale: id }) }}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" :class="t.type === 'INCOME' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'">
                    {{ t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran' }}
                  </Badge>
                </TableCell>
                <TableCell class="max-w-[300px] truncate text-muted-foreground">
                  {{ t.notes || '-' }}
                </TableCell>
                <TableCell class="text-right font-mono font-bold">
                  {{ formatRupiah(t.totalAmount) }}
                </TableCell>
              </TableRow>

              <TableRow v-if="!loading && transactions.length === 0">
                <TableCell colspan="4" class="h-24 text-center text-slate-500">
                  Belum ada data transaksi tersimpan.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>