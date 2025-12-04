<script setup lang="ts">
import SiteHeader from '@/components/layouts/SiteHeader.vue';
import { RouterView } from 'vue-router';
// Tidak perlu script watcher lagi, useDark sudah menanganinya otomatis
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans antialiased">
    <SiteHeader />
    
    <main class="container mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>