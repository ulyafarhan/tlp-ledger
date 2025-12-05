<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { appStore } from '@/stores/useAppStore';
import { ReportGenerator } from '@/services/ReportGenerator';
import { TransactionLogic } from '@/services/TransactionLogic'; 
import { ExcelGenerator } from '@/services/ExcelGenerator';
import { formatRupiah } from '@/lib/format';
import { useRouter } from 'vue-router'; 
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Icons
import { 
  Calendar as CalendarIcon, Printer, FileSpreadsheet, 
  ChevronDown, Pencil, Trash2
} from 'lucide-vue-next';

// Date Handling (Shadcn UI uses @internationalized/date)
import { 
  DateFormatter, getLocalTimeZone, today, 
  type DateValue // Hapus CalendarDate karena tidak terpakai
} from '@internationalized/date';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RangeCalendar } from '@/components/ui/range-calendar';

// [FIX] Definisikan tipe DateRange secara eksplisit, HAPUS: import type { DateRange } from 'radix-vue';
interface DateRangeState {
  start: DateValue | undefined;
  end: DateValue | undefined;
}


const router = useRouter();

// === STATE & LOGIC ===
const isLoading = ref(false);
const showPreview = ref(false);
const reportData = ref<any[]>([]);

// State untuk DatePicker (menggunakan tipe yang telah diperbaiki)
const dateRange = ref<DateRangeState>({
  start: undefined,
  end: undefined,
})

// Formatter untuk tampilan UI (Button)
const uiDateFormatter = new DateFormatter('id-ID', { 
  day: 'numeric', month: 'short', year: 'numeric' 
});

// Helper: Konversi DateValue (Shadcn) ke Native JS Date (untuk Database/Logic)
const toNativeDate = (d: DateValue): Date => {
  return d.toDate(getLocalTimeZone());
};

// Computed: Ringkasan Total
const totalSummary = computed(() => {
  const income = reportData.value
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.totalAmount, 0);
    
  const expense = reportData.value
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.totalAmount, 0);
    
  return { income, expense, net: income - expense };
});

// === ACTIONS ===

const fetchReport = async () => {
  if (!dateRange.value.start || !dateRange.value.end) return;
  
  isLoading.value = true;
  try {
    // Konversi ke Native Date untuk dikirim ke Service
    const startDate = toNativeDate(dateRange.value.start);
    const endDate = toNativeDate(dateRange.value.end);
    
    // Set jam akhir hari agar mencakup seluruh transaksi hari itu
    endDate.setHours(23, 59, 59, 999);

    reportData.value = await ReportGenerator.getTransactionData(startDate, endDate);
    showPreview.value = true;
  } catch (error) {
    console.error("Gagal memuat laporan:", error);
    alert("Terjadi kesalahan saat memuat data.");
  } finally {
    isLoading.value = false;
  }
};

const handleEdit = (id: number) => {
  router.push({ path: '/input', query: { id: id.toString() } });
};

const handleDelete = async (id: number) => {
  if (confirm('Yakin ingin menghapus transaksi ini? Data tidak bisa dikembalikan.')) {
    try {
      await TransactionLogic.delete(id);
      await fetchReport(); // Refresh data setelah hapus
    } catch (e) {
      alert('Gagal menghapus data');
    }
  }
};

// Preset Tanggal (Hari Ini, Bulan Ini, dll)
const setPreset = (type: 'thisMonth' | 'lastMonth' | 'thisYear') => {
  const todayDate = today(getLocalTimeZone());
  
  if (type === 'thisMonth') {
    dateRange.value = { 
      start: todayDate.set({ day: 1 }), 
      end: todayDate 
    };
  } else if (type === 'lastMonth') {
    const startLastMonth = todayDate.subtract({ months: 1 }).set({ day: 1 });
    const endLastMonth = todayDate.set({ day: 1 }).subtract({ days: 1 });
    dateRange.value = { start: startLastMonth, end: endLastMonth };
  } else if (type === 'thisYear') {
    dateRange.value = { 
      start: todayDate.set({ month: 1, day: 1 }), 
      end: todayDate 
    };
  }
  
  // Otomatis fetch setelah pilih preset
  fetchReport();
};

