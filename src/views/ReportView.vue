<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { appStore } from '@/stores/useAppStore';
import { ReportGenerator } from '@/services/ReportGenerator';
import { formatRupiah } from '@/lib/format';
import { 
  Calendar as CalendarIcon, Printer, FileSpreadsheet, Filter, ChevronDown 
} from 'lucide-vue-next';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  DateFormatter, getLocalTimeZone, today, type DateValue 
} from '@internationalized/date';

// Shadcn UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { Badge } from '@/components/ui/badge';

// === STATE & LOGIC ===
const now = today(getLocalTimeZone());
const dateRange = ref({
  start: now.set({ day: 1 }), 
  end: now                    
});

const reportData = ref<any[]>([]);
const isLoading = ref(false);
const showPreview = ref(false);

const dateFormatter = new DateFormatter('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const toNativeDate = (d: DateValue) => d.toDate(getLocalTimeZone());

const totalSummary = computed(() => {
  const income = reportData.value.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.totalAmount, 0);
  const expense = reportData.value.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.totalAmount, 0);
  return { income, expense, net: income - expense };
});

// ACTIONS
const fetchReport = async () => {
  if (!dateRange.value.start || !dateRange.value.end) return;
  isLoading.value = true;
  try {
    const start = toNativeDate(dateRange.value.start);
    const end = toNativeDate(dateRange.value.end);
    end.setHours(23, 59, 59, 999);
    reportData.value = await ReportGenerator.getTransactionData(start, end);
    showPreview.value = true;
  } finally {
    isLoading.value = false;
  }
};

const setPreset = (type: 'thisMonth' | 'lastMonth' | 'thisYear') => {
  const todayDate = today(getLocalTimeZone());
  if (type === 'thisMonth') dateRange.value = { start: todayDate.set({ day: 1 }), end: todayDate };
  else if (type === 'lastMonth') {
    const lastMonth = todayDate.subtract({ months: 1 });
    dateRange.value = { start: lastMonth.set({ day: 1 }), end: todayDate.set({ day: 1 }).subtract({ days: 1 }) };
  } else if (type === 'thisYear') dateRange.value = { start: todayDate.set({ month: 1, day: 1 }), end: todayDate };
};

const handleExportExcel = async () => {
  if (!dateRange.value.start || !dateRange.value.end) return;
  const start = toNativeDate(dateRange.value.start);
  const end = toNativeDate(dateRange.value.end);
  const csv = await ReportGenerator.generateCSV(start, end);
  const fileName = `Laporan-${appStore.shopName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyyMMdd')}.csv`;
  ReportGenerator.downloadCSV(csv, fileName);
};

const handlePrintPDF = () => {
  window.print();
};

