import { useMemo, useRef, useState, useEffect } from 'react';
import type { DailyTrendItem } from '@/types';
import { TrendingUp, Users, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { isImageAvatar } from '@/components/Avatar';

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
const POINT_WIDTH = 92; // 每个数据点最小占用宽度，数据多时触发横向滚动
const CHART_HEIGHT = 340;
const PAD_TOP = 64; // 顶部留给头像
const PAD_BOTTOM = 34; // 底部留给日期
const PAD_X = 24;
const AVATAR_TOP = 10;
const AVATAR_SIZE = 28;

const TrendChart = ({ data }: TrendChartProps) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  // 测量容器实际宽度（含 minWidth 生效后的值）
  useEffect(() => {
    if (!innerRef.current) return;
    const el = innerRef.current;
    const update = () => setWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const active = hovered !== null ? hovered : pinned;

  const { points, maxVal, pathD, areaD } = useMemo(() => {
    if (data.length === 0 || width === 0) {
      return { points: [] as any[], maxVal: 1, pathD: '', areaD: '' };
    }
    const n = data.length;
    const maxVal = Math.max(...data.map((d) => d.cumulative), 1);
    const innerW = Math.max(width - PAD_X * 2, 1);
    const innerH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
    const pts = data.map((d, i) => {
      const x = n === 1 ? PAD_X + innerW / 2 : PAD_X + (i / (n - 1)) * innerW;
      const y = PAD_TOP + (1 - d.cumulative / maxVal) * innerH;
      return { x, y, ...d };
    });
    let path = '';
    if (n === 1) {
      path = `M ${pts[0].x} ${pts[0].y}`;
    } else {
      pts.forEach((p, i) => {
        if (i === 0) {
          path += `M ${p.x} ${p.y}`;
        } else {
          const prev = pts[i - 1];
          const cx = (prev.x + p.x) / 2;
          path += ` C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
        }
      });
    }
    const bottomY = CHART_HEIGHT - PAD_BOTTOM;
    const area =
      n === 1
        ? `M ${pts[0].x - 1} ${pts[0].y} L ${pts[0].x + 1} ${pts[0].y} L ${pts[0].x + 1} ${bottomY} L ${pts[0].x - 1} ${bottomY} Z`
        : `${path} L ${pts[pts.length - 1].x} ${bottomY} L ${pts[0].x} ${bottomY} Z`;
    return { points: pts, maxVal, pathD: path, areaD: area };
  }, [data, width]);

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

  const innerH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const bottomY = CHART_HEIGHT - PAD_BOTTOM;

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

      <div
        className="overflow-x-auto -mx-2 px-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div
          ref={innerRef}
          className="relative"
          style={{
            minWidth: `${data.length * POINT_WIDTH}px`,
            width: '100%',
            height: CHART_HEIGHT,
          }}
        >
          {width > 0 && (
            <>
              <svg
                width={width}
                height={CHART_HEIGHT}
                className="absolute inset-0"
                style={{ pointerEvents: 'none' }}
              >
                <defs>
                  <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(63,81,181,0.28)" />
                    <stop offset="100%" stopColor="rgba(63,81,181,0)" />
                  </linearGradient>
                </defs>

                {/* 横向网格线 */}
                {[0, 0.5, 1].map((t) => {
                  const y = PAD_TOP + t * innerH;
                  return (
                    <line
                      key={t}
                      x1={PAD_X}
                      y1={y}
                      x2={width - PAD_X}
                      y2={y}
                      stroke="rgba(63,81,181,0.1)"
                      strokeWidth={1}
                      strokeDasharray={t === 0 || t === 1 ? '0' : '4 4'}
                    />
                  );
                })}

                {/* Y轴最大值标签 */}
                <text
                  x={PAD_X}
                  y={PAD_TOP - 6}
                  fill="#9aabd4"
                  fontSize={10}
                >
                  ¥{maxVal.toFixed(0)}
                </text>
                <text
                  x={PAD_X}
                  y={bottomY - 6}
                  fill="#9aabd4"
                  fontSize={10}
                >
                  ¥0
                </text>

                {/* 头像到数据点的连接线 */}
                {points.map((p, i) => (
                  <line
                    key={`conn-${i}`}
                    x1={p.x}
                    y1={AVATAR_TOP + AVATAR_SIZE + 4}
                    x2={p.x}
                    y2={p.y}
                    stroke={active === i ? 'rgba(63,81,181,0.5)' : 'rgba(63,81,181,0.18)'}
                    strokeWidth={active === i ? 1.5 : 1}
                    strokeDasharray="2 3"
                  />
                ))}

                {/* 区域填充 */}
                <path d={areaD} fill="url(#trendArea)" />

                {/* 折线 */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#3F51B5"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* 数据点 */}
                {points.map((p, i) => (
                  <g key={`pt-${i}`}>
                    {active === i && (
                      <circle cx={p.x} cy={p.y} r={10} fill="rgba(63,81,181,0.15)" />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={active === i ? 6 : 4}
                      fill="#3F51B5"
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  </g>
                ))}
              </svg>

              {/* 头像层（顶部） */}
              {points.map((p, i) => {
                const leftPct = (p.x / width) * 100;
                const contributors = p.contributors || [];
                const visible = contributors.slice(0, MAX_VISIBLE_AVATARS);
                const rest = contributors.length - visible.length;
                return (
                  <div
                    key={`avatar-${i}`}
                    className="absolute flex flex-col items-center cursor-pointer"
                    style={{
                      left: `${leftPct}%`,
                      top: AVATAR_TOP,
                      transform: 'translateX(-50%)',
                    }}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setPinned(pinned === i ? null : i)}
                  >
                    <div className="flex -space-x-2">
                      {visible.map((c, ci) => (
                        <div
                          key={c.userId}
                          className="relative rounded-full border-2 border-white dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center overflow-hidden ring-1 ring-primary/15 transition-transform hover:scale-110 hover:z-10"
                          style={{
                            width: AVATAR_SIZE,
                            height: AVATAR_SIZE,
                            zIndex: MAX_VISIBLE_AVATARS - ci,
                          }}
                          title={`${c.nickname}: +¥${c.amount.toFixed(2)} (${c.count}次)`}
                        >
                          {isImageAvatar(c.avatar) ? (
                            <img
                              src={c.avatar}
                              alt={c.nickname}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-sm">{c.avatar}</span>
                          )}
                          {c.count > 1 && (
                            <span className="absolute -bottom-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 bg-profit-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white dark:border-neutral-800">
                              {c.count}
                            </span>
                          )}
                        </div>
                      ))}
                      {rest > 0 && (
                        <div
                          className="rounded-full border-2 border-white dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[9px] font-medium text-neutral-600 dark:text-neutral-300"
                          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, zIndex: 0 }}
                        >
                          +{rest}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 日期标签（底部） */}
              {points.map((p, i) => {
                const leftPct = (p.x / width) * 100;
                return (
                  <div
                    key={`label-${i}`}
                    className="absolute text-center"
                    style={{
                      left: `${leftPct}%`,
                      bottom: 8,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <span
                      className={`text-[10px] ${
                        active === i
                          ? 'text-primary-500 font-bold'
                          : 'text-neutral-500 dark:text-neutral-500'
                      }`}
                    >
                      {formatDateShort(p.date)}
                    </span>
                  </div>
                );
              })}

              {/* 悬浮信息卡 */}
              {active !== null && points[active] && (
                <div
                  className="absolute z-20 pointer-events-none"
                  style={{
                    left: `${(points[active].x / width) * 100}%`,
                    top: Math.max(points[active].y - 12, 8),
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <div className="bg-primary-700/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl px-3 py-2 min-w-[140px] max-w-[200px]">
                    <p className="font-bold mb-1">{formatDateFull(points[active].date)}</p>
                    <p className="text-profit-300">
                      当日: +¥{points[active].winAmount.toFixed(2)}
                    </p>
                    <p className="text-blue-200">
                      累计: ¥{points[active].cumulative.toFixed(2)}
                    </p>
                    <p className="text-neutral-300 mt-0.5">
                      贡献: {points[active].contributors.length}人
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 图例提示 */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-neutral-500 dark:text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-primary-500 rounded" />
          累计中奖
        </span>
        <span className="flex items-center gap-1">
          <TrendingDown size={12} className="opacity-50" />
          左右滑动查看更多
        </span>
      </div>
    </motion.div>
  );
};

export default TrendChart;
