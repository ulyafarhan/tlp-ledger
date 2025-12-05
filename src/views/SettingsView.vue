<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { appStore } from '@/stores/useAppStore'; 
import { db } from '@/db';
// Menghapus import ikon Sun, Moon, Palette agar tidak error unused vars
import { 
  Save, Store, User, Database, Upload, FileSpreadsheet, 
  FileJson, AlertTriangle, CheckCircle2 
} from 'lucide-vue-next';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// Menghapus Switch import karena tidak dipakai lagi

const form = reactive({
  nickname: appStore.nickname || '',
  shopName: appStore.shopName,
  ownerName: appStore.ownerName,
  phone: appStore.phone,
  address: appStore.address
});

const isSaved = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const isImporting = ref(false);
const isExporting = ref(false);

const initials = computed(() => {
  const name = form.nickname || form.ownerName || 'U';
  return name.substring(0, 2).toUpperCase();
});

const saveSettings = () => {
  appStore.updateSettings(form);
  isSaved.value = true;
  setTimeout(() => isSaved.value = false, 2000);
};

// === FITUR DATA & BACKUP ===

const downloadFile = (content: string, fileName: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// 1. Full Backup JSON (Tanpa Theme)
const exportBackup = async () => {
  isExporting.value = true;
  try {
    const headers = await db.headers.toArray();
    const details = await db.details.toArray();
    
    // Simpan pengaturan tanpa tema
    const settingsToSave = {
      nickname: appStore.nickname,
      shopName: appStore.shopName,
      ownerName: appStore.ownerName,
      phone: appStore.phone,
      address: appStore.address
    };

    const backupData = {
      meta: {
        version: '2.0', 
        exportedAt: new Date().toISOString(),
        appName: 'T-LP Ledger'
      },
      settings: settingsToSave,
      data: { headers, details }
    };

    downloadFile(JSON.stringify(backupData, null, 2), `TLP-FullBackup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  } catch (e) {
    alert('Gagal membuat file backup.');
  } finally {
    isExporting.value = false;
  }
};

const triggerImport = () => fileInput.value?.click();

// 2. Restore Data (Tanpa Theme)
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  isImporting.value = true;

  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      const parsed = JSON.parse(content);

      if (!parsed.data || !parsed.data.headers) {
        throw new Error('Format file backup tidak valid.');
      }

      // Restore Settings (Bersihkan properti theme jika user mengupload file backup lama)
      if (parsed.settings) {
        if ('theme' in parsed.settings) delete parsed.settings.theme;

        // 2. Update Store
        appStore.updateSettings(parsed.settings);
        
        // 3. Update Form UI
        Object.assign(form, parsed.settings);
      }

      // Restore Database
      if (parsed.data.headers && parsed.data.headers.length > 0) {
        await db.transaction('rw', db.headers, db.details, async () => {
          await db.headers.bulkPut(parsed.data.headers);
          if (parsed.data.details && parsed.data.details.length > 0) {
            await db.details.bulkPut(parsed.data.details);
          }
        });
        alert(`Berhasil! ${parsed.data.headers.length} transaksi dipulihkan.`);
      } else {
        alert('Pengaturan dipulihkan.');
      }

      target.value = ''; 
    } catch (err: any) {
      console.error(err);
      alert('Gagal restore: ' + err.message);
    } finally {
      isImporting.value = false;
    }
  };
  reader.readAsText(file);
};

const resetDatabase = async () => {
  if (confirm('PERINGATAN KERAS:\nSemua data transaksi akan DIHAPUS PERMANEN.\n\nLanjutkan?')) {
    if (confirm('Yakin 100%?')) {
      await db.headers.clear();
      await db.details.clear();
      alert('Database telah dikosongkan.');
      window.location.reload();
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 pb-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1">
          <h2 class="text-3xl font-bold tracking-tight text-slate-900">Pengaturan</h2>
          <p class="text-slate-500">Pusat kendali aplikasi & data Anda.</p>
        </div>
        
        <div class="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
          <Avatar class="h-9 w-9 border border-indigo-100">
            <AvatarFallback class="bg-indigo-100 text-indigo-700 font-bold">
              {{ initials }}
            </AvatarFallback>
          </Avatar>
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-slate-700 leading-none">
              {{ form.shopName || 'Toko Saya' }}
            </span>
            <span class="text-[10px] text-slate-400 font-medium mt-0.5">{{ form.ownerName || 'Owner' }}</span>
          </div>
        </div>
      </div>

      <Separator class="bg-slate-200" />

      <Tabs default-value="data" class="flex flex-col lg:flex-row gap-8">
        
        <aside class="lg:w-1/4">
          <TabsList class="flex flex-row lg:flex-col justify-start h-auto w-full bg-transparent gap-2 p-0 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            
            <TabsTrigger value="profile" class="w-full justify-start px-4 py-3 h-auto border border-transparent rounded-xl transition-all duration-200 group 
              data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-slate-200">
              <User class="w-4 h-4 mr-3 text-slate-500 group-data-[state=active]:text-indigo-600" />
              <div class="text-left">
                <div class="font-semibold text-slate-700 group-data-[state=active]:text-slate-900">Profil</div>
                <div class="text-xs text-slate-400 font-normal hidden md:block">Identitas pemilik</div>
              </div>
            </TabsTrigger>

            <TabsTrigger value="shop" class="w-full justify-start px-4 py-3 h-auto border border-transparent rounded-xl transition-all duration-200 group
              data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-slate-200">
              <Store class="w-4 h-4 mr-3 text-slate-500 group-data-[state=active]:text-indigo-600" />
              <div class="text-left">
                <div class="font-semibold text-slate-700 group-data-[state=active]:text-slate-900">Toko</div>
                <div class="text-xs text-slate-400 font-normal hidden md:block">Info kop surat</div>
              </div>
            </TabsTrigger>
            
            <TabsTrigger value="data" class="w-full justify-start px-4 py-3 h-auto border border-transparent rounded-xl transition-all duration-200 group
              data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border-slate-200">
              <Database class="w-4 h-4 mr-3 text-slate-500 group-data-[state=active]:text-indigo-600" />
              <div class="text-left">
                <div class="font-semibold text-slate-700 group-data-[state=active]:text-slate-900">Data</div>
                <div class="text-xs text-slate-400 font-normal hidden md:block">Backup & Excel</div>
              </div>
            </TabsTrigger>
            
            </TabsList>
        </aside>

        <div class="flex-1 max-w-2xl">
          
          <TabsContent value="data" class="space-y-6 m-0 animate-in fade-in slide-in-from-right-4 duration-500">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card class="border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                <CardHeader class="pb-3">
                  <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-2">
                    <FileJson class="w-5 h-5 text-indigo-600" />
                  </div>
                  <CardTitle class="text-base">Full Backup</CardTitle>
                  <CardDescription class="text-xs">Simpan database & pengaturan (JSON).</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" class="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50" @click="exportBackup" :disabled="isExporting">
                    <Save class="md:w-5 md:h-5 sm:w-4 sm:h-4 mr-2" />
                    Simpan Backup
                  </Button>
                </CardContent>
              </Card>

              <Card class="border-slate-200 shadow-sm hover:border-emerald-200 transition-colors">
                <CardHeader class="pb-3">
                  <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-2">
                    <FileSpreadsheet class="w-5 h-5 text-emerald-600" />
                  </div>
                  <CardTitle class="text-base">Restore Data</CardTitle>
                  <CardDescription class="text-xs">Pulihkan data dari file .json backup.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div class="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer" @click="triggerImport">
                    <Upload class="md:w-8 md:h-8 sm:w-6 sm:h-6 text-slate-400 mb-2" />
                    <p class="text-sm font-medium text-slate-700">
                      {{ isImporting ? 'Memproses...' : 'Klik untuk Upload File Backup' }}
                    </p>
                    <p class="text-xs text-slate-400 mt-1">Format .json saja</p>
                    <input type="file" ref="fileInput" class="hidden" accept=".json" @change="handleFileUpload" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div class="pt-4">
              <h4 class="text-xs font-bold text-red-600 uppercase tracking-wider mb-3 px-1">Zona Bahaya</h4>
              <div class="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-lg">
                <div class="flex items-center gap-3">
                  <AlertTriangle class="w-5 h-5 text-red-600" />
                  <div>
                    <p class="text-sm font-semibold text-red-900">Reset Aplikasi</p>
                    <p class="text-xs text-red-700">Hapus semua data & mulai dari nol.</p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" @click="resetDatabase">
                  Hapus Data
                </Button>
              </div>
            </div>

          </TabsContent>

          <TabsContent value="profile" class="space-y-6 m-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card class="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Profil Pribadi</CardTitle>
                <CardDescription>Identitas Anda di aplikasi.</CardDescription>
              </CardHeader>
              <CardContent class="space-y-6">
                <div class="space-y-2">
                  <Label>Nama Panggilan</Label>
                  <Input v-model="form.nickname" placeholder="Misal: Pak Budi" />
                </div>
                <div class="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input v-model="form.ownerName" placeholder="Nama sesuai KTP" />
                </div>
              </CardContent>
              <CardFooter class="bg-slate-50 p-4 flex justify-end">
                <Button @click="saveSettings" :disabled="isSaved" :class="isSaved ? 'bg-emerald-600' : ''">
                  <CheckCircle2 v-if="isSaved" class="w-4 h-4 mr-2" />
                  {{ isSaved ? 'Tersimpan' : 'Simpan Profil' }}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="shop" class="space-y-6 m-0 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card class="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Informasi Bisnis</CardTitle>
                <CardDescription>Data ini muncul di laporan PDF.</CardDescription>
              </CardHeader>
              <CardContent class="space-y-6">
                <div class="space-y-2">
                  <Label>Nama Toko</Label>
                  <Input v-model="form.shopName" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <Label>No. HP / WA</Label>
                    <Input v-model="form.phone" />
                  </div>
                  <div class="space-y-2">
                    <Label>Kota</Label>
                    <Input v-model="form.address" />
                  </div>
                </div>
              </CardContent>
              <CardFooter class="bg-slate-50 p-4 flex justify-end">
                <Button @click="saveSettings" :disabled="isSaved" :class="isSaved ? 'bg-emerald-600' : ''">
                  <CheckCircle2 v-if="isSaved" class="w-4 h-4 mr-2" />
                  {{ isSaved ? 'Tersimpan' : 'Simpan Info' }}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          </div>
      </Tabs>
    </div>
  </div>
</template>