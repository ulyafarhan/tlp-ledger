<script setup lang="ts">
import type { TabsTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { TabsTrigger, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TabsTrigger
    v-bind="forwardedProps"
    :class="cn(
      // Base style
      'group inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300 ease-in-out',
      // Focus & disabled
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50',
      // Active state
      'data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-50 data-[state=active]:to-white data-[state=active]:shadow-md data-[state=active]:text-slate-900',
      // Hover state
      'group-hover:bg-slate-50 group-hover:text-slate-900 group-hover:scale-100',
      props.class,
    )"
  >
    <!-- Slot dengan animasi -->
    <span class="truncate flex items-center gap-2">
      <span class="transition-transform duration-300 group-hover:animate-wiggle">
        <slot name="icon" />
      </span>
      <slot />
    </span>
  </TabsTrigger>
</template>

<style scoped>
@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-6deg); }
  75% { transform: rotate(6deg); }
}
.group-hover\:animate-wiggle {
  animation: wiggle 0.4s ease-in-out;
}
</style>
