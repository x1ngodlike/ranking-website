import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { generateReportData, formatDateCN, formatMoney, type ReportData } from '@/utils/reportData';
import { getTeamFlag } from '@/utils/aiParser';

const TOTAL_PAGES = 14;

/* ── 独立色板 ── */
const C = {
  gold: '#F0C05A',
  goldDim: 'rgba(240,192,90,0.15)',
  goldGlow: 'rgba(240,192,90,0.25)',
  green: '#F87171',
  greenDim: 'rgba(248,113,113,0.12)',
  red: '#F87171',
  orange: '#FB923C',
};

const pageVariants = {
  enter: (d: number) => ({ y: d > 0 ? '100%' : '-100%' }),
  center: { y: 0 },
  exit: (d: number) => ({ y: d < 0 ? '100%' : '-100%' }),
};

/* ── 每页背景图映射（14页全覆盖） ── */
const PAGE_BGS: Record<number, string> = {
  0:  '/report/stadium-hero.jpg',    // 封面
  1:  '/report/first-win-bg.jpg',    // 开门红
  2:  '/report/overview-bg.jpg',     // 总览
  3:  '/report/goal-net.jpg',        // 财富曲线
  4:  '/report/time-pattern-bg.jpg', // 时间规律
  5:  '/report/celebration.jpg',     // 巅峰时刻
  6:  '/report/celebration.jpg',     // 最大中奖
  7:  '/report/ai-comment-bg.jpg',   // AI金句
  8:  '/report/playtype-bg.jpg',     // 玩法
  9:  '/report/team-bg.jpg',         // 最有缘球队
  10: '/report/streak-bg.jpg',       // 连胜
  11: '/report/pitch-aerial.jpg',    // 群内排名
  12: '/report/cp-badge-bg.jpg',     // 搭子+成就
  13: '/report/scoreboard.jpg',     // 结尾
};

/* ── 预加载所有背景图 ── */
if (typeof window !== 'undefined') {
  Object.values(PAGE_BGS).forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

/* ── 背景图容器 ── */
function PageBg({ children, pageIndex }: { children: React.ReactNode; pageIndex?: number }) {
  const bg = pageIndex !== undefined ? PAGE_BGS[pageIndex] : undefined;
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#08080c] flex flex-col items-center justify-center">
      {bg && (
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110 opacity-20 will-change-transform"
          style={{ backgroundImage: `url(${bg})` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/70" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-500/[0.03] blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/[0.02] blur-[80px] pointer-events-none" />
      <div className="relative z-10 w-full flex flex-col items-center justify-center px-6 text-center max-w-[340px]">
        {children}
      </div>
    </div>
  );
}

/* ── 章节标签 ── */
function Ch({ children, delay = 0.2 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="text-[10px] tracking-[5px] uppercase mb-5 font-medium"
      style={{ color: C.gold }}>
      {children}
    </motion.p>
  );
}

/* ── 标题 ── */
function Title({ children, delay = 0.3, size = 'text-[26px]', className = '' }: { children: React.ReactNode; delay?: number; size?: string; className?: string }) {
  return (
    <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      className={`font-semibold text-white tracking-wide ${size} ${className}`}>
      {children}
    </motion.h2>
  );
}

/* ── 副文字 ── */
function Sub({ children, delay = 0.5, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
      className={`text-white/50 text-base ${className}`}>
      {children}
    </motion.p>
  );
}

/* ── 大数字 ── */
function Num({ value, color, delay = 0.6, size = 'text-[52px]' }: { value: string; color?: string; delay?: number; size?: string }) {
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      className={`${size} font-bold font-mono tabular-nums`}
      style={{ color: color || '#F0C05A' }}>
      {value}
    </motion.div>
  );
}

/* ── 毛玻璃卡片 ── */
function Card({ children, delay = 0.5, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.45, ease: 'easeOut' }}
      className={`bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-2xl ${className}`}>
      {children}
    </motion.div>
  );
}

/* ── 分隔线 ── */
function Sep({ delay = 0.9 }: { delay?: number }) {
  return (
    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="w-14 h-px mx-auto my-6 origin-center bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  );
}

/* ── 底部引言 ── */
function Quote({ children, delay = 1.2 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="text-white/25 text-base mt-8 italic max-w-[280px]">
      {children}
    </motion.p>
  );
}

/* ── 进度条 ── */
function Bar({ percent, delay = 1.0, className = '' }: { percent: number; delay?: number; className?: string }) {
  return (
    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(percent, 100)}%` }}
        transition={{ delay, duration: 0.6 }}
        className={`h-full rounded-full bg-gradient-to-r ${className || 'from-amber-400 to-red-400'}`} />
    </div>
  );
}

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="fixed bottom-7 left-1/2 -translate-x-1/2 flex gap-1.5 z-50">
      {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${
          i === current ? 'w-5 h-1.5' : 'w-1.5 h-1.5'
        } ${i === current ? 'bg-amber-400/80' : 'bg-white/15'}`} />
      ))}
    </div>
  );
}

