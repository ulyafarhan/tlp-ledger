<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { AnalyticsService, type DashboardStats } from '@/services/AnalyticsService';
import { formatRupiah } from '@/lib/format';
import { RefreshCw, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, MoreHorizontal } from 'lucide-vue-next';
import FinancialChart from '@/components/modules/FinancialChart.vue';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { useRouter } from 'vue-router'; 
import { Plus } from 'lucide-vue-next';

// Shadcn UI
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const router = useRouter();
const stats = ref<DashboardStats | null>(null);
const loading = ref(true);

const loadData = async () => {
  loading.value = true;
  // Simulasi delay sedikit agar transisi skeleton terasa natural
  setTimeout(async () => {
    stats.value = await AnalyticsService.getDashboardData();
    loading.value = false;
  }, 600);
};

onMounted(loadData);
</script>

<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-bold tracking-tight text-slate-900">Ringkasan Bisnis</h2>
        <p class="text-muted-foreground">Pantau arus kas dan performa harian Anda.</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted-foreground hidden md:inline-block">Terakhir update: {{ format(new Date(), 'p', { locale: id }) }}</span>
        
        <Button variant="outline" size="sm" @click="loadData" :disabled="loading">
          <RefreshCw class="w-4 h-4 mr-2" :class="{'animate-spin': loading}" />
          Refresh
        </Button>

        <Button size="sm" class="bg-indigo-600 hover:bg-indigo-700 text-white" @click="router.push('/input')">
          <Plus class="w-4 h-4 mr-2" />
          Transaksi Baru
        </Button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <Card class="relative overflow-hidden">
        <div class="absolute right-0 top-0 h-full w-1 bg-emerald-500"></div>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-slate-600">Pemasukan</CardTitle>
          <div class="p-2 bg-emerald-100 rounded-full">
            <TrendingUp class="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-3/4" />
            <Skeleton class="h-4 w-1/2" />
          </div>
          <div v-else>
            <div class="text-2xl font-bold font-mono text-slate-900">{{ formatRupiah(stats?.totalIncome || 0) }}</div>
            <p class="text-xs text-muted-foreground mt-1">Total akumulasi tercatat</p>
          </div>
        </CardContent>
      </Card>

      <Card class="relative overflow-hidden">
        <div class="absolute right-0 top-0 h-full w-1 bg-rose-500"></div>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-slate-600">Pengeluaran</CardTitle>
          <div class="p-2 bg-rose-100 rounded-full">
            <TrendingDown class="h-4 w-4 text-rose-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-3/4" />
            <Skeleton class="h-4 w-1/2" />
          </div>
          <div v-else>
            <div class="text-2xl font-bold font-mono text-slate-900">{{ formatRupiah(stats?.totalExpense || 0) }}</div>
            <p class="text-xs text-muted-foreground mt-1">Total biaya operasional</p>
          </div>
        </CardContent>
      </Card>

      <Card class="bg-slate-900 text-white relative overflow-hidden shadow-lg shadow-indigo-500/10">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium text-slate-300">Saldo Bersih</CardTitle>
          <Wallet class="h-4 w-4 text-indigo-400" />
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-3/4 bg-slate-700" />
            <Skeleton class="h-4 w-1/2 bg-slate-700" />
          </div>
          <div v-else>
            <div class="text-3xl font-bold font-mono tracking-tight" :class="stats && stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'">
              {{ formatRupiah(stats?.netProfit || 0) }}
            </div>
            <p class="text-xs text-slate-400 mt-1">Cashflow tersedia</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 md:grid-cols-7">
      
      <Card class="col-span-1 md:col-span-4 shadow-sm">
        <CardHeader>
          <CardTitle>Trend Arus Kas</CardTitle>
          <CardDescription>Grafik perbandingan pemasukan dan pengeluaran.</CardDescription>
        </CardHeader>
        <CardContent class="pl-0">
           <div v-if="loading" class="h-[300px] flex items-center justify-center">
             <Skeleton class="h-[250px] w-[90%] rounded-xl" />
           </div>
           <div v-else-if="stats && stats.chartData.labels.length > 0">
              <FinancialChart 
                :labels="stats.chartData.labels"
                :income-data="stats.chartData.income"
                :expense-data="stats.chartData.expense"
              />
           </div>
           <div v-else class="h-[300px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl m-4">
              <div class="p-4 bg-slate-50 rounded-full mb-3">
                <TrendingUp class="w-6 h-6 text-slate-300" />
              </div>
              <p class="text-sm">Belum ada cukup data untuk grafik.</p>
           </div>
        </CardContent>
      </Card>

      <Card class="col-span-1 md:col-span-3 shadow-sm flex flex-col">
        <CardHeader>
          <CardTitle>Aktivitas Terakhir</CardTitle>
          <CardDescription>5 transaksi terbaru yang Anda input.</CardDescription>
        </CardHeader>
        <CardContent class="flex-1">
          <div v-if="loading" class="space-y-4">
             <div v-for="i in 5" :key="i" class="flex items-center space-x-4">
               <Skeleton class="h-10 w-10 rounded-full" />
               <div class="space-y-2 w-full">
                 <Skeleton class="h-4 w-[60%]" />
                 <Skeleton class="h-3 w-[40%]" />
               </div>
             </div>
          </div>
          
          <div v-else class="space-y-6">
            <div v-for="t in stats?.recentTransactions" :key="t.id" class="flex items-center justify-between group">
              <div class="flex items-center gap-4 overflow-hidden">
                <div 
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors group-hover:border-slate-300"
                  :class="t.type === 'INCOME' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'"
                >
                   <ArrowUpRight v-if="t.type === 'INCOME'" class="h-5 w-5 text-emerald-600" />
                   <ArrowDownLeft v-else class="h-5 w-5 text-rose-600" />
                </div>
                
                <div class="space-y-1 truncate">
                  <p class="text-sm font-medium leading-none truncate text-slate-900">
                    {{ t.notes || 'Transaksi Tanpa Catatan' }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ format(new Date(t.date), 'dd MMM yyyy', { locale: id }) }}
                  </p>
                </div>
              </div>

              <div 
                class="font-mono font-bold text-sm whitespace-nowrap" 
                :class="t.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'"
              >
                {{ t.type === 'INCOME' ? '+' : '-' }}{{ formatRupiah(t.totalAmount) }}
              </div>
            </div>
            
            <div v-if="!stats?.recentTransactions.length" class="text-center py-8">
              <p class="text-sm text-slate-400">Belum ada transaksi.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>