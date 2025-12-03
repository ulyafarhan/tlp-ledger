<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { Plus, Trash2, Save, Loader2, Wand2, Calendar as CalendarIcon, Coins } from 'lucide-vue-next'
import { db } from '@/db'
import { formatRupiah } from '@/lib/format'
import { useAI } from '@/composables/useAI'
import type { TransactionType } from '@/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { TransactionLogic } from '@/services/TransactionLogic';

// Shadcn Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const isSubmitting = ref(false)
const showAIDialog = ref(false)
const rawAIText = ref('')
const { processText, isProcessing: isAIProcessing, detectedMeta } = useAI();
// State Header
const dateValue = ref<Date | undefined>(new Date())

const header = reactive({
  type: 'EXPENSE' as TransactionType,
  notes: ''
})

const items = ref([
  { itemName: '', quantity: 1, pricePerUnit: 0, category: 'Umum' }
])

const CATEGORIES = ['Umum', 'Bahan Baku', 'Operasional', 'Gaji', 'Sewa', 'Marketing', 'Transportasi', 'Lainnya']

const grandTotal = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0)
})

const addItem = () => {
  items.value.push({ itemName: '', quantity: 1, pricePerUnit: 0, category: 'Umum' })
}

const removeItem = (index: number) => {
  if (items.value.length > 1) items.value.splice(index, 1)
}

const runAIParser = async () => {
  if (!rawAIText.value) return;
  try {
    const results = await processText(rawAIText.value);
    
    if (results.length > 0) {
      // 1. Update Items
      items.value = results.map((res: any) => ({
        itemName: res.itemName,
        quantity: res.quantity,
        pricePerUnit: res.price,
        category: 'Umum'
      }));

      // 2. Update Header (Tanggal & Tipe) dari Smart Parser
      if (detectedMeta.value.type) {
        header.type = detectedMeta.value.type; // Otomatis ganti ke Pemasukan
      }
      if (detectedMeta.value.date) {
        // Konversi Date ke format value Shadcn Calendar
        // (Pastikan Anda import DateValue dll dari @internationalized/date jika pakai versi baru)
        // Untuk simplifikasi logic ini, kita update ref dateValue
        dateValue.value = detectedMeta.value.date; 
      }

      // 3. Catatan Otomatis
      header.notes = `AI Input: "${rawAIText.value.substring(0, 30)}..."`;
      showAIDialog.value = false;
      rawAIText.value = '';
    } else {
      alert('AI belum mengenali pola.');
    }
  } catch (e) {
    alert('Gagal memproses AI');
  }
}

