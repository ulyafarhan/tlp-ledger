<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Registrasi modul wajib Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const props = defineProps<{
  labels: string[];
  incomeData: number[];
  expenseData: number[];
}>();

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'Pemasukan',
      backgroundColor: '#16a34a',
      borderColor: '#16a34a',
      data: props.incomeData,
      tension: 0.3
    },
    {
      label: 'Pengeluaran',
      backgroundColor: '#dc2626',
      borderColor: '#dc2626',
      data: props.expenseData,
      tension: 0.3
    }
  ]
}));

const options = {
  responsive: true,
  maintainAspectRatio: false
};
</script>

<template>
  <div class="h-[300px] w-full bg-white p-4 rounded-lg border shadow-sm">
    <Line :data="chartData" :options="options" />
  </div>
</template>