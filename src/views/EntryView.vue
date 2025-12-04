<script setup lang="ts">
import TransactionForm from '@/components/modules/TransactionForm.vue';
</script>

<template>
  <div class="max-w-3xl mx-auto animate-in fade-in duration-500">
    <div class="mb-6">
      <h2 class="text-3xl font-bold tracking-tight text-slate-900">Transaksi Pintar</h2>
      <p class="text-muted-foreground">Catat pemasukan atau pengeluaran operasional.</p>
    </div>
    <TransactionForm />
  </div>
</template>