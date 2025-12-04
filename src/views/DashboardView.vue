<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { AnalyticsService, type DashboardStats } from '@/services/AnalyticsService';
import { formatRupiah } from '@/lib/format';
import { 
  TrendingUp, TrendingDown, Wallet, 
  ArrowUpRight, ArrowDownLeft, CalendarClock, 
  Plus, Filter, ChevronDown, BarChart3, PieChart
} from 'lucide-vue-next';
import FinancialChart from '@/components/modules/FinancialChart.vue';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from 'vue-router'; 

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const router = useRouter();

// State
const stats = ref<DashboardStats | null>(null);
const loading = ref(true); // Loading untuk Summary Cards & List
const chartLoading = ref(true); // Loading khusus Chart

// Chart State
const chartPeriod = ref<'7d' | '30d' | '1y'>('30d');
const chartType = ref<'all' | 'income' | 'expense'>('all');
const rawChartData = ref<{ labels: string[], income: number[], expense: number[] }>({
  labels: [], income: [], expense: []
});

// 1. Load Dashboard Data (Stats & Recent Tx)
const loadStats = async () => {
  loading.value = true;
  try {
    // Simulasi delay kecil agar skeleton terlihat smooth
    await new Promise(resolve => setTimeout(resolve, 500));
    stats.value = await AnalyticsService.getDashboardData();
  } catch (e) {
    console.error("Gagal memuat statistik:", e);
  } finally {
    loading.value = false;
  }
};

// 2. Load Chart Data (Terpisah agar dinamis)
const updateChart = async (period: '7d' | '30d' | '1y') => {
  chartPeriod.value = period;
  chartLoading.value = true;
  try {
    rawChartData.value = await AnalyticsService.getChartDataForPeriod(period);
  } catch (e) {
    console.error("Gagal memuat grafik:", e);
  } finally {
    chartLoading.value = false;
  }
};

// 3. Filter Chart (Client-side filtering untuk tipe)
const filteredChartData = computed(() => {
  const { labels, income, expense } = rawChartData.value;
  
  if (!labels.length) return { labels: [], income: [], expense: [] };

  return {
    labels,
    income: chartType.value === 'expense' ? Array(labels.length).fill(0) : income,
    expense: chartType.value === 'income' ? Array(labels.length).fill(0) : expense,
  };
});

// Init
onMounted(() => {
  loadStats();
  updateChart('30d');
});
</script>