/* ═══════════════ PAGE 01 — 封面 ═══════════════ */
function P01({ data }: { data: ReportData }) {
  return (
    <PageBg pageIndex={0}>
      <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }} src="/report/world-cup-2026-logo.jpg" alt="World Cup 2026"
        className="w-[120px] h-[120px] mb-6 rounded-2xl object-contain" />
      <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-[30px] font-semibold text-white mb-2 tracking-wider">
        你的2026世界杯
      </motion.h1>
      <motion.p initial={{ y: 25, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-lg font-light text-white/35 mb-10 tracking-widest">
        中奖回忆录
      </motion.p>
      <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="flex items-center gap-3 mb-14">
        <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/10 shrink-0 bg-white/5 flex items-center justify-center">
          {data.avatar && (data.avatar.startsWith('/') || data.avatar.startsWith('http') || data.avatar.startsWith('data:')) ? (
            <img src={data.avatar} alt={data.nickname} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl">{data.avatar}</span>
          )}
        </div>
        <span className="text-base text-white/50">{data.nickname}</span>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }} className="text-white/25 text-xs mb-2">
        下滑开启回忆
      </motion.p>
      <motion.div initial={{ y: 0 }} animate={{ y: 6 }}
        transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatType: 'reverse' }}>
        <ChevronDown size={18} className="text-white/20" />
      </motion.div>
    </PageBg>
  );
}

/* ═══════════════ PAGE 02 — 开门红 ═══════════════ */
function P02({ data }: { data: ReportData }) {
  if (!data.firstWin) {
    return <PageBg pageIndex={1}><Ch>Chapter 01</Ch><Title>开门红</Title><Sub delay={0.5}>你的第一笔中奖，还在路上</Sub></PageBg>;
  }
  return (
    <PageBg pageIndex={1}>
      <Ch>Chapter 01</Ch>
      <Title>一切的开始</Title>
      <Sub delay={0.45} className="font-mono text-white/50 mb-6">{formatDateCN(data.firstWin.date)}</Sub>
      <motion.img initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        src="/report/illust-trophy.jpg" alt="" className="w-16 h-16 rounded-full opacity-60 mb-4" />
      <p className="text-white/45 text-sm mb-4">你记录了第一笔中奖</p>
      <Num value={`¥${formatMoney(data.firstWin.amount)}`} delay={0.7} color="#F0C05A" />
      <Sep />
      <Quote>开门红，是这个夏天最好的开场</Quote>
    </PageBg>
  );
}

/* ═══════════════ PAGE 03 — 总览 ═══════════════ */
function P03({ data }: { data: ReportData }) {
  const stats = [
    { label: '记录中奖', value: String(data.totalBets), unit: '笔', hl: false },
    { label: '猜中比赛', value: String(data.totalWinMatches), unit: '场', hl: false },
    { label: '累计盈利', value: `¥${formatMoney(data.totalWinAmount)}`, unit: '', hl: true },
    { label: '中奖天数', value: String(data.winDays), unit: '天', hl: false },
  ];
  return (
    <PageBg pageIndex={2}>
      <Ch>Chapter 02</Ch>
      <Title>这个世界杯</Title>
      <Sub delay={0.45} className="mb-8">你一共</Sub>
      <div className="grid grid-cols-2 gap-3 w-full max-w-[300px]">
        {stats.map((s, i) => (
          <Card key={s.label} delay={0.55 + i * 0.1} className="p-5">
            <div className="text-2xl font-bold font-mono tabular-nums mb-1" style={{ color: s.hl ? '#F0C05A' : '#fff' }}>
              {s.value}<span className="text-xs font-normal text-white/25 ml-0.5">{s.unit}</span>
            </div>
            <div className="text-[11px] text-white/35">{s.label}</div>
          </Card>
        ))}
      </div>
      {data.winDays > 0 && <Quote delay={1.2}>相当于每天赚了 ¥{formatMoney(data.totalWinAmount / data.winDays)}</Quote>}
    </PageBg>
  );
}

