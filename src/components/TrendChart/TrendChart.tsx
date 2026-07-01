import { useMemo, useRef, useState, useEffect } from 'react';
import type { DailyTrendItem } from '@/types';
import { TrendingUp, Users, ChevronLeft, ChevronRight } from 'lucide-react';
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
const POINT_WIDTH = 92;
const CHART_HEIGHT = 380;
const PAD_TOP = 84;
const PAD_BOTTOM = 34;
const PAD_X = 28;
const AVATAR_TOP = 6;
const AVATAR_SIZE = 30;

const TrendChart = ({ data }: TrendChartProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!innerRef.current) return;
    const el = innerRef.current;
    const update = () => setWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const updateScrollButtons = useMemo(() => () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 2
    );
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollButtons);
  }, [updateScrollButtons, data.length, width]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || data.length === 0) return;
    el.scrollLeft = el.scrollWidth;
    if (points.length > 0) {
      setPinned(points.length - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length, width]);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.clientWidth * 0.6;
    el.scrollBy({ left: dir * dist, behavior: 'smooth' });
  };

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
            中奖走势
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
            中奖走势
          </h2>
        </div>
        <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-500">
          <Users size={14} />
          <span>共 {data.length} 天</span>
        </div>
      </div>

      <div className="relative">
        {/* 左侧按钮 - 桌面端 */}
        <button
          onClick={() => scrollBy(-1)}
          className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full items-center justify-center transition-all duration-200 ${
            canScrollLeft
              ? 'bg-white/80 dark:bg-neutral-800/80 text-primary-500 shadow-md hover:bg-white dark:hover:bg-neutral-800 backdrop-blur-sm'
              : 'bg-white/30 dark:bg-neutral-800/30 text-neutral-400/50 cursor-default'
          }`}
          disabled={!canScrollLeft}
        >
          <ChevronLeft size={18} />
        </button>

        {/* 右侧按钮 - 桌面端 */}
        <button
          onClick={() => scrollBy(1)}
          className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full items-center justify-center transition-all duration-200 ${
            canScrollRight
              ? 'bg-white/80 dark:bg-neutral-800/80 text-primary-500 shadow-md hover:bg-white dark:hover:bg-neutral-800 backdrop-blur-sm'
              : 'bg-white/30 dark:bg-neutral-800/30 text-neutral-400/50 cursor-default'
          }`}
          disabled={!canScrollRight}
        >
          <ChevronRight size={18} />
        </button>

        <div
          ref={scrollRef}
          className="overflow-x-auto -mx-2 px-2 scrollbar-hide md:px-8"
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

                  {/* Y轴标签（右侧） */}
                  <text
                    x={width - PAD_X}
                    y={PAD_TOP - 6}
                    fill="#9aabd4"
                    fontSize={10}
                    textAnchor="end"
                  >
                    ¥{maxVal.toFixed(0)}
                  </text>
                  <text
                    x={width - PAD_X}
                    y={bottomY - 6}
                    fill="#9aabd4"
                    fontSize={10}
                    textAnchor="end"
                  >
                    ¥0
                  </text>

                  {/* 头像到数据点的连接线 */}
                  {points.map((p, i) => (
                    <line
                      key={`conn-${i}`}
                      x1={p.x}
                      y1={AVATAR_TOP + AVATAR_SIZE + 2}
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
                  // 当天最高中奖金额的用户（contributors[0] 已经是降序第一）
                  const dailyWinnerId = contributors.length > 0 ? contributors[0].userId : null;
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
                        {visible.map((c, ci) => {
                          const isFirst = ci === 0;
                          const showCrown = isFirst && dailyWinnerId === c.userId;
                          return (
                            <div
                              key={c.userId}
                              className="relative rounded-full border-2 border-white dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center ring-1 ring-primary/15 transition-transform hover:scale-110"
                              style={{
                                width: AVATAR_SIZE,
                                height: AVATAR_SIZE,
                                zIndex: MAX_VISIBLE_AVATARS - ci,
                                overflow: 'visible',
                              }}
                            >
                              {showCrown && (
                                <div
                                  className="absolute"
                                  style={{ top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 16 }}
                                  title="当日之星"
                                >
                                  👑
                                </div>
                              )}
                              <div
                                className="rounded-full overflow-hidden flex items-center justify-center"
                                style={{ width: AVATAR_SIZE - 4, height: AVATAR_SIZE - 4 }}
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
                              </div>
                              {c.count > 1 && (
                                <span
                                  className="absolute min-w-[14px] h-[14px] px-1 bg-profit-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-800 shadow-sm"
                                  style={{ top: -5, left: -5, zIndex: MAX_VISIBLE_AVATARS - ci + 10 }}
                                >
                                  {c.count}
                                </span>
                              )}
                            </div>
                          );
                        })}
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

                {/* 悬浮信息卡（以贡献头像为基准向下弹出，智能贴边避免遮挡） */}
                {active !== null && points[active] && (() => {
                  const popupMinWidth = 180;
                  const popupMaxWidth = 240;
                  const p = points[active];
                  const leftEdge = PAD_X;
                  const rightEdge = width - PAD_X;
                  const halfW = popupMaxWidth / 2;
                  let align: 'center' | 'left' | 'right' = 'center';
                  let leftPx = p.x;
                  if (p.x - halfW < leftEdge) {
                    align = 'left';
                    leftPx = leftEdge;
                  } else if (p.x + halfW > rightEdge) {
                    align = 'right';
                    leftPx = rightEdge;
                  }
                  const topPx = AVATAR_TOP + AVATAR_SIZE + 8;
                  return (
                    <div
                      className="absolute z-30 pointer-events-none"
                      style={{
                        left: `${leftPx}px`,
                        top: `${topPx}px`,
                        ...(align === 'center' && { transform: 'translateX(-50%)' }),
                        ...(align === 'right' && { transform: 'translateX(-100%)' }),
                      }}
                    >
                      <div
                        className="bg-primary-700/95 backdrop-blur-sm text-white text-xs rounded-xl shadow-2xl px-3 py-2.5 border border-primary-500/30"
                        style={{ minWidth: popupMinWidth, maxWidth: popupMaxWidth }}
                      >
                        <p className="font-bold mb-2 text-sm">{formatDateFull(p.date)}</p>
                        <div className="flex justify-between gap-2 mb-1">
                          <span className="text-profit-300">当日中奖</span>
                          <span className="text-profit-300 font-bold">
                            +¥{p.winAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2 mb-2">
                          <span className="text-blue-200">累计</span>
                          <span className="text-blue-200 font-bold">
                            ¥{p.cumulative.toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t border-white/20 pt-2">
                          <p className="text-neutral-300 mb-1.5">
                            贡献者 ({p.contributors.length}人)
                          </p>
                          <div className="space-y-1 max-h-[120px] overflow-y-auto">
                            {p.contributors.map((c: any, ci: number) => (
                              <div
                                key={c.userId}
                                className="flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <span className="text-[10px] text-primary-300 font-bold w-4 text-right">
                                    {ci + 1}
                                  </span>
                                  <span className="truncate text-white/90">
                                    {c.nickname}
                                  </span>
                                  {c.count > 1 && (
                                    <span className="text-[9px] bg-profit-500 text-white px-1 rounded-full flex-shrink-0">
                                      {c.count}次
                                    </span>
                                  )}
                                </div>
                                <span className="text-profit-300 font-medium flex-shrink-0">
                                  +¥{c.amount.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 图例提示 */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-neutral-500 dark:text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-primary-500 rounded" />
          累计中奖
        </span>
        <span className="flex items-center gap-1 md:hidden">
          左右滑动查看更多
        </span>
      </div>
    </motion.div>
  );
};

export default TrendChart;
