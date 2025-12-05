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
  Legend,
  Filler, 
  ChartOptions // [PERBAIKAN 1]: Import ChartOptions untuk typing
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = withDefaults(defineProps<{
  labels: string[];
  incomeData: number[];
  expenseData: number[];
}>(), {
  labels: () => [],
  incomeData: () => [],
  expenseData: () => []
});

// Helper untuk format angka ringkas (1jt, 500rb) di sumbu Y
const formatCompact = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1
  }).format(value);
};

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'Pemasukan',
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)'); // Emerald-500 transparent
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        return gradient;
      },
      borderColor: '#10b981', // Emerald-500
      pointBackgroundColor: '#fff',
      pointBorderColor: '#10b981',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      data: props.incomeData,
      tension: 0.4, // Kurva lebih halus
      fill: true // Area di bawah garis diarsir
    },
    {
      label: 'Pengeluaran',
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(244, 63, 94, 0.2)'); // Rose-500 transparent
        gradient.addColorStop(1, 'rgba(244, 63, 94, 0)');
        return gradient;
      },
      borderColor: '#f43f5e', // Rose-500
      pointBackgroundColor: '#fff',
      pointBorderColor: '#f43f5e',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      data: props.expenseData,
      tension: 0.4,
      fill: true
    }
  ]
}));

// [PERBAIKAN 2]: Berikan tipe data eksplisit ChartOptions<'line'>
const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'end' as const, // Legend di kanan atas
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        padding: 20,
        font: {
          family: "'Inter', sans-serif",
          size: 11
        },
        color: '#64748b' // Slate-500
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#0f172a', // Slate-900
      bodyColor: '#334155', // Slate-700
      borderColor: '#e2e8f0', // Slate-200
      borderWidth: 1,
      padding: 10,
      titleFont: { size: 13, weight: 'bold' },
      bodyFont: { size: 12 },
      displayColors: true,
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      border: { display: false }, // Hilangkan garis border kiri
      grid: {
        color: '#f1f5f9', // Garis horizontal sangat tipis (Slate-100)
      },
      ticks: {
        font: { size: 10, family: "'Inter', sans-serif" },
        color: '#94a3b8', // Slate-400
        padding: 10,
        maxTicksLimit: 6,
        callback: (value: any) => formatCompact(value) // Format 1.000.000 jadi 1jt
      }
    },
    x: {
      grid: {
        display: false // Hilangkan garis vertikal agar bersih
      },
      ticks: {
        font: { size: 10, family: "'Inter', sans-serif" },
        color: '#64748b', // Slate-500
        padding: 10
      }
    }
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false
  }
};
</script>

<template>
  <div class="w-full h-full p-2 relative">
    <Line v-if="chartData.labels.length > 0" :data="chartData" :options="options" />
    <div v-else class="flex items-center justify-center h-full text-slate-400 text-sm">
      Belum ada data grafik
    </div>
  </div>
</template>