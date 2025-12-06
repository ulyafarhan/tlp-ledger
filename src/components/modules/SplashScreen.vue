<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Wallet, Sparkles } from 'lucide-vue-next';

const emit = defineEmits(['finish']);
const isVisible = ref(true);

onMounted(() => {
  setTimeout(() => {
    isVisible.value = false;
    setTimeout(() => {
      emit('finish');
    }, 500); 
  }, 2500);
});
</script>

<template>
  <Transition name="fade">
    <div v-if="isVisible" class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-indigo-600 text-white">
      <div class="relative mb-4 animate-bounce-slow">
        <div class="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
        <div class="relative bg-white p-4 rounded-2xl shadow-xl">
          <Wallet class="w-12 h-12 text-indigo-600" />
        </div>
        <Sparkles class="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-spin-slow" />
      </div>
      
      <h1 class="text-3xl font-bold tracking-tight mb-2 animate-fade-in-up">Finance Ledger</h1>
      <p class="text-indigo-200 text-sm animate-fade-in-up delay-100">Catat Keuanganmu, Rapikan Hidupmu</p>
      
      <div class="absolute bottom-10 w-48 h-1 bg-indigo-500/50 rounded-full overflow-hidden">
        <div class="h-full bg-white animate-loading-bar"></div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-bounce-slow {
  animation: bounce 2s infinite;
}
.animate-spin-slow {
  animation: spin 4s linear infinite;
}
.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}
.delay-100 {
  animation-delay: 0.2s;
}
.animate-loading-bar {
  animation: loading 2.5s ease-in-out forwards;
  width: 0%;
}

@keyframes bounce {
  0%, 100% { transform: translateY(-5%); }
  50% { transform: translateY(0); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes loading {
  0% { width: 0%; }
  100% { width: 100%; }
}
</style>