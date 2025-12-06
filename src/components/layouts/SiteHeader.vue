<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { appStore } from '@/stores/useAppStore'; 
import { LayoutDashboard, PenTool, FileText, Menu, Settings, LogOut, Store, User } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

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
  isOpen.value = false;
};

const isTabActive = (routeName: string) => {
  return route.name === routeName;
};

const displayName = computed(() => appStore.nickname || appStore.ownerName || 'Pengguna');
const shopName = computed(() => appStore.shopName || 'Toko Saya');

const userInitials = computed(() => {
  const name = displayName.value;
  return name.substring(0, 2).toUpperCase();
});
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b bg-white">
    <div class="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-2.5 cursor-pointer group" @click="navigateTo('/')">
        <div class="flex flex-col">
          <span class="text-lg font-bold tracking-tight text-slate-900 leading-none">
            {{ shopName }}
          </span>
          <span class="text-[10px] text-slate-500 font-medium">
            Pencatatan Keuangan
          </span>
        </div>
      </div>

      <nav class="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-200/60">
        <button 
          v-for="item in menuItems" 
          :key="item.name"
          @click="navigateTo(item.path)"
          :class="[
            'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2',
            isTabActive(item.name) 
              ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
          ]"
        >
          <component :is="item.icon" class="w-4 h-4" />
          {{ item.label }}
        </button>
      </nav>

      <div class="flex items-center gap-3">
        
        <Sheet v-model:open="isOpen">
          <SheetTrigger as-child>
            <Button variant="ghost" size="icon" class="md:hidden text-slate-500">
              <Menu class="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="w-[85%] sm:max-w-xs z-[150]"> 
            <SheetHeader class="text-left mb-6">
              <div class="flex items-center gap-3 mb-2">
                <div class="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                  T
                </div>
                <div>
                  <SheetTitle>Finance Ledger</SheetTitle>
                  <SheetDescription>Menu Utama</SheetDescription>
                </div>
              </div>
            </SheetHeader>
            
            <div class="flex flex-col gap-2">
              <Button 
                v-for="item in menuItems" 
                :key="item.name"
                :variant="isTabActive(item.name) ? 'default' : 'ghost'"
                class="justify-start h-12 text-base"
                :class="isTabActive(item.name) ? 'bg-indigo-600 hover:bg-indigo-700' : 'hover:bg-slate-100'"
                @click="navigateTo(item.path)"
              >
                <component :is="item.icon" class="mr-3 h-5 w-5" />
                {{ item.label }}
              </Button>
            </div>

            <Separator class="my-6" />

            <div class="flex items-center gap-3 px-2 py-3 bg-slate-50 rounded-xl border border-slate-100">
              <Avatar class="h-10 w-10 border border-white shadow-sm">
                <AvatarImage src="/avatars/01.png" />
                <AvatarFallback class="bg-indigo-100 text-indigo-700 font-bold">{{ userInitials }}</AvatarFallback>
              </Avatar>
              <div class="overflow-hidden">
                <p class="text-sm font-semibold text-slate-900 truncate">{{ displayName }}</p>
                <p class="text-xs text-slate-500 truncate">{{ shopName }}</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button class="group flex items-center gap-3 outline-none">
              <div class="hidden lg:flex flex-col items-end text-right">
                <span class="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  Halo, {{ displayName }}
                </span>
                <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Pemilik Toko
                </span>
              </div>
              
              <Avatar class="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-200 group-hover:ring-indigo-200 transition-all">
                <AvatarImage src="/avatars/01.png" alt="@user" />
                <AvatarFallback class="bg-indigo-50 text-indigo-600 font-bold text-xs">
                  {{ userInitials }}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent class="w-64" align="end" :side-offset="8">
            <div class="flex items-center gap-3 p-2">
              <div class="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <User class="h-5 w-5 text-slate-500" />
              </div>
              <div class="flex flex-col space-y-0.5 overflow-hidden">
                <span class="text-sm font-semibold text-slate-900 truncate">{{ displayName }}</span>
                <span class="text-xs text-slate-500 truncate flex items-center gap-1">
                  <Store class="w-3 h-3" /> {{ shopName }}
                </span>
              </div>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuItem class="cursor-pointer" @click="router.push('/settings')">
                <User class="mr-2 h-4 w-4 text-slate-500" />
                <span>Profil Saya</span>
              </DropdownMenuItem>
              <DropdownMenuItem class="cursor-pointer" @click="router.push('/settings')">
                <Settings class="mr-2 h-4 w-4 text-slate-500" />
                <span>Pengaturan Toko</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem class="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
              <LogOut class="mr-2 h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
      </div>
    </div>
  </header>
</template>