/* ═══════════════ PAGE 04 — 财富曲线 ═══════════════ */
function P04({ data }: { data: ReportData }) {
  if (data.dailyTrend.length === 0) {
    return <PageBg pageIndex={3}><Ch>Chapter 03</Ch><Title>财富曲线</Title><Sub delay={0.5}>记录第一笔中奖，解锁财富曲线</Sub></PageBg>;
  }
  const maxC = Math.max(...data.dailyTrend.map((d) => d.cumulative));
  const H = 150, W = 300, P = 20;
  const pts = data.dailyTrend.map((d, i) => ({
    x: P + (i / Math.max(data.dailyTrend.length - 1, 1)) * (W - P * 2),
    y: H - P - (d.cumulative / Math.max(maxC, 1)) * (H - P * 2),
    cumulative: d.cumulative, date: d.date,
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x},${H - P} L${pts[0].x},${H - P}Z`;
  return (
    <PageBg pageIndex={3}>
      <Ch>Chapter 03</Ch>
      <Title size="text-xl">你的财富曲线</Title>
      <Sub delay={0.45} className="text-xs mb-6">从第一笔到现在的旅程</Sub>
      <Card delay={0.55} className="p-4 w-full max-w-[300px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <defs>
            <linearGradient id="cg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(240,192,90,0.2)" />
              <stop offset="100%" stopColor="rgba(240,192,90,0.01)" />
            </linearGradient>
          </defs>
          <motion.path d={area} fill="url(#cg)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} />
          <motion.path d={line} fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 1.2, ease: 'easeOut' }} />
          {pts.length > 0 && <>
            <motion.text x={pts[0].x} y={pts[0].y - 8} textAnchor="middle" className="text-[9px] font-bold fill-amber-300"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>¥{formatMoney(pts[0].cumulative)}</motion.text>
            <motion.text x={pts[pts.length - 1].x} y={pts[pts.length - 1].y - 8} textAnchor="middle" className="text-[9px] font-bold fill-amber-300"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }}>¥{formatMoney(pts[pts.length - 1].cumulative)}</motion.text>
            <motion.circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3" fill={C.gold}
              initial={{ r: 0 }} animate={{ r: 3 }} transition={{ delay: 1.8 }} />
          </>}
        </svg>
        <div className="flex justify-between text-[9px] text-white/20 mt-2 px-1">
          <span>{formatDateCN(data.dailyTrend[0].date)}</span>
          <span>{formatDateCN(data.dailyTrend[data.dailyTrend.length - 1].date)}</span>
        </div>
      </Card>
      <Quote delay={1.4}>财富是这样一步步积累的</Quote>
    </PageBg>
  );
}

/* ═══════════════ PAGE 05 — 时间规律 ═══════════════ */
function P05({ data }: { data: ReportData }) {
  const hasData = data.stageStats.some((s) => s.winAmount > 0);
  if (!hasData) {
    return <PageBg pageIndex={4}><Ch>Chapter 04</Ch><Title>时间规律</Title><Sub delay={0.5}>多记录几笔，看看你的运气规律</Sub></PageBg>;
  }
  const maxA = Math.max(...data.stageStats.map((s) => s.winAmount), 1);
  return (
    <PageBg pageIndex={4}>
      <Ch>Chapter 04</Ch>
      <Title size="text-xl">你的运气有规律吗</Title>
      <div className="flex gap-3 w-full max-w-[300px] mt-6">
        {data.stageStats.map((s, i) => {
          const isBest = data.betterStage?.stage === s.stage;
          return (
            <Card key={s.stage} delay={0.5 + i * 0.15}
              className={`flex-1 p-4 ${isBest ? 'border-amber-400/20' : ''}`}>
              <div className={`text-sm font-bold mb-1 ${isBest ? 'text-white' : 'text-white/50'}`}>{s.label}</div>
              <div className="text-lg font-bold font-mono" style={{ color: '#F0C05A' }}>¥{formatMoney(s.winAmount)}</div>
              <div className="text-[10px] text-white/25 mt-1">{s.winCount} 次</div>
              <div className="mt-2"><Bar percent={(s.winAmount / maxA) * 100} delay={0.8 + i * 0.15} /></div>
            </Card>
          );
        })}
      </div>
      <Quote>原来你的好运也有时间表</Quote>
    </PageBg>
  );
}

/* ═══════════════ PAGE 06 — 巅峰时刻 ═══════════════ */
function P06({ data }: { data: ReportData }) {
  if (!data.bestDay) {
    return <PageBg pageIndex={5}><Ch>Chapter 05</Ch><Title>巅峰时刻</Title><Sub delay={0.5}>你的高光时刻，即将到来</Sub></PageBg>;
  }
  return (
    <PageBg pageIndex={5}>
      <Ch>Chapter 05</Ch>
      <Title size="text-xl">你的高光时刻</Title>
      <Sub delay={0.5} className="font-mono text-white/60 mb-8">{formatDateCN(data.bestDay.date)}</Sub>
      <Card delay={0.6} className="p-6 w-full max-w-[300px]">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-white/35 text-xs mb-1">单日中奖</div>
            <div className="text-2xl font-bold font-mono text-white">{data.bestDay.winCount} <span className="text-sm text-white/25">次</span></div>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <div className="text-white/35 text-xs mb-1">单日盈利</div>
            <div className="text-2xl font-bold font-mono" style={{ color: '#F0C05A' }}>¥{formatMoney(data.bestDay.profit)}</div>
          </div>
        </div>
      </Card>
      <Quote delay={1.0}>那天你是不是对着屏幕喊出来了？</Quote>
    </PageBg>
  );
}

/* ═══════════════ PAGE 07 — 最大中奖 ═══════════════ */
function P07({ data }: { data: ReportData }) {
  if (!data.biggestWin) {
    return <PageBg pageIndex={6}><Ch>Chapter 06</Ch><Title>最大一笔中奖</Title><Sub delay={0.5}>你的幸运星，还在等你</Sub></PageBg>;
  }
  return (
    <PageBg pageIndex={6}>
      <Ch>Chapter 06</Ch>
      <Title size="text-xl" className="mb-4">你最大的一笔中奖</Title>
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full bg-amber-400/[0.06] blur-[60px] pointer-events-none" />
      <Num value={`¥${formatMoney(data.biggestWin.amount)}`} delay={0.5} size="text-5xl" color="#F0C05A" />
      <p className="text-white/35 text-sm font-mono mt-3 mb-6">{formatDateCN(data.biggestWin.date)}</p>
      {data.biggestWin.note && (
        <Card delay={0.9} className="px-5 py-3 max-w-[280px]">
          <p className="text-white/50 text-sm">「{data.biggestWin.note}」</p>
        </Card>
      )}
      <Quote delay={1.2}>这一票，买中了一整个夏天的快乐</Quote>
    </PageBg>
  );
}

/* ═══════════════ PAGE 08 — AI金句 ═══════════════ */
function P08({ data }: { data: ReportData }) {
  if (!data.bestAIComment) {
    return <PageBg pageIndex={7}><Ch>Chapter 07</Ch><Title>AI 金句</Title><Sub delay={0.5}>上传彩票截图，AI识别后解锁</Sub></PageBg>;
  }
  return (
    <PageBg pageIndex={7}>
      <Ch>Chapter 07</Ch>
      <Title size="text-xl" className="mb-6">AI 是这样评价你的</Title>
      <Card delay={0.5} className="p-8 w-full max-w-[280px] border-violet-400/10">
        <p className="text-3xl text-amber-400/20 leading-none mb-2">&ldquo;</p>
        <p className="text-base text-white/75 leading-relaxed">{data.bestAIComment}</p>
        <p className="text-3xl text-amber-400/20 leading-none mt-2 text-right">&rdquo;</p>
      </Card>
      <Quote delay={1.2}>连 AI 都为你鼓掌了</Quote>
    </PageBg>
  );
}

/* ═══════════════ PAGE 09 — 玩法 ═══════════════ */
function P09({ data }: { data: ReportData }) {
  if (data.playTypeStats.length === 0) {
    return <PageBg pageIndex={8}><Ch>Chapter 08</Ch><Title>最擅长的玩法</Title><Sub delay={0.5}>上传彩票截图，AI识别后解锁</Sub></PageBg>;
  }
  const fav = data.favoritePlayType!;
  const total = data.playTypeStats.reduce((s, p) => s + p.winCount, 0);
  const mvp = data.mvpPlayType;
  return (
    <PageBg pageIndex={8}>
      <Ch>Chapter 08</Ch>
      <Title size="text-xl">你最擅长的玩法是</Title>
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }} className="text-3xl font-bold text-white mb-1">{fav.type}</motion.div>
      <Sub delay={0.6} className="mb-6">猜中了 {fav.winCount} 场</Sub>
      {mvp && (
        <Card delay={0.7} className="px-4 py-2 mb-5 max-w-[280px] border-amber-400/15">
          <span className="text-sm" style={{ color: '#F0C05A' }}>MVP玩法：{mvp.type}，赚了 ¥{formatMoney(mvp.winAmount)}</span>
        </Card>
      )}
      <div className="w-full max-w-[300px] space-y-3 mt-2">
        {data.playTypeStats.slice(0, 4).map((pt, i) => {
          const pct = total > 0 ? (pt.winCount / total) * 100 : 0;
          const amt = data.playTypeAmountStats.find((a) => a.type === pt.type);
          return (
            <motion.div key={pt.type} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.85 + i * 0.1 }}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/50">{pt.type}</span>
                <span className="text-white/70">{pt.winCount}场{amt && <span className="ml-2" style={{ color: '#F0C05A' }}>¥{formatMoney(amt.winAmount)}</span>}</span>
              </div>
              <Bar percent={pct} delay={1.0 + i * 0.1} />
            </motion.div>
          );
        })}
      </div>
      <Quote delay={1.6}>下次多买{mvp?.type || fav.type}，稳稳的幸福</Quote>
    </PageBg>
  );
}

/* ═══════════════ PAGE 10 — 最有缘球队 ═══════════════ */
function P10({ data }: { data: ReportData }) {
  if (data.teamStats.length === 0) {
    return <PageBg pageIndex={9}><Ch>Chapter 09</Ch><Title>最有缘的球队</Title><Sub delay={0.5}>上传彩票截图，AI识别后解锁</Sub></PageBg>;
  }
  const fav = data.favoriteTeam!;
  const top = data.teamStats.slice(0, 6);
  return (
    <PageBg pageIndex={9}>
      <Ch>Chapter 09</Ch>
      <Title size="text-xl" className="mb-6">你最有缘的球队是</Title>
      <motion.div initial={{ y: 16, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }} className="mb-6">
        <div className="text-6xl mb-2">{getTeamFlag(fav.name)}</div>
        <div className="text-2xl font-bold text-white">{fav.name}</div>
        <div className="text-white/35 text-sm mt-1">你一共 {fav.winCount} 次猜中了ta的比赛</div>
      </motion.div>
      <Card delay={0.7} className="p-4 w-full max-w-[300px]">
        <p className="text-white/30 text-[10px] mb-3 text-left">猜中过的球队</p>
        <div className="grid grid-cols-6 gap-2">
          {top.map((t, i) => (
            <motion.div key={t.name} initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.8 + i * 0.08, type: 'spring' }}
              className={`flex flex-col items-center p-2 rounded-lg ${
                t.name === fav.name ? 'bg-amber-400/[0.08] ring-1 ring-amber-400/15' : ''
              }`}>
              <div className="text-2xl">{getTeamFlag(t.name)}</div>
              <div className="text-[9px] text-white/25 mt-1">{t.winCount}次</div>
            </motion.div>
          ))}
        </div>
      </Card>
      <Quote delay={1.4}>有些球队，就是特别给你面子</Quote>
    </PageBg>
  );
}

/* ═══════════════ PAGE 11 — 连胜 ═══════════════ */
function P11({ data }: { data: ReportData }) {
  if (data.maxStreak < 2) {
    return <PageBg pageIndex={10}><Ch>Chapter 10</Ch><Title>连胜记录</Title><Sub delay={0.5}>好运正在酝酿中</Sub></PageBg>;
  }
  return (
    <PageBg pageIndex={10}>
      <Ch>Chapter 10</Ch>
      <Title size="text-xl">你曾连续</Title>
      <div className="my-2 relative">
        <motion.img initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0.15, scale: 1 }}
          transition={{ delay: 0.4 }} src="/report/illust-fire.jpg" alt=""
          className="absolute -inset-16 w-[200%] h-[200%] object-cover pointer-events-none" />
        <Num value={String(data.maxStreak)} delay={0.5} size="text-6xl" color="#FB923C" />
      </div>
      <Sub delay={0.7} className="text-lg !text-white/50 mb-8">天中奖</Sub>
      {data.streakStartDate && data.streakEndDate && (
        <p className="text-white/30 text-sm font-mono mb-8">{formatDateCN(data.streakStartDate)} → {formatDateCN(data.streakEndDate)}</p>
      )}
      <div className="w-full max-w-[300px]">
        <Bar percent={Math.min(data.maxStreak * 15, 100)} delay={1.0} className="from-red-400 via-orange-400 to-red-500" />
      </div>
      <Quote delay={1.4}>那段时间，你是不是觉得自己能看透比赛？</Quote>
    </PageBg>
  );
}

/* ═══════════════ PAGE 12 — 群内排名 ═══════════════ */
function P12({ data }: { data: ReportData }) {
  return (
    <PageBg pageIndex={11}>
      <Ch>Chapter 11</Ch>
      <Title size="text-xl" className="mb-4">你在群内排名</Title>
      <motion.div initial={{ y: 16, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }} className="mb-6">
        <div className="text-5xl font-bold text-white mb-1">#{data.rank}</div>
        <span className="inline-block px-3 py-1 rounded-full text-xs bg-amber-400/[0.08] border border-amber-400/15"
          style={{ color: C.gold }}>
          {data.socialTitle}
        </span>
      </motion.div>
      <div className="flex justify-between items-end gap-2 w-full max-w-[300px] mb-6">
        {data.topUsers.map((u, i) => (
          <motion.div key={u.userId} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 + i * 0.12 }}
            className="flex-1 flex flex-col items-center" style={{ marginBottom: `${(2 - i) * 6}px` }}>
            <div className={`w-10 h-10 rounded-full overflow-hidden mb-1 ring-2 ${
              i === 0 ? 'ring-amber-400/25' : 'ring-white/10'}`}>
              {u.avatar && (u.avatar.startsWith('/') || u.avatar.startsWith('http')) ? (
                <img src={u.avatar} alt={u.nickname} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-base ${
                  i === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500' :
                  i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' : 'bg-gradient-to-br from-orange-500 to-amber-600'
                }`}>{u.avatar || '?'}</div>
              )}
            </div>
            <div className="text-[10px] text-white/40 truncate w-full text-center">{u.nickname}</div>
            <div className="text-xs font-bold font-mono mt-0.5" style={{ color: '#F0C05A' }}>¥{formatMoney(u.totalWinAmount)}</div>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 w-full max-w-[300px] mb-4">
        <Card delay={0.9} className="p-3 text-center">
          <div className="text-sm font-bold font-mono" style={{ color: '#F0C05A' }}>¥{formatMoney(data.groupStats.avgWinAmount)}</div>
          <div className="text-[9px] text-white/25 mt-0.5">平均中奖</div>
        </Card>
        <Card delay={1.0} className="p-3 text-center">
          <div className="text-sm font-bold font-mono" style={{ color: '#F0C05A' }}>¥{formatMoney(data.groupStats.maxSingleWin)}</div>
          <div className="text-[9px] text-white/25 mt-0.5">最高单注</div>
        </Card>
        <Card delay={1.1} className="p-3 text-center">
          <div className="text-sm font-bold font-mono text-blue-400">{data.groupStats.avgWinMatches.toFixed(0)}</div>
          <div className="text-[9px] text-white/25 mt-0.5">人均猜中</div>
        </Card>
      </div>
      <Card delay={1.2} className="p-4 w-full max-w-[300px]">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-xl font-bold font-mono text-amber-400">{data.groupStats.beatCount}</div>
            <div className="text-[9px] text-white/25">击败</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <div className="text-xl font-bold font-mono text-amber-400">{data.groupStats.lostCount}</div>
            <div className="text-[9px] text-white/25">被压制</div>
          </div>
        </div>
      </Card>
      <Quote delay={1.6}>{data.rank === 1 ? '继续保持，你就是群内传说！' : '继续加油，冲击更高排名！'}</Quote>
    </PageBg>
  );
}