const handleExportExcel = async () => {
  if (!dateRange.value.start || !dateRange.value.end) {
    alert("Pilih periode tanggal terlebih dahulu.");
    return;
  }
  
  const start = toNativeDate(dateRange.value.start);
  const end = toNativeDate(dateRange.value.end);
  // Pastikan end date mencakup sampai akhir hari
  end.setHours(23, 59, 59, 999);

  await ExcelGenerator.generateExcel(start, end);
};

const handlePrintPDF = () => {
  window.print();
};

// Lifecycle: Load data bulan ini saat pertama kali dibuka
onMounted(() => {
  setPreset('thisMonth');
});
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
                <span v-if="dateRange.start">
                  {{ uiDateFormatter.format(dateRange.start.toDate(getLocalTimeZone())) }} 
                  <span v-if="dateRange.end"> - {{ uiDateFormatter.format(dateRange.end.toDate(getLocalTimeZone())) }}</span>
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
                <Button size="sm" class="w-full bg-indigo-600 hover:bg-indigo-700" @click="fetchReport">
                  {{ isLoading ? 'Memuat...' : 'Terapkan' }}
                </Button>
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
              <span class="sm:inline">Cetak</span>
            </Button>
          </div>
        </div>
      </div>

      <div v-if="showPreview" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card class="bg-emerald-50 border-emerald-100 p-5 shadow-sm">
            <p class="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Pemasukan</p>
            <p class="text-2xl font-bold text-emerald-700 mt-1">{{ formatRupiah(totalSummary.income) }}</p>
          </Card>
          <Card class="bg-rose-50 border-rose-100 p-5 shadow-sm">
            <p class="text-xs font-semibold text-rose-600 uppercase tracking-wider">Pengeluaran</p>
            <p class="text-2xl font-bold text-rose-700 mt-1">{{ formatRupiah(totalSummary.expense) }}</p>
          </Card>
          <Card class="bg-indigo-50 border-indigo-100 p-5 shadow-sm">
            <p class="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Keuntungan Bersih</p>
            <p class="text-2xl font-bold text-indigo-700 mt-1">{{ formatRupiah(totalSummary.net) }}</p>
          </Card>
        </div>

        <Card class="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader class="bg-slate-50/50 py-4 border-b border-slate-100">
            <CardTitle class="text-base font-semibold text-slate-700">Rincian Transaksi</CardTitle>
          </CardHeader>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th class="h-10 px-6 text-left w-12 font-medium text-slate-500">No</th> 
                  <th class="h-10 px-6 text-left font-medium text-slate-500">Tanggal</th>
                  <th class="h-10 px-6 text-left font-medium text-slate-500">Keterangan</th>
                  <th class="h-10 px-6 text-right font-medium text-slate-500">Masuk</th>
                  <th class="h-10 px-6 text-right font-medium text-slate-500">Keluar</th>
                  <th class="h-10 px-6 text-center w-24 font-medium text-slate-500">Aksi</th> 
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr v-if="reportData.length === 0">
                  <td colspan="6" class="p-8 text-center text-slate-400">Tidak ada transaksi pada periode ini.</td>
                </tr>
                <tr v-for="(t, index) in reportData" :key="t.id" class="hover:bg-slate-50/50 group transition-colors">
                  <td class="p-4 px-6 text-slate-500">{{ index + 1 }}</td>
                  <td class="p-4 px-6 whitespace-nowrap text-slate-700">{{ format(new Date(t.date), 'dd/MM/yyyy') }}</td>
                  <td class="p-4 px-6">
                    <div class="font-medium text-slate-900">{{ t.items ? t.items.map((i: any) => i.itemName).join(', ') : '-' }}</div>
                    <div class="text-xs text-slate-500 mt-0.5" v-if="t.notes">"{{ t.notes }}"</div>
                  </td>
                  <td class="p-4 px-6 text-right font-mono text-emerald-600 font-medium">
                    {{ t.type === 'INCOME' ? formatRupiah(t.totalAmount) : '-' }}
                  </td>
                  <td class="p-4 px-6 text-right font-mono text-rose-600 font-medium">
                    {{ t.type === 'EXPENSE' ? formatRupiah(t.totalAmount) : '-' }}
                  </td>
                  
                  <td class="p-4 px-6 text-center">
                    <div class="flex items-center justify-center gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" @click="handleEdit(t.id)">
                        <Pencil class="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" @click="handleDelete(t.id)">
                        <Trash2 class="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>

    <div id="printable-area" class="hidden print:block bg-white text-black p-0 m-0 font-sans">
      
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
              {{ uiDateFormatter.format(dateRange.start.toDate(getLocalTimeZone())) }} - 
              {{ uiDateFormatter.format(dateRange.end.toDate(getLocalTimeZone())) }}
            </p>
          </div>
        </div>
      </div>

      <table class="w-full text-xs border-collapse mb-4">
        <thead>
          <tr class="border-b-2 border-black">
            <th class="py-2 text-left w-8">No</th>
            <th class="py-2 text-left w-24">Tanggal</th>
            <th class="py-2 text-left">Uraian / Keterangan</th>
            <th class="py-2 text-right w-28">Pemasukan</th>
            <th class="py-2 text-right w-28">Pengeluaran</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="(t, index) in reportData" :key="t.id">
            <td class="py-2 text-gray-500 align-top">{{ index + 1 }}</td>
            <td class="py-2 align-top">{{ format(new Date(t.date), 'dd/MM/yyyy') }}</td>
            <td class="py-2 align-top">
              <div class="font-bold text-gray-800">
                {{ t.items ? t.items.map((i: any) => i.itemName).join(', ') : '-' }}
              </div>
              <div class="text-[10px] text-gray-500">
                Kategori: {{ t.items ? t.items.map((i: any) => i.category).join(', ') : '' }}
                <span v-if="t.notes">({{ t.notes }})</span>
              </div>
            </td>
            <td class="py-2 text-right font-mono align-top text-gray-700">
              {{ t.type === 'INCOME' ? formatRupiah(t.totalAmount) : '-' }}
            </td>
            <td class="py-2 text-right font-mono align-top text-gray-700">
              {{ t.type === 'EXPENSE' ? formatRupiah(t.totalAmount) : '-' }}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="mt-4 border-t-2 border-black pt-4 break-inside-avoid">
        <div class="flex justify-end mb-2">
          <div class="w-1/2 flex justify-between text-sm">
            <span class="font-bold">TOTAL PEMASUKAN</span>
            <span class="font-mono">{{ formatRupiah(totalSummary.income) }}</span>
          </div>
        </div>
        <div class="flex justify-end mb-4">
          <div class="w-1/2 flex justify-between text-sm">
            <span class="font-bold">TOTAL PENGELUARAN</span>
            <span class="font-mono">{{ formatRupiah(totalSummary.expense) }}</span>
          </div>
        </div>
        
        <div class="flex justify-end">
          <div class="w-1/2 flex justify-between items-center bg-gray-100 p-3 border border-gray-300">
            <span class="font-bold text-base uppercase">Keuntungan Bersih</span>
            <span class="font-bold text-lg font-mono">
              {{ formatRupiah(totalSummary.net) }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex justify-end mt-16 break-inside-avoid">
        <div class="text-center w-48">
          <p class="text-xs text-gray-500 mb-16">Dicetak: {{ format(new Date(), 'dd MMM yyyy HH:mm', { locale: id }) }}</p>
          <p class="font-bold underline uppercase">{{ appStore.ownerName || 'Pemilik Toko' }}</p>
        </div>
      </div>

    </div>
  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
    height: 0;
    overflow: hidden;
  }
  #printable-area, #printable-area * {
    visibility: visible;
    height: auto;
    overflow: visible;
  }
  #printable-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white;
  }
  @page {
    size: A4;
    margin: 1.5cm;
  }
  .break-inside-avoid {
    page-break-inside: avoid;
  }
}
</style>