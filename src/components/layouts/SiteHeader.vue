<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router'; // [NEW] Hooks Router
import { LayoutDashboard, PenTool, FileText, Menu, User, Settings, LogOut } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Tidak butuh props activeTab lagi, kita baca dari URL
const router = useRouter();
const route = useRoute();
const isOpen = ref(false);

const menuItems = [
  { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'input', label: 'Input Transaksi', icon: PenTool, path: '/input' },
  { name: 'report', label: 'Laporan', icon: FileText, path: '/report' },
];

const navigateTo = (path: string) => {
  router.push(path);
  isOpen.value = false; // Tutup menu mobile setelah klik
};

// Cek tab mana yang aktif berdasarkan nama route saat ini
const isTabActive = (routeName: string) => {
  return route.name === routeName;
};
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
    <div class="container flex h-16 items-center justify-between px-4 md:px-8">
      
      <div class="flex items-center gap-2 cursor-pointer" @click="navigateTo('/')">
        <div class="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">
          T
        </div>
        <span class="text-xl font-bold tracking-tight text-slate-900 hidden md:inline-block">
          T-LP Ledger
        </span>
      </div>

      <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
        <button 
          v-for="item in menuItems" 
          :key="item.name"
          @click="navigateTo(item.path)"
          :class="[
            'transition-colors hover:text-slate-900',
            isTabActive(item.name) ? 'text-slate-900 font-bold' : 'text-slate-500'
          ]"
        >
          {{ item.label }}
        </button>
      </nav>

      <div class="flex items-center gap-4">
        <Sheet v-model:open="isOpen">
          <SheetTrigger as-child>
            <Button variant="ghost" size="icon" class="md:hidden">
              <Menu class="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="bg-white z-[150]"> <SheetHeader class="mb-6 text-left">
              <SheetTitle>Menu Navigasi</SheetTitle>
            </SheetHeader>
            <div class="flex flex-col gap-4">
              <Button 
                v-for="item in menuItems" 
                :key="item.name"
                :variant="isTabActive(item.name) ? 'default' : 'ghost'"
                class="justify-start"
                @click="navigateTo(item.path)"
              >
                <component :is="item.icon" class="mr-2 h-4 w-4" />
                {{ item.label }}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="relative h-8 w-8 rounded-full">
              <Avatar class="h-8 w-8">
                <AvatarImage src="/avatars/01.png" alt="@user" />
                <AvatarFallback>UM</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-56 bg-white z-[100]" align="end">
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="cursor-pointer">Profile</DropdownMenuItem> 
            
            <DropdownMenuItem class="cursor-pointer" @click="router.push('/settings')">
              <Settings class="mr-2 h-4 w-4" /> 
              Pengaturan Toko
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-red-600 cursor-pointer">Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </header>
</template>