/* ═══════════════ PAGE 13 — 中奖搭子 + 成就 ═══════════════ */
function P13({ data }: { data: ReportData }) {
  return (
    <PageBg pageIndex={12}>
      <div className="w-full max-w-[300px]">
        <motion.h3 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-bold text-white mb-4 text-left">你的中奖搭子</motion.h3>
        {data.bestCP ? (
          <Card delay={0.4} className="p-5 mb-8">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-white/10 mx-auto bg-white/5 flex items-center justify-center">
                  {data.avatar && (data.avatar.startsWith('/') || data.avatar.startsWith('http') || data.avatar.startsWith('data:')) ? (
                    <img src={data.avatar} alt={data.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">{data.avatar}</span>
                  )}
                </div>
                <div className="text-xs text-white/40 mt-2">{data.nickname}</div>
              </div>
              <div className="text-lg text-white/15 shrink-0">~</div>
              <div className="text-center shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-1 ring-white/10 mx-auto bg-white/5 flex items-center justify-center">
                  {data.bestCP.avatar && (data.bestCP.avatar.startsWith('/') || data.bestCP.avatar.startsWith('http') || data.bestCP.avatar.startsWith('data:')) ? (
                    <img src={data.bestCP.avatar} alt={data.bestCP.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">{data.bestCP.avatar}</span>
                  )}
                </div>
                <div className="text-xs text-white/40 mt-2">{data.bestCP.nickname}</div>
              </div>
            </div>
            <div className="text-center mt-4 text-sm font-bold font-mono text-white">一起中奖 {data.bestCP.commonWinDays} 天</div>
          </Card>
        ) : (
          <Card delay={0.4} className="p-5 mb-8 text-white/30 text-sm">寻找你的中奖搭子中...</Card>
        )}

        <motion.h3 initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm font-bold text-white mb-4 text-left">解锁成就</motion.h3>
        {data.topBadges.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {data.topBadges.slice(0, 6).map((b, i) => (
              <Card key={b.id} delay={0.8 + i * 0.08}
                className={`p-3 text-center ${b.rarity >= 4 ? 'border-amber-400/15' : ''}`}>
                <div className="text-2xl mb-1">{b.emoji}</div>
                <div className="text-[10px] text-white/50">{b.name}</div>
                <div className="text-[9px] mt-0.5 text-amber-400/50">{'★'.repeat(b.rarity)}</div>
              </Card>
            ))}
          </div>
        ) : (
          <Card delay={0.8} className="p-5 text-white/30 text-sm">继续加油，解锁更多徽章！</Card>
        )}
      </div>
    </PageBg>
  );
}

/* ═══════════════ PAGE 14 — 结尾 ═══════════════ */
function P14({ data }: { data: ReportData }) {
  return (
    <PageBg pageIndex={13}>
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-16 h-16 rounded-full bg-amber-400/[0.08] ring-1 ring-amber-400/15 flex items-center justify-center mb-6">
        <span className="text-3xl">{data.titleEmoji}</span>
      </motion.div>
      <p className="text-white/35 text-xs mb-1">你的专属称号</p>
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-4xl font-bold text-white mb-2">{data.title}</motion.div>
      <Sub delay={0.7} className="mb-8">{data.titleDesc}</Sub>
      <Card delay={0.9} className="p-5 w-full max-w-[300px] mb-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/35 text-sm">累计盈利</span>
            <span className="text-lg font-bold font-mono" style={{ color: '#F0C05A' }}>¥{formatMoney(data.totalWinAmount)}</span>
          </div>
          <div className="h-px bg-white/[0.05]" />
          <div className="flex items-center justify-between">
            <span className="text-white/35 text-sm">猜中场次</span>
            <span className="text-sm font-bold font-mono text-white">{data.totalWinMatches} 场</span>
          </div>
          <div className="h-px bg-white/[0.05]" />
          <div className="flex items-center justify-between">
            <span className="text-white/35 text-sm">群内排名</span>
            <span className="text-sm font-bold font-mono text-white">第 {data.rank} 名 / 共 {data.totalUsers} 人</span>
          </div>
        </div>
      </Card>
      <p className="text-white/20 text-sm">感谢这个夏天的每一次心跳</p>
      <p className="text-white/15 text-sm mt-1">我们下届世界杯，再见</p>
    </PageBg>
  );
}

/* ═══════════════ MAIN ═══════════════ */
export default function ReportPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const users = useAppStore((state) => state.users);
  const bets = useAppStore((state) => state.bets);
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(0);
  const touchY = useRef(0);
  const animLock = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const user = users.find((u) => u.id === userId);
  const data = user ? generateReportData(user, users, bets) : null;

  const go = useCallback((n: number) => {
    if (animLock.current || n < 0 || n >= TOTAL_PAGES) return;
    setDir(n > page ? 1 : -1);
    animLock.current = true;
    setPage(n);
    setTimeout(() => { animLock.current = false; }, 400);
  }, [page]);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 10) return;
      e.preventDefault();
      go(e.deltaY > 0 ? page + 1 : page - 1);
    };
    const el = containerRef.current;
    if (el) el.addEventListener('wheel', onWheel, { passive: false });
    return () => { if (el) el.removeEventListener('wheel', onWheel); };
  }, [page, go]);

  const onTouchStart = (e: React.TouchEvent) => { touchY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const d = touchY.current - e.changedTouches[0].clientY;
    if (Math.abs(d) > 50) go(d > 0 ? page + 1 : page - 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); go(page + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); go(page - 1); }
      else if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, go, navigate]);

  useEffect(() => {
    if (data) document.title = `${data.nickname}的世界杯中奖报告`;
    return () => { document.title = '世界杯中奖排行榜'; };
  }, [data]);

  if (!user || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white/50">用户不存在</div>
    );
  }

  const pages: React.ReactNode[] = [
    <P01 key="1" data={data} />, <P02 key="2" data={data} />,
    <P03 key="3" data={data} />, <P04 key="4" data={data} />,
    <P05 key="5" data={data} />, <P06 key="6" data={data} />,
    <P07 key="7" data={data} />, <P08 key="8" data={data} />,
    <P09 key="9" data={data} />, <P10 key="10" data={data} />,
    <P11 key="11" data={data} />, <P12 key="12" data={data} />,
    <P13 key="13" data={data} />, <P14 key="14" data={data} />,
  ];

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden z-[100]"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <button onClick={() => navigate(-1)}
        className="fixed top-4 right-4 z-50 p-2 text-white/30 hover:text-white/70 transition-colors">
        <X size={20} />
      </button>
      {page > 0 && (
        <button onClick={() => go(page - 1)}
          className="fixed top-1/2 left-3 -translate-y-1/2 z-50 p-1.5 text-white/15 hover:text-white/50 transition-colors">
          <ChevronUp size={20} />
        </button>
      )}
      {page < TOTAL_PAGES - 1 && (
        <button onClick={() => go(page + 1)}
          className="fixed top-1/2 right-3 -translate-y-1/2 z-50 p-1.5 text-white/15 hover:text-white/50 transition-colors">
          <ChevronDown size={20} />
        </button>
      )}
      <ProgressDots current={page} />
      <AnimatePresence initial={false} custom={dir} mode="wait">
        <motion.div key={page} custom={dir} variants={pageVariants}
          initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0">
          {pages[page]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