<template>
  <div class="min-h-screen w-full bg-slate-50/50 pb-24 overflow-x-hidden relative">
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div class="space-y-1">
          <h2 class="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
          <div class="flex items-center text-sm text-slate-500">
            <span class="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-600 mr-2">Pro</span>
            Pantau kesehatan finansial usaha Anda.
          </div>
        </div>

        <div class="hidden md:flex gap-2">
           <Button variant="outline" size="sm" class="bg-white" @click="loadStats">
             <CalendarClock class="w-3.5 h-3.5 mr-2 text-slate-500" />
             {{ format(new Date(), 'dd MMM yyyy', { locale: id }) }}
           </Button>
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-3">
        <Card class="relative overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 bg-white group hover:shadow-md transition-all">
          <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp class="w-16 h-16 text-emerald-500" />
          </div>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Pemasukan</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="space-y-2">
              <Skeleton class="h-8 w-3/4" />
              <Skeleton class="h-4 w-1/2" />
            </div>
            <div v-else>
              <div class="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                {{ formatRupiah(stats?.totalIncome || 0) }}
              </div>
              <p class="text-xs text-emerald-600 font-medium mt-2 flex items-center">
                <ArrowUpRight class="w-3 h-3 mr-1" />
                Akumulasi masuk
              </p>
            </div>
          </CardContent>
        </Card>

        <Card class="relative overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 bg-white group hover:shadow-md transition-all">
          <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown class="w-16 h-16 text-rose-500" />
          </div>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="loading" class="space-y-2">
              <Skeleton class="h-8 w-3/4" />
              <Skeleton class="h-4 w-1/2" />
            </div>
            <div v-else>
              <div class="text-3xl font-bold font-mono text-slate-900 tracking-tight">
                {{ formatRupiah(stats?.totalExpense || 0) }}
              </div>
              <p class="text-xs text-rose-600 font-medium mt-2 flex items-center">
                <ArrowDownLeft class="w-3 h-3 mr-1" />
                Biaya operasional
              </p>
            </div>
          </CardContent>
        </Card>

        <Card class="relative overflow-hidden bg-slate-900 text-white shadow-xl shadow-indigo-500/20 border-0">
          <div class="absolute inset-0 bg-gradient-to-r from-indigo-600 to-slate-900 opacity-50"></div>
          <div class="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <CardHeader class="pb-2 relative z-10">
            <div class="flex justify-between items-center">
              <CardTitle class="text-sm font-medium text-indigo-200 uppercase tracking-wider">Saldo Bersih</CardTitle>
              <Wallet class="w-5 h-5 text-indigo-300" />
            </div>
          </CardHeader>
          <CardContent class="relative z-10">
            <div v-if="loading" class="space-y-2">
              <Skeleton class="h-8 w-3/4 bg-slate-800" />
              <Skeleton class="h-4 w-1/2 bg-slate-800" />
            </div>
            <div v-else>
              <div class="text-3xl font-bold font-mono tracking-tight" :class="stats && stats.netProfit >= 0 ? 'text-white' : 'text-rose-300'">
                {{ formatRupiah(stats?.netProfit || 0) }}
              </div>
              <p class="text-xs text-indigo-200 mt-2">
                Saldo saat ini
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-6 lg:grid-cols-12">
        
        <Card class="lg:col-span-8 shadow-sm border-slate-200 overflow-hidden flex flex-col h-full">
          <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle class="text-lg text-slate-800 flex items-center gap-2">
                <BarChart3 class="w-5 h-5 text-indigo-600" />
                Analisis Tren
              </CardTitle>
              <CardDescription class="mt-1">Grafik arus kas harian.</CardDescription>
            </div>

            <div class="flex flex-col sm:flex-row gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" size="sm" class="h-8 gap-2 bg-white text-xs font-medium">
                    <span v-if="chartType === 'all'">Semua Data</span>
                    <span v-else-if="chartType === 'income'">Pemasukan</span>
                    <span v-else>Pengeluaran</span>
                    <ChevronDown class="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="chartType = 'all'">Semua Data</DropdownMenuItem>
                  <DropdownMenuItem @click="chartType = 'income'">Pemasukan</DropdownMenuItem>
                  <DropdownMenuItem @click="chartType = 'expense'">Pengeluaran</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div class="bg-slate-100 p-1 rounded-lg flex text-xs font-medium">
                <button @click="updateChart('7d')" class="px-3 py-1 rounded-md transition-all" :class="chartPeriod === '7d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'">7 Hari</button>
                <button @click="updateChart('30d')" class="px-3 py-1 rounded-md transition-all" :class="chartPeriod === '30d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'">30 Hari</button>
                <button @click="updateChart('1y')" class="px-3 py-1 rounded-md transition-all" :class="chartPeriod === '1y' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'">1 Tahun</button>
              </div>
            </div>
          </div>

          <CardContent class="p-0 flex-1 relative min-h-[380px]">
             <div v-if="chartLoading" class="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-[1px]">
               <div class="flex flex-col items-center">
                 <div class="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                 <p class="text-xs text-slate-500 mt-3 font-medium">Memuat grafik...</p>
               </div>
             </div>

             <div v-if="!chartLoading && filteredChartData.labels.length > 0" class="h-[380px] w-full p-4">
                <FinancialChart 
                  :labels="filteredChartData.labels"
                  :income-data="filteredChartData.income"
                  :expense-data="filteredChartData.expense"
                />
             </div>
             
             <div v-if="!chartLoading && filteredChartData.labels.length === 0" class="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                <div class="p-4 bg-slate-50 rounded-full shadow-sm mb-4">
                  <PieChart class="w-8 h-8 text-slate-300" />
                </div>
                <p class="text-sm font-medium">Data Visual Belum Tersedia</p>
                <p class="text-xs text-slate-400 mt-1">Data grafik akan muncul setelah Anda mengisi transaksi.</p>
             </div>
          </CardContent>
        </Card>

        <Card class="lg:col-span-4 shadow-sm border-slate-200 flex flex-col h-full overflow-hidden bg-white">
          <CardHeader class="pb-3 border-b border-slate-50">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <CardTitle class="text-base text-slate-800">Aktivitas</CardTitle>
                <CardDescription>Transaksi terbaru.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" class="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2" @click="router.push('/report')">
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent class="flex-1 p-0 overflow-y-auto max-h-[400px]">
            <div v-if="loading" class="p-6 space-y-6">
               <div v-for="i in 5" :key="i" class="flex items-center space-x-4">
                 <Skeleton class="h-10 w-10 rounded-full" />
                 <div class="space-y-2 w-full">
                   <Skeleton class="h-4 w-[60%]" />
                   <Skeleton class="h-3 w-[40%]" />
                 </div>
               </div>
            </div>
            
            <div v-else>
              <div v-if="stats?.recentTransactions && stats.recentTransactions.length > 0" class="divide-y divide-slate-50">
                <div 
                  v-for="t in stats.recentTransactions" 
                  :key="t.id" 
                  class="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group cursor-default"
                >
                  <div class="flex items-center gap-3 overflow-hidden min-w-0">
                    <div 
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all group-hover:scale-105 group-hover:shadow-sm"
                      :class="t.type === 'INCOME' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'"
                    >
                       <ArrowUpRight v-if="t.type === 'INCOME'" class="h-4 w-4" />
                       <ArrowDownLeft v-else class="h-4 w-4" />
                    </div>
                    
                    <div class="space-y-0.5 truncate min-w-0 flex-1">
                      <p class="text-sm font-medium leading-none truncate text-slate-700 group-hover:text-indigo-600 transition-colors">
                        {{ t.notes }}
                      </p>
                      <p class="text-[11px] text-slate-400 flex items-center">
                        {{ format(new Date(t.date), 'dd MMM • HH:mm', { locale: id }) }}
                      </p>
                    </div>
                  </div>

                  <div class="text-right pl-2 shrink-0">
                    <span 
                      class="font-mono font-bold text-sm whitespace-nowrap block" 
                      :class="t.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'"
                    >
                      {{ t.type === 'INCOME' ? '+' : '-' }}{{ formatRupiah(t.totalAmount) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div v-else class="flex flex-col items-center justify-center h-[300px] text-center p-6">
                <div class="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                  <CalendarClock class="h-5 w-5 text-slate-300" />
                </div>
                <p class="text-sm font-medium text-slate-500">Buku Kosong</p>
                <p class="text-xs text-slate-400 mt-1">Belum ada transaksi tercatat.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <div class="fixed bottom-6 right-6 z-50">
      <Button 
        size="icon" 
        class="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:shadow-[0_8px_35px_rgb(79,70,229,0.5)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center"
        @click="router.push('/input')"
      >
        <Plus class="h-7 w-7" />
      </Button>
    </div>

  </div>
</template>