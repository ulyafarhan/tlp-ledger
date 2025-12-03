<script setup lang="ts">
import { reactive, ref } from 'vue';
import { appStore } from '@/stores/useAppStore';
import { Save, Store, User, MapPin, Phone } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const form = reactive({
  shopName: appStore.shopName,
  ownerName: appStore.ownerName,
  phone: appStore.phone,
  address: appStore.address
});

const isSaved = ref(false);

const saveSettings = () => {
  appStore.updateSettings(form);
  isSaved.value = true;
  
  // Feedback visual sederhana
  setTimeout(() => isSaved.value = false, 2000);
};
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="space-y-2">
      <h2 class="text-3xl font-bold tracking-tight text-slate-900">Pengaturan Toko</h2>
      <p class="text-muted-foreground">Informasi ini akan ditampilkan pada Kop Surat Laporan PDF.</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Profil Usaha</CardTitle>
        <CardDescription>Sesuaikan identitas bisnis Anda.</CardDescription>
      </CardHeader>
      
      <CardContent class="space-y-6">
        <div class="space-y-2">
          <Label>Nama Toko / Usaha</Label>
          <div class="relative">
            <Store class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input v-model="form.shopName" class="pl-9" placeholder="Contoh: Toko Sembako Berkah" />
          </div>
        </div>

        <div class="space-y-2">
          <Label>Nama Pemilik</Label>
          <div class="relative">
            <User class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input v-model="form.ownerName" class="pl-9" placeholder="Nama Anda" />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>Nomor Telepon / WA</Label>
            <div class="relative">
              <Phone class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input v-model="form.phone" class="pl-9" placeholder="08xx-xxxx-xxxx" />
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>Alamat Singkat</Label>
            <div class="relative">
              <MapPin class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input v-model="form.address" class="pl-9" placeholder="Kota / Lokasi" />
            </div>
          </div>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter class="bg-slate-50 p-6 flex justify-end">
        <Button @click="saveSettings" class="min-w-[120px]" :class="isSaved ? 'bg-green-600 hover:bg-green-700' : ''">
          <Save v-if="!isSaved" class="w-4 h-4 mr-2" />
          {{ isSaved ? 'Tersimpan!' : 'Simpan Perubahan' }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>