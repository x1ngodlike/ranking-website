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
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface ProfitChartProps {
  data: Array<{ date: string; profitLoss: number; cumulative: number }>;
}

export const ProfitChart = ({ data }: ProfitChartProps) => {
  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: '累计盈亏',
        data: data.map((d) => d.cumulative),
        borderColor: '#3F51B5',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(63, 81, 181, 0.3)');
          gradient.addColorStop(1, 'rgba(63, 81, 181, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3F51B5',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(26, 35, 126, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#e8edf5',
        borderColor: 'rgba(63, 81, 181, 0.3)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${value >= 0 ? '+' : ''}¥${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(63, 81, 181, 0.1)',
        },
        ticks: {
          color: '#9aabd4',
          font: { size: 11 },
        },
      },
      y: {
        grid: {
          color: 'rgba(63, 81, 181, 0.1)',
        },
        ticks: {
          color: '#9aabd4',
          font: { size: 11 },
          callback: (value) => `¥${value}`,
        },
      },
    },
  };

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-neutral-500 dark:text-neutral-500">
        暂无数据
      </div>
    );
  }

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
};

interface WinRateChartProps {
  won: number;
  lost: number;
  pending: number;
}

export const WinRateChart = ({ won, lost, pending }: WinRateChartProps) => {
  const data = {
    labels: ['赢', '输', '待结算'],
    datasets: [
      {
        data: [won, lost, pending],
        backgroundColor: [
          'rgba(229, 57, 53, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(255, 179, 0, 0.8)',
        ],
        borderColor: [
          '#E53935',
          '#4CAF50',
          '#FFB300',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(26, 35, 126, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#e8edf5',
        borderColor: 'rgba(63, 81, 181, 0.3)',
        borderWidth: 1,
        padding: 12,
      },
    },
  };

  return (
    <div className="h-48">
      <Doughnut data={data} options={options} />
    </div>
  );
};