onMounted(fetchReport);
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 pb-24">
    
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 print:hidden">
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 class="text-xl font-bold tracking-tight text-slate-900">Laporan Keuangan</h2>
          <p class="text-xs text-slate-500">Rekapitulasi arus kas & laba rugi.</p>
        </div>

        <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" class="w-full sm:w-[260px] justify-start text-left font-normal bg-white border-slate-300">
                <CalendarIcon class="mr-2 h-4 w-4 text-slate-500" />
                <span v-if="dateRange.start && dateRange.end">
                  {{ dateFormatter.format(dateRange.start.toDate(getLocalTimeZone())) }} - 
                  {{ dateFormatter.format(dateRange.end.toDate(getLocalTimeZone())) }}
                </span>
                <span v-else>Pilih Periode</span>
                <ChevronDown class="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="end">
              <div class="flex items-center gap-2 p-2 border-b bg-slate-50/50">
                <Button variant="ghost" size="sm" class="text-xs h-7" @click="setPreset('thisMonth')">Bulan Ini</Button>
                <Button variant="ghost" size="sm" class="text-xs h-7" @click="setPreset('lastMonth')">Bulan Lalu</Button>
              </div>
              <RangeCalendar v-model="dateRange" initial-focus :number-of-months="1" class="p-2" />
              <div class="p-2 border-t flex justify-end">
                <Button size="sm" class="w-full bg-indigo-600 hover:bg-indigo-700" @click="fetchReport">Terapkan</Button>
              </div>
            </PopoverContent>
          </Popover>

          <div class="flex gap-2">
            <Button variant="outline" class="flex-1 sm:flex-none border-emerald-200 text-emerald-700 hover:bg-emerald-50" @click="handleExportExcel">
              <FileSpreadsheet class="w-4 h-4 sm:mr-2" />
              <span class="sm:inline">Excel</span>
            </Button>
            <Button variant="default" class="flex-1 sm:flex-none bg-slate-800 text-white hover:bg-slate-700" @click="handlePrintPDF">
              <Printer class="w-4 h-4 sm:mr-2" />
              <span class="sm:inline">Cetak / PDF</span>
            </Button>
          </div>
        </div>
      </div>

      <div v-if="showPreview" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card class="bg-emerald-50 border-emerald-100 p-5"><p class="text-xs font-semibold text-emerald-600">PEMASUKAN</p><p class="text-2xl font-bold text-emerald-700">{{ formatRupiah(totalSummary.income) }}</p></Card>
          <Card class="bg-rose-50 border-rose-100 p-5"><p class="text-xs font-semibold text-rose-600">PENGELUARAN</p><p class="text-2xl font-bold text-rose-700">{{ formatRupiah(totalSummary.expense) }}</p></Card>
          <Card class="bg-indigo-50 border-indigo-100 p-5"><p class="text-xs font-semibold text-indigo-600">KEUNTUNGAN BERSIH</p><p class="text-2xl font-bold text-indigo-700">{{ formatRupiah(totalSummary.net) }}</p></Card>
        </div>

        <Card class="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader class="bg-slate-50/50 py-4 border-b border-slate-50"><CardTitle class="text-base">Rincian Transaksi</CardTitle></CardHeader>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b">
                <tr>
                  <th class="h-10 px-6 text-left">Tanggal</th>
                  <th class="h-10 px-6 text-left">Keterangan</th>
                  <th class="h-10 px-6 text-right">Masuk</th>
                  <th class="h-10 px-6 text-right">Keluar</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="t in reportData" :key="t.id" class="hover:bg-slate-50/50">
                  <td class="p-4 px-6">{{ format(new Date(t.date), 'dd/MM/yyyy') }}</td>
                  <td class="p-4 px-6">
                    <div class="font-medium">{{ t.items ? t.items.map((i: any) => i.itemName).join(', ') : '-' }}</div>
                    <div class="text-xs text-slate-500" v-if="t.notes">"{{ t.notes }}"</div>
                  </td>
                  <td class="p-4 px-6 text-right font-mono text-emerald-600">{{ t.type === 'INCOME' ? formatRupiah(t.totalAmount) : '-' }}</td>
                  <td class="p-4 px-6 text-right font-mono text-rose-600">{{ t.type === 'EXPENSE' ? formatRupiah(t.totalAmount) : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>

    <div id="printable-area" class="hidden print:block bg-white text-black p-0 m-0">
      
      <div class="border-b-2 border-black pb-4 mb-6">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-2xl font-bold uppercase tracking-wide mb-1">{{ appStore.shopName || 'NAMA TOKO' }}</h1>
            <p class="text-sm text-gray-600">{{ appStore.address || 'Alamat Toko Belum Diatur' }}</p>
            <p class="text-sm text-gray-600">Telp: {{ appStore.phone || '-' }}</p>
          </div>
          <div class="text-right">
            <h2 class="text-xl font-bold text-gray-900">LAPORAN LABA RUGI</h2>
            <p class="text-sm text-gray-600 mt-1">Periode:</p>
            <p class="font-medium font-mono" v-if="dateRange.start && dateRange.end">
              {{ format(toNativeDate(dateRange.start), 'dd/MM/yyyy') }} - {{ format(toNativeDate(dateRange.end), 'dd/MM/yyyy') }}
            </p>
          </div>
        </div>
      </div>

      <table class="w-full text-xs border-collapse mb-2">
        <thead>
          <tr class="border-b border-black">
            <th class="py-1 text-left w-8">No</th>
            <th class="py-1 text-left w-20">Tanggal</th>
            <th class="py-1 text-left">Uraian / Keterangan</th>
            <th class="py-1 text-right w-24">Pemasukan</th>
            <th class="py-1 text-right w-24">Pengeluaran</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="(t, index) in reportData" :key="t.id">
            <td class="py-1 text-gray-500 align-top">{{ index + 1 }}</td>
            <td class="py-1 align-top">{{ format(new Date(t.date), 'dd/MM/yyyy') }}</td>
            <td class="py-1 align-top">
              <div class="font-bold text-gray-800">
                {{ t.items ? t.items.map((i: any) => i.itemName).join(', ') : '-' }}
              </div>
              <div class="text-[10px] text-gray-500">
                Kategori: {{ t.items ? t.items.map((i: any) => i.category).join(', ') : '' }}
              </div>
            </td>
            <td class="py-1 text-right font-mono align-top">
              {{ t.type === 'INCOME' ? formatRupiah(t.totalAmount).replace('Rp', '') : '-' }}
            </td>
            <td class="py-1 text-right font-mono align-top">
              {{ t.type === 'EXPENSE' ? formatRupiah(t.totalAmount).replace('Rp', '') : '-' }}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-4 border-t-2 border-black pt-2 break-inside-avoid">
        <div class="flex justify-end mb-1">
          <div class="w-1/2 flex justify-between text-sm">
            <span class="font-bold">TOTAL PEMASUKAN</span>
            <span class="font-mono">{{ formatRupiah(totalSummary.income) }}</span>
          </div>
        </div>
        <div class="flex justify-end mb-2">
          <div class="w-1/2 flex justify-between text-sm">
            <span class="font-bold">TOTAL PENGELUARAN</span>
            <span class="font-mono">{{ formatRupiah(totalSummary.expense) }}</span>
          </div>
        </div>
        
        <div class="flex justify-end">
          <div class="w-1/2 flex justify-between items-center bg-gray-100 p-2 border border-gray-300">
            <span class="font-bold text-base uppercase">Keuntungan / (Rugi) Bersih</span>
            <span class="font-bold text-lg font-mono">
              {{ formatRupiah(totalSummary.net) }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex justify-end mt-12 break-inside-avoid">
        <div class="text-center w-48">
          <p class="text-xs text-gray-600 mb-16">Dicetak: {{ format(new Date(), 'dd MMM yyyy HH:mm', { locale: id }) }}</p>
          <p class="font-bold underline uppercase">{{ appStore.ownerName || 'Pemilik Toko' }}</p>
        </div>
      </div>

    </div>
  </div>
</template>

<style>
/* CSS KHUSUS PRINT - LEVEL AGRESIF */
@media print {
  /* 1. Sembunyikan SEMUA elemen body */
  body * {
    visibility: hidden;
    height: 0; /* Cegah whitespace */
    overflow: hidden;
  }

  /* 2. Tampilkan HANYA container #printable-area dan isinya */
  #printable-area, #printable-area * {
    visibility: visible;
    height: auto;
    overflow: visible;
  }

  /* 3. Posisikan area print di pojok kiri atas mutlak */
  #printable-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    background: white;
  }

  /* 4. Reset Margin Halaman */
  @page {
    size: A4;
    margin: 1.5cm; /* Margin standar dokumen */
  }

  /* 5. Utility agar elemen tidak terpotong aneh */
  .break-inside-avoid {
    page-break-inside: avoid;
  }
}
</style>