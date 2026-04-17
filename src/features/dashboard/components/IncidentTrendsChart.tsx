'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { DailyTrend } from '../hooks/useAdminIncidenceStats';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface IncidentTrendsChartProps {
  data: DailyTrend[];
}

export function IncidentTrendsChart({ data }: IncidentTrendsChartProps) {
  const labels = data.map((d) => d.label);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'High',
        data: data.map((d) => d.high),
        backgroundColor: '#1e3a8a', // blue-900
        borderRadius: 4,
      },
      {
        label: 'Medium',
        data: data.map((d) => d.medium),
        backgroundColor: '#93c5fd', // blue-300
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          font: { size: 12 },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: 12 }, color: '#64748b' },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: '#e2e8f0' },
        ticks: { font: { size: 12 }, color: '#64748b' },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
