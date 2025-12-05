<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import { 
  Plus, Trash2, Save, Loader2, Wand2, Calendar as CalendarIcon, 
  Package, StickyNote, Receipt, Sparkles, BadgeCheck 
} from 'lucide-vue-next'
import { formatRupiah } from '@/lib/format'
import { useAI } from '@/composables/useAI'
import type { TransactionType } from '@/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { TransactionLogic } from '@/services/TransactionLogic';
import { 
  getLocalTimeZone, 
  today, 
  type DateValue,
  fromDate 
} from '@internationalized/date'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

const route = useRoute();
const router = useRouter();

const isSubmitting = ref(false)
const isDeleting = ref(false)
const showAIDialog = ref(false)
const rawAIText = ref('')
const { processText, isProcessing: isAIProcessing, detectedMeta } = useAI();

const editId = ref<number | null>(null);

const dateValue = ref<DateValue | undefined>(today(getLocalTimeZone()))
const dateValueJs = computed(() => {
  return dateValue.value ? dateValue.value.toDate(getLocalTimeZone()) : undefined
})

const header = reactive({
  type: 'EXPENSE' as TransactionType,
  notes: ''
})

const items = ref([
  { itemName: '', quantity: 1, pricePerUnit: 0, category: 'Umum' }
])

const CATEGORIES = ['Umum', 'Bahan Baku', 'Operasional', 'Gaji', 'Sewa', 'Marketing', 'Transportasi', 'Lainnya']
const aiExamples = ["2 sak semen 65rb", "Jual nasi goreng 15k 2 porsi", "3 kg paku 15rb", "Beli bensin 2 liter 10k"]

const grandTotal = computed(() => {
  return items.value.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0)
})

const suggestedNote = computed(() => {
  if (!items.value[0].itemName) return 'Lengkapi item untuk saran.';
  const cats = [...new Set(items.value.map(i => i.category))].join(', ');
  if (header.type === 'INCOME') return `Pendapatan: ${items.value[0].itemName} dkk.`;
  return `Pengeluaran ${cats}: ${items.value[0].itemName}...`;
});

const applySuggestion = () => {
  if (suggestedNote.value) header.notes = suggestedNote.value;
};

const checkEditMode = async () => {
  const queryId = route.query.id;
  
  if (queryId) {
    try {
      const id = Number(queryId);
      const data = await TransactionLogic.loadForEdit(id);
      
      if (!data || !data.header) throw new Error("Data tidak ditemukan");

      editId.value = id;
      header.type = data.header.type;
      header.notes = data.header.notes || '';
      
      try {
        dateValue.value = fromDate(new Date(data.header.date), getLocalTimeZone());
      } catch (e) {
        dateValue.value = today(getLocalTimeZone());
      }

      if (data.details && data.details.length > 0) {
        items.value = data.details.map(d => ({
          itemName: d.itemName,
          quantity: Number(d.quantity),
          pricePerUnit: Number(d.pricePerUnit),
          category: d.category || 'Umum'
        }));
      }

    } catch (e) {
      console.error("Gagal load edit:", e);
      router.replace('/input');
      resetForm();
    }
  } else {
    resetForm();
  }
};

const resetForm = () => {
  editId.value = null;
  items.value = [{ itemName: '', quantity: 1, pricePerUnit: 0, category: 'Umum' }];
  header.notes = '';
  header.type = 'EXPENSE';
  dateValue.value = today(getLocalTimeZone());
};

onMounted(checkEditMode);
watch(() => route.query.id, checkEditMode);

const addItem = () => items.value.push({ itemName: '', quantity: 1, pricePerUnit: 0, category: 'Umum' })
const removeItem = (index: number) => { if (items.value.length > 1) items.value.splice(index, 1) }
const useExample = (text: string) => rawAIText.value = text