const submitTransaction = async () => {
  // Validasi
  if (items.value.some(i => !i.itemName)) return alert('Nama item wajib diisi!');
  if (!dateValue.value) return alert('Tanggal wajib diisi!');
  if (items.value.length === 0) return alert('Tidak ada item untuk disimpan.');
  
  isSubmitting.value = true;
  try {
    // [PERUBAHAN UTAMA] Gunakan Logic Pemisah
    // Kita kirim data header mentah dan array items
    const savedCount = await TransactionLogic.saveAsSeparateTransactions(
      {
        date: dateValue.value, // Ambil dari ref Date Picker
        type: header.type,
        notes: header.notes
      },
      items.value // Array item dari form
    );
    
    // Reset Form & Beri Feedback
    alert(`Berhasil! ${savedCount} transaksi telah disimpan terpisah.`);
    
    items.value = [{ itemName: '', quantity: 1, pricePerUnit: 0, category: 'Umum' }];
    header.notes = '';
    // Jangan reset tanggal (user friendly)
    
  } catch (e) {
    console.error(e);
    alert('Gagal menyimpan transaksi. Cek console.');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
    
    <Card class="border-t-4 shadow-sm" :class="header.type === 'INCOME' ? 'border-t-emerald-500' : 'border-t-rose-500'">
      <CardHeader class="pb-4">
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Data Transaksi</CardTitle>
            <CardDescription>Tentukan tanggal dan jenis transaksi.</CardDescription>
          </div>
          <Button variant="secondary" size="sm" class="hidden sm:flex bg-indigo-50 text-indigo-700 hover:bg-indigo-100" @click="showAIDialog = true">
            <Wand2 class="w-4 h-4 mr-2" />
            AI Magic Input
          </Button>
          <Button variant="outline" size="icon" class="sm:hidden" @click="showAIDialog = true">
            <Wand2 class="w-4 h-4 text-indigo-600" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent class="grid gap-6 md:grid-cols-2">
        <div class="space-y-2 flex flex-col">
          <Label>Tanggal</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                :class="cn(
                  'w-full justify-start text-left font-normal h-10',
                  !dateValue && 'text-muted-foreground'
                )"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                <span>{{ dateValue ? format(dateValue, 'PPP', { locale: id }) : "Pilih tanggal" }}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0 bg-white z-[100] border shadow-xl">
              <Calendar v-model="dateValue" initial-focus />
            </PopoverContent>
          </Popover>
        </div>

        <div class="space-y-2">
          <Label>Jenis Transaksi</Label>
          <Tabs v-model="header.type" class="w-full">
            <TabsList class="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="EXPENSE" class="data-[state=active]:bg-rose-100 data-[state=active]:text-rose-700 font-bold">
                Pengeluaran
              </TabsTrigger>
              <TabsTrigger value="INCOME" class="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 font-bold">
                Pemasukan
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
    </Card>

    <Card class="shadow-sm z-0 relative">
      <CardHeader class="flex flex-row items-center justify-between py-4 bg-slate-50/50 border-b">
        <div class="flex items-center gap-2">
          <Coins class="w-4 h-4 text-slate-500" />
          <h3 class="font-semibold text-sm text-slate-700">Rincian Item</h3>
        </div>
        <Badge variant="secondary">{{ items.length }} Baris</Badge>
      </CardHeader>
      
      <CardContent class="p-0">
        <div class="hidden md:grid grid-cols-12 gap-4 p-4 text-xs font-bold text-slate-500 border-b tracking-wider">
          <div class="col-span-4">NAMA BARANG</div>
          <div class="col-span-3">KATEGORI</div>
          <div class="col-span-2 text-center">QTY</div>
          <div class="col-span-3 text-right">HARGA (RP)</div>
        </div>

        <div class="divide-y divide-slate-100">
          <div v-for="(item, index) in items" :key="index" 
               class="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center hover:bg-slate-50/80 transition-all duration-200">
            
            <div class="md:col-span-4 w-full space-y-1.5">
              <Label class="md:hidden text-xs text-muted-foreground">Barang</Label>
              <Input v-model="item.itemName" placeholder="Nama item..." class="bg-white" />
            </div>

            <div class="md:col-span-3 w-full space-y-1.5">
              <Label class="md:hidden text-xs text-muted-foreground">Kategori</Label>
              <Select v-model="item.category">
                <SelectTrigger class="bg-white w-full">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent class="bg-white z-[100] border shadow-xl max-h-[200px]">
                  <SelectGroup>
                    <SelectItem 
                      v-for="cat in CATEGORIES" 
                      :key="cat" 
                      :value="cat"
                      class="cursor-pointer hover:bg-slate-100"
                    >
                      {{ cat }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div class="grid grid-cols-3 gap-3 w-full md:contents">
              <div class="col-span-1 md:col-span-2 space-y-1.5">
                <Label class="md:hidden text-xs text-muted-foreground">Qty</Label>
                <Input type="number" v-model="item.quantity" min="1" class="text-center bg-white" />
              </div>
              
              <div class="col-span-2 md:col-span-3 space-y-1.5">
                <Label class="md:hidden text-xs text-muted-foreground">Harga Satuan</Label>
                <div class="relative">
                  <span class="absolute left-3 top-2.5 text-xs text-muted-foreground font-medium">Rp</span>
                  <Input type="number" v-model="item.pricePerUnit" min="0" class="pl-8 text-right bg-white" />
                </div>
              </div>
            </div>

            <div class="col-span-1 md:hidden flex justify-between items-center mt-2 pt-2 border-t border-dashed">
              <span class="text-xs text-muted-foreground">Subtotal:</span>
              <span class="font-medium text-slate-900">{{ formatRupiah(item.quantity * item.pricePerUnit) }}</span>
            </div>

            <div class="absolute top-2 right-2 md:static md:col-span-12 md:flex md:justify-end md:-ml-12 pointer-events-none md:pointer-events-auto">
               <Button 
                  variant="ghost" 
                  size="icon" 
                  class="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 pointer-events-auto" 
                  @click="removeItem(index)" 
                  :disabled="items.length === 1"
               >
                  <Trash2 class="w-4 h-4" />
               </Button>
            </div>
          </div>
        </div>

        <div class="p-4 bg-slate-50/50 border-t">
          <Button variant="outline" size="sm" class="w-full border-dashed border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50" @click="addItem">
            <Plus class="w-4 h-4 mr-2" /> Tambah Baris Baru
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card class="bg-slate-900 text-white shadow-lg border-none">
      <CardContent class="p-6">
        <div class="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
          
          <div class="w-full md:w-1/2 space-y-2">
            <Label class="text-slate-400">Catatan</Label>
            <Textarea 
              v-model="header.notes" 
              placeholder="Contoh: Pesanan Bu Siti (Lunas)" 
              class="bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-600 resize-none focus-visible:ring-indigo-500 h-20"
            />
          </div>

          <div class="w-full md:w-1/2 flex flex-col items-end space-y-4">
            <div class="text-right">
              <p class="text-sm font-medium text-slate-400 mb-1">Total Estimasi</p>
              <div class="text-4xl font-bold tracking-tight text-white font-mono">
                {{ formatRupiah(grandTotal) }}
              </div>
            </div>
            <Button 
              size="lg" 
              class="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
              @click="submitTransaction" 
              :disabled="isSubmitting || grandTotal <= 0"
            >
              <Loader2 v-if="isSubmitting" class="w-5 h-5 mr-2 animate-spin" />
              <Save v-else class="w-5 h-5 mr-2" />
              Simpan Transaksi
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="showAIDialog">
      <DialogContent class="sm:max-w-[500px] bg-white z-[150]"> <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-xl">
            <Wand2 class="w-6 h-6 text-indigo-600" />
            AI Smart Input
          </DialogTitle>
          <DialogDescription class="text-base pt-2">
            Paste teks dari WhatsApp atau catatan kasar.
          </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <Textarea 
            v-model="rawAIText" 
            placeholder="Misal: Beli 2 sak semen 65rb" 
            class="h-40 text-base p-4 leading-relaxed bg-slate-50"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" @click="showAIDialog = false">Batal</Button>
          <Button @click="runAIParser" :disabled="isAIProcessing" class="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]">
            <Loader2 v-if="isAIProcessing" class="w-4 h-4 mr-2 animate-spin" />
            <span v-else>Proses Data</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>