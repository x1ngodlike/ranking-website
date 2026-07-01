import { useMemo, useState } from 'react';
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import type { DailyTrendItem } from '@/types';
import { TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendChartProps {
  data: DailyTrendItem[];
}

const formatDateShort = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const formatDateFull = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

const MAX_VISIBLE_AVATARS = 4;

const TrendChart = ({ data }: TrendChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => ({
    labels: data.map((d) => formatDateShort(d.date)),
    datasets: [
      {
        label: '累计中奖',
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
  }), [data]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    onHover: (_event, elements) => {
      if (elements.length > 0) {
        setHoveredIndex(elements[0].index);
      } else {
        setHoveredIndex(null);
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(26, 35, 126, 0.92)',
        titleColor: '#ffffff',
        bodyColor: '#e8edf5',
        borderColor: 'rgba(63, 81, 181, 0.3)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (items) => {
            const idx = items[0].dataIndex;
            return formatDateFull(data[idx]?.date || '');
          },
          label: (context) => {
            const idx = context.dataIndex;
            const day = data[idx];
            const lines: string[] = [];
            lines.push(`当日中奖: +¥${day.winAmount.toFixed(2)}`);
            lines.push(`累计: ¥${day.cumulative.toFixed(2)}`);
            lines.push(`贡献人数: ${day.contributors.length}人`);
            return lines;
          },
          afterBody: (items) => {
            const idx = items[0].dataIndex;
            const day = data[idx];
            if (!day || day.contributors.length === 0) return '';
            const lines: string[] = ['', '贡献榜:'];
            day.contributors.slice(0, 5).forEach((c, i) => {
              lines.push(`  ${i + 1}. ${c.nickname}: +¥${c.amount.toFixed(2)}`);
            });
            return lines.join('\n');
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(63, 81, 181, 0.08)',
        },
        ticks: {
          color: '#9aabd4',
          font: { size: 11 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        grid: {
          color: 'rgba(63, 81, 181, 0.08)',
        },
        ticks: {
          color: '#9aabd4',
          font: { size: 11 },
          callback: (value) => `¥${Number(value).toFixed(0)}`,
        },
      },
    },
  };

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-primary-500" />
          <h2 className="font-display text-lg text-neutral-800 dark:text-neutral-200">
            趋势走势
          </h2>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-500">
          <TrendingUp size={48} className="mb-2 opacity-30" />
          <p>暂无中奖记录</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-primary-500" />
          <h2 className="font-display text-lg text-neutral-800 dark:text-neutral-200">
            趋势走势
          </h2>
        </div>
        <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-500">
          <Users size={14} />
          <span>共 {data.length} 天</span>
        </div>
      </div>

      <div className="h-56 sm:h-64 md:h-72">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/50">
        <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-3">
          每日贡献者
        </p>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {data.map((day, idx) => (
            <div
              key={day.date}
              className={`flex flex-col items-center gap-1 transition-all duration-200 ${
                hoveredIndex === idx ? 'scale-110' : ''
              }`}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex -space-x-2 sm:-space-x-3">
                {day.contributors.slice(0, MAX_VISIBLE_AVATARS).map((c, ci) => (
                  <div
                    key={c.userId}
                    className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white dark:border-neutral-800 bg-gradient-to-br from-neutral-100 dark:from-neutral-700 to-white dark:to-neutral-800 flex items-center justify-center text-sm sm:text-base overflow-hidden ring-1 ring-primary/10"
                    title={`${c.nickname}: +¥${c.amount.toFixed(2)} (${c.count}次)`}
                    style={{ zIndex: MAX_VISIBLE_AVATARS - ci }}
                  >
                    {c.avatar.startsWith('data:') || c.avatar.startsWith('http') || c.avatar.startsWith('/') ? (
                      <img
                        src={c.avatar}
                        alt={c.nickname}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span>{c.avatar}</span>
                    )}
                    {c.count > 1 && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-profit-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center border border-white dark:border-neutral-800">
                        {c.count}
                      </span>
                    )}
                  </div>
                ))}
                {day.contributors.length > MAX_VISIBLE_AVATARS && (
                  <div
                    className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] sm:text-xs font-medium text-neutral-600 dark:text-neutral-300"
                    style={{ zIndex: 0 }}
                  >
                    +{day.contributors.length - MAX_VISIBLE_AVATARS}
                  </div>
                )}
              </div>
              <span className={`text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-500 ${
                hoveredIndex === idx ? 'text-primary-500 font-medium' : ''
              }`}>
                {formatDateShort(day.date)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default TrendChart;