const runAIParser = async () => {
  if (!rawAIText.value) return;
  try {
    const results = await processText(rawAIText.value);
    
    if (results && results.length > 0) {
      items.value = results.map((res: any) => {
        const qty = Number(res.quantity) || 1;
        const totalOrUnit = Number(res.price) || 0;
        
        // AI Logic: Jika price besar (misal 50.000) dan qty 2, asumsikan itu harga total jika dari NaiveBayes
        // Tapi kita buat aman: Harga AI biasanya per konteks.
        // Di sini kita set pricePerUnit.
        const pricePerUnit = totalOrUnit / qty; 

        return {
          itemName: res.itemName,
          quantity: qty,
          pricePerUnit: pricePerUnit > 0 ? pricePerUnit : 0, 
          category: 'Umum'
        };
      });

      if (detectedMeta.value.type) header.type = detectedMeta.value.type;
      if (detectedMeta.value.date) dateValue.value = fromDate(detectedMeta.value.date, getLocalTimeZone());
      
      header.notes = `AI Input: "${rawAIText.value.substring(0, 30)}..."`;
      showAIDialog.value = false;
      rawAIText.value = '';
    } else {
      alert('AI belum mengenali pola. Silakan input manual.');
    }
  } catch (e) {
    console.error(e);
    alert('Gagal memproses AI');
  }
}

const submitTransaction = async () => {
  if (items.value.some(i => !i.itemName)) return alert('Nama item wajib diisi!');
  if (!dateValue.value) return alert('Tanggal wajib diisi!');
  if (items.value.length === 0) return alert('Tidak ada item.');
  
  isSubmitting.value = true;
  try {
    const finalDate = dateValue.value.toDate(getLocalTimeZone());

    // --- PERBAIKAN INTI: Mapping Item dan Menambahkan Field 'totalPrice' ---
    const finalDetails = items.value.map(item => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.pricePerUnit) || 0;
        
        return {
            itemName: item.itemName,
            quantity: qty,
            pricePerUnit: price,
            category: item.category,
            totalPrice: qty * price 
        };
    });
    // --- AKHIR PERBAIKAN INTI ---

    await TransactionLogic.saveOrUpdate(
      {
        header: {
          date: finalDate,
          type: header.type,
          notes: header.notes,
          totalAmount: grandTotal.value
        },
        details: finalDetails // Menggunakan array finalDetails yang sudah lengkap
      },
      editId.value || undefined
    );
    
    if (editId.value) {
      router.push('/report'); 
    } else {
      resetForm();
    }
  } catch (e) {
    console.error(e);
    alert('Gagal menyimpan transaksi.');
  } finally {
    isSubmitting.value = false;
  }
}

