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
        label: 'Urgente',
        data: data.map((d) => d.urgent),
        backgroundColor: '#ef4444', // red-500
        borderRadius: 4,
      },
      {
        label: 'Alta',
        data: data.map((d) => d.high),
        backgroundColor: '#f97316', // orange-500
        borderRadius: 4,
      },
      {
        label: 'Normal',
        data: data.map((d) => d.normal),
        backgroundColor: '#eab308', // yellow-500
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
        ticks: { font: { size: 12 }, color: '#6a6a6a' },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: '#e5e5e5' },
        ticks: { font: { size: 12 }, color: '#6a6a6a' },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
