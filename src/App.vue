<script setup lang="ts">
import { ref } from 'vue';
import { RouterView } from 'vue-router';
import SiteHeader from '@/components/layouts/SiteHeader.vue';
import SplashScreen from '@/components/modules/SplashScreen.vue';
import AppTutorial from '@/components/modules/AppTutorial.vue';
import { appStore } from '@/stores/useAppStore';

const showSplash = ref(true);
const showTutorial = ref(false);

const handleSplashFinish = () => {
  showSplash.value = false;
  if (!appStore.hasSeenTutorial) {
    setTimeout(() => {
      showTutorial.value = true;
    }, 500);
  }
};
</script>

<template>
  <SplashScreen v-if="showSplash" @finish="handleSplashFinish" />

  <AppTutorial v-if="showTutorial" @close="showTutorial = false" />

  <div :class="['min-h-screen bg-slate-50/50 font-sans antialiased', showSplash ? 'h-screen overflow-hidden' : '']">
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