const deleteTransaction = async () => {
  if (!editId.value) return;
  if (!confirm('Yakin ingin MENGHAPUS transaksi ini permanen?')) return;

  isDeleting.value = true;
  try {
    await TransactionLogic.delete(editId.value);
    router.push('/report');
  } catch (e) {
    alert('Gagal menghapus data.');
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 pb-36 pt-6">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
            {{ editId ? 'Edit Transaksi' : 'Input Transaksi' }}
          </h1>
          <p class="text-slate-500 text-sm">
            {{ editId ? 'Perbaiki data transaksi lama.' : 'Catat detail transaksi baru.' }}
          </p>
        </div>
        
        <Button 
          v-if="!editId"
          variant="outline" 
          class="bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
          @click="showAIDialog = true"
        >
          <Wand2 class="w-4 h-4 mr-2" />
          AI Magic Input
        </Button>
      </div>

      <div class="grid gap-6">
        
        <Card class="border-slate-200 shadow-sm overflow-hidden">
          <div class="h-1.5 w-full" :class="header.type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'"></div>
          <CardContent class="p-6">
            <div class="grid gap-6 md:grid-cols-2">
              
              <div class="space-y-3">
                <Label class="text-slate-600 font-medium">Jenis Transaksi</Label>
                <Tabs v-model="header.type" class="w-full">
                  <TabsList class="grid w-full grid-cols-2 h-11 bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger value="EXPENSE" class="rounded-md data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm data-[state=active]:font-semibold transition-all duration-200">
                      Pengeluaran
                    </TabsTrigger>
                    <TabsTrigger value="INCOME" class="rounded-md data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm data-[state=active]:font-semibold transition-all duration-200">
                      Pemasukan
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div class="space-y-3">
                <Label class="text-slate-600 font-medium">Tanggal Transaksi</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button variant="outline" :class="cn('w-full justify-start text-left font-normal h-11 border-slate-200 bg-white hover:bg-slate-50', !dateValue && 'text-muted-foreground')">
                      <CalendarIcon class="mr-2 h-4 w-4 text-slate-500" />
                      <span class="text-slate-700">{{ dateValueJs ? format(dateValueJs, 'PPP', { locale: id }) : "Pilih tanggal" }}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0 bg-white z-[50]" align="start">
                    <Calendar v-model:value="dateValue" initial-focus /> 
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="border-slate-200 shadow-sm">
          <CardHeader class="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 py-4">
            <div class="flex items-center gap-2">
              <div class="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm">
                <Package class="w-4 h-4 text-slate-600" />
              </div>
              <h3 class="font-semibold text-slate-700">Rincian Barang</h3>
            </div>
            <Badge variant="secondary" class="bg-white border border-slate-200 text-slate-600 font-mono">
              {{ items.length }} Item
            </Badge>
          </CardHeader>
          
          <CardContent class="p-0">
            <div class="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-slate-500 bg-white border-b border-slate-100 tracking-wide uppercase">
              <div class="col-span-5">Nama Item</div>
              <div class="col-span-3">Kategori</div>
              <div class="col-span-2 text-center">Qty</div>
              <div class="col-span-2 text-right">Harga Satuan</div>
            </div>

            <div class="divide-y divide-slate-100">
              <div v-for="(item, index) in items" :key="index" class="group px-4 sm:px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center hover:bg-slate-50 transition-colors duration-200 relative">
                
                <div class="md:col-span-5 w-full">
                  <Label class="md:hidden text-xs text-slate-500 mb-1.5 block">Nama Barang</Label>
                  <Input v-model="item.itemName" placeholder="Contoh: Semen Gresik" class="h-10 border-slate-200 bg-white" />
                </div>

                <div class="md:col-span-3 w-full">
                  <Label class="md:hidden text-xs text-slate-500 mb-1.5 block">Kategori</Label>
                  <Select v-model="item.category">
                    <SelectTrigger class="h-10 border-slate-200 bg-white"><SelectValue placeholder="Kategori" /></SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div class="grid grid-cols-2 gap-4 w-full md:contents">
                  <div class="md:col-span-2">
                    <Label class="md:hidden text-xs text-slate-500 mb-1.5 block">Jumlah</Label>
                    <div class="relative">
                      <Input type="number" v-model="item.quantity" min="1" class="h-10 text-center border-slate-200 bg-white font-mono" />
                      <span class="absolute right-3 top-2.5 text-xs text-slate-400 md:hidden">Pcs</span>
                    </div>
                  </div>
                  <div class="md:col-span-2">
                    <Label class="md:hidden text-xs text-slate-500 mb-1.5 block">Harga</Label>
                    <div class="relative">
                      <span class="absolute left-3 top-2.5 text-xs font-semibold text-slate-500">Rp</span>
                      <Input type="number" v-model="item.pricePerUnit" min="0" class="h-10 pl-8 text-right border-slate-200 bg-white font-mono font-medium" />
                    </div>
                  </div>
                </div>

                <div class="absolute top-2 right-2 md:static md:col-span-12 md:flex md:justify-end md:-ml-10">
                   <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50" @click="removeItem(index)" :disabled="items.length === 1">
                      <Trash2 class="w-4 h-4" />
                   </Button>
                </div>
              </div>
            </div>

            <div class="p-4 bg-slate-50/30 border-t border-slate-100">
              <Button variant="outline" size="sm" class="w-full border-dashed border-slate-300 text-slate-500 hover:border-indigo-500 hover:text-indigo-600" @click="addItem">
                <Plus class="w-4 h-4 mr-2" /> Tambah Item Baru
              </Button>
            </div>
          </CardContent>
        </Card>

        <div class="grid md:grid-cols-2 gap-6">
          <Card class="border-slate-200 shadow-sm h-full">
            <CardHeader class="pb-3 pt-5 px-6">
              <CardTitle class="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <StickyNote class="w-4 h-4 text-slate-400" /> Catatan
              </CardTitle>
            </CardHeader>
            <CardContent class="px-6 pb-6">
              <div v-if="suggestedNote !== 'Lengkapi item untuk saran.'" class="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-800 text-xs font-medium mb-4 flex justify-between items-center">
                <p>Saran AI: {{ suggestedNote }}</p>
                <Button variant="ghost" size="sm" @click="applySuggestion" class="text-indigo-600 hover:bg-indigo-100 h-7 px-2 text-xs">Pakai</Button>
              </div>
              <Textarea v-model="header.notes" class="min-h-[120px] bg-slate-50 border-slate-200 resize-none focus-visible:ring-indigo-500" />
            </CardContent>
          </Card>

          <Card class="border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col">
            <CardHeader class="pb-3 pt-5 px-6 border-b border-slate-50">
              <CardTitle class="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Receipt class="w-4 h-4 text-slate-400" /> Ringkasan
              </CardTitle>
            </CardHeader>
            <CardContent class="flex-1 px-6 py-6 flex flex-col justify-center space-y-4">
              <div class="flex justify-between items-center text-sm text-slate-500">
                <span>Total Item</span><span>{{ items.length }} Baris</span>
              </div>
              <Separator />
              <div class="flex justify-between items-end">
                <span class="text-base font-medium text-slate-600 mb-1">Total Estimasi</span>
                <span class="text-3xl font-bold font-mono tracking-tight" :class="header.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'">
                  {{ formatRupiah(grandTotal) }}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
        
        <div v-if="editId">
          <Button 
            variant="ghost" 
            size="sm" 
            class="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            @click="deleteTransaction"
            :disabled="isDeleting"
          >
            <Trash2 class="w-4 h-4 mr-2" />
            {{ isDeleting ? 'Menghapus...' : 'Hapus' }}
          </Button>
        </div>
        <div v-else></div> 
        
        <div class="flex items-center gap-3">
          <div class="flex flex-col items-end mr-2">
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Akhir</span>
            <span class="text-lg font-bold text-slate-900 font-mono leading-none">{{ formatRupiah(grandTotal) }}</span>
          </div>
          
          <Button size="lg" class="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg min-w-[140px]" @click="submitTransaction" :disabled="isSubmitting || grandTotal <= 0">
            <Loader2 v-if="isSubmitting" class="w-5 h-5 mr-2 animate-spin" />
            <Save v-else class="w-5 h-5 mr-2" />
            {{ isSubmitting ? 'Menyimpan...' : (editId ? 'Update' : 'Simpan') }}
          </Button>
        </div>
      </div>
    </div>

    <Dialog v-model:open="showAIDialog">
      <DialogContent class="sm:max-w-lg w-full p-0 overflow-hidden gap-0 bg-white border-0 shadow-2xl z-[150] rounded-3xl border border-slate-100 shadow-xl"> 
        <div class="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative overflow-hidden">
          <div class="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
          <DialogTitle class="flex items-center gap-2 text-xl font-bold relative z-10"><Sparkles class="w-5 h-5 text-yellow-300" /> AI Magic Input</DialogTitle>
          <DialogDescription class="text-indigo-100 mt-2 relative z-10 text-sm leading-relaxed">Ketik atau tempel (paste) catatan transaksi Anda secara bebas.</DialogDescription>
        </div>
        <div class="p-6 space-y-5">
          <div class="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-800 text-xs font-medium space-y-1">
            <p class="font-semibold flex items-center gap-1"><BadgeCheck class="w-3.5 h-3.5 text-indigo-600" /> Tips Akurasi Maksimal:</p>
            <p>Gunakan format: <code class="bg-indigo-100 px-1 py-0.5 rounded text-xs font-mono">2 sak semen 65rb</code> (QTY + ITEM + HARGA).</p>
          </div>
          <div class="relative group">
            <Textarea v-model="rawAIText" placeholder="Contoh: Beli 2 sak semen 65rb dan 1kg paku 15rb buat proyek Pak Budi" class="min-h-[160px] text-base p-4 leading-relaxed bg-slate-50 border-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl" />
            <div class="absolute bottom-3 right-3 text-[10px] text-slate-400">{{ rawAIText.length }} Karakter</div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button v-for="(ex, i) in aiExamples" :key="i" @click="useExample(ex)" class="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent rounded-full text-xs text-slate-600 transition-all cursor-pointer">{{ ex }}</button>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <Button variant="ghost" @click="showAIDialog = false" class="text-slate-500">Batal</Button>
            <Button @click="runAIParser" :disabled="isAIProcessing || !rawAIText" class="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px] shadow-md">
              <Loader2 v-if="isAIProcessing" class="w-4 h-4 mr-2 animate-spin" /><Wand2 v-else class="w-4 h-4 mr-2" /><span v-if="isAIProcessing">Memproses...</span><span v-else>Proses Sekarang</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>