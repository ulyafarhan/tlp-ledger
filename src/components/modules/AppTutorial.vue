<script setup lang="ts">
import { ref, computed } from 'vue';
import { appStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, CheckCircle2, ChevronRight, Wand2, FileText } from 'lucide-vue-next';
const emit = defineEmits(['close']);

const currentStep = ref(0);

const steps = [
  {
    title: 'Selamat Datang!',
    desc: 'Finance Ledger membantu Anda mencatat keuangan toko atau pribadi dengan mudah dan cerdas.',
    icon: CheckCircle2,
    color: 'text-slate-700',
    isLucideIcon: true
  },
  {
    title: 'Dashboard Ringkas',
    desc: 'Pantau pemasukan, pengeluaran, dan keuntungan bersih Anda secara real-time di halaman Dashboard.',
    icon: LayoutDashboard,
    color: 'text-blue-500',
    isLucideIcon: true
  },
  {
    title: 'AI Magic Input',
    desc: 'Malas mengetik detail? Gunakan fitur AI Magic di menu Input untuk mencatat transaksi dari teks bahasa sehari-hari.',
    icon: Wand2,
    color: 'text-purple-500',
    isLucideIcon: true
  },
  {
    title: 'Laporan Lengkap',
    desc: 'Unduh laporan keuangan Anda ke Excel atau PDF kapan saja melalui menu Laporan.',
    icon: FileText,
    color: 'text-emerald-500',
    isLucideIcon: true
  }
  
];

const isLastStep = computed(() => currentStep.value === steps.length - 1);

const nextStep = () => {
  if (isLastStep.value) {
    finishTutorial();
  } else {
    currentStep.value++;
  }
};

const finishTutorial = () => {
  appStore.completeTutorial();
  emit('close');
};
</script>

<template>
  <div class="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
    <div class="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[400px]">
      
      <div class="flex-1 bg-slate-50 flex items-center justify-center p-8 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div class="absolute bottom-0 left-0 w-24 h-24 bg-purple-100 rounded-full blur-2xl -ml-10 -mb-10"></div>
        
        <template v-if="steps[currentStep].isLucideIcon">
          <component 
            :is="steps[currentStep].icon" 
            class="w-24 h-24 transition-all duration-500 transform"
            :class="steps[currentStep].color" 
          />
        </template>
        <template v-else>
          <span class="text-7xl animate-bounce">{{ steps[currentStep].icon }}</span>
        </template>
      </div>

      <div class="p-8 flex flex-col text-center">
        <h2 class="text-2xl font-bold text-slate-900 mb-3">{{ steps[currentStep].title }}</h2>
        <p class="text-slate-500 text-sm leading-relaxed mb-8">{{ steps[currentStep].desc }}</p>

        <div class="flex justify-center gap-2 mb-8">
          <span 
            v-for="(_, idx) in steps" 
            :key="idx"
            class="h-2 rounded-full transition-all duration-300"
            :class="idx === currentStep ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-200'"
          ></span>
        </div>

        <div class="flex gap-3">
          <Button v-if="!isLastStep" variant="ghost" class="flex-1 text-slate-400 hover:text-slate-600" @click="finishTutorial">
            Lewati
          </Button>
          <Button class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" @click="nextStep">
            <span v-if="isLastStep" class="flex items-center gap-2">Mulai <CheckCircle2 class="w-4 h-4" /></span>
            <span v-else class="flex items-center gap-2">Lanjut <ChevronRight class="w-4 h-4" /></span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>