import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { generateReportData, formatDateCN, formatMoney, type ReportData } from '@/utils/reportData';
import { getTeamFlag } from '@/utils/aiParser';
import Avatar from '@/components/Avatar';

const TOTAL_PAGES = 14;

const pageVariants = {
  enter: (direction: number) => ({
    y: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    y: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    y: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 text-center text-white">
      {children}
    </div>
  );
}

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-50">
      {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i === current ? 'bg-amber-400' : 'bg-white/30'
          }`}
          animate={{ scale: i === current ? 1.2 : 1 }}
          transition={{ duration: 0.2 }}
        />
      ))}
    </div>
  );
}

function Page01Cover({ data }: { data: ReportData }) {
  return (
    <PageContainer>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="text-6xl mb-8"
      >
        🏆
      </motion.div>
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-3xl font-bold mb-3 bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent"
      >
        你的2026世界杯
      </motion.h1>
      <motion.h2
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="text-2xl font-bold mb-6 text-amber-200"
      >
        中奖回忆录
      </motion.h2>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="flex items-center gap-3 mb-10"
      >
        <Avatar src={data.avatar} alt={data.nickname} size="lg" />
        <span className="text-lg">{data.nickname}</span>
      </motion.div>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="text-white/60 text-sm"
      >
        下滑开启回忆 →
      </motion.div>
      <motion.div
        initial={{ y: 0, opacity: 0.5 }}
        animate={{ y: 10, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
        className="mt-2"
      >
        <ChevronDown size={24} className="text-white/50" />
      </motion.div>
    </PageContainer>
  );
}

function Page02FirstWin({ data }: { data: ReportData }) {
  if (!data.firstWin) {
    return (
      <PageContainer>
        <div className="text-5xl mb-6">🎯</div>
        <h2 className="text-2xl font-bold mb-4">开门红</h2>
        <p className="text-white/70">你的第一笔中奖，还在路上</p>
        <p className="text-white/50 text-sm mt-2">好运正在赶来的路上～</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="text-6xl mb-8"
      >
        🎉
      </motion.div>
      <motion.h2
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-2xl font-bold mb-3"
      >
        一切的开始
      </motion.h2>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-amber-300 text-xl font-bold mb-6"
      >
        {formatDateCN(data.firstWin.date)}
      </motion.div>
      <motion.p
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-white/80 mb-3"
      >
        你记录了第一笔中奖
      </motion.p>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        className="text-4xl font-bold text-green-400 mb-8"
      >
        ¥{formatMoney(data.firstWin.amount)}
      </motion.div>
      <motion.p
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="text-white/60 text-sm"
      >
        开门红，是这个夏天最好的开场
      </motion.p>
    </PageContainer>
  );
}

function Page03Overview({ data }: { data: ReportData }) {
  const stats = [
    { label: '记录中奖', value: data.totalBets, unit: '笔', icon: '🎫' },
    { label: '猜中比赛', value: data.totalWinMatches, unit: '场', icon: '⚽' },
    { label: '累计盈利', value: `¥${formatMoney(data.totalWinAmount)}`, unit: '', icon: '💰' },
    { label: '中奖天数', value: data.winDays, unit: '天', icon: '📅' },
  ];

  return (
    <PageContainer>
      <motion.h2
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-2xl font-bold mb-2"
      >
        这个世界杯
      </motion.h2>
      <motion.p
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-white/60 text-sm mb-10"
      >
        你一共
      </motion.p>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ y: 30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.15, type: 'spring' }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center"
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-amber-300 mb-1">
              {stat.value}
              <span className="text-sm font-normal text-white/60 ml-1">{stat.unit}</span>
            </div>
            <div className="text-white/60 text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </div>
      {data.winDays > 0 && (
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="text-white/50 text-sm mt-8"
        >
          相当于每天赚了 ¥{formatMoney(data.totalWinAmount / data.winDays)}
        </motion.p>
      )}
    </PageContainer>
  );
}

function Page04WealthCurve({ data }: { data: ReportData }) {
  if (data.dailyTrend.length === 0) {
    return (
      <PageContainer>
        <div className="text-5xl mb-6">📈</div>
        <h2 className="text-2xl font-bold mb-4">财富曲线</h2>
        <p className="text-white/70">记录你的第一笔中奖，解锁你的财富曲线</p>
      </PageContainer>
    );
  }

  const maxCumulative = Math.max(...data.dailyTrend.map((d) => d.cumulative));
  const chartHeight = 180;
  const chartWidth = 320;
  const padding = 20;

  const points = data.dailyTrend.map((d, i) => {
    const x = padding + (i / Math.max(data.dailyTrend.length - 1, 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (d.cumulative / Math.max(maxCumulative, 1)) * (chartHeight - padding * 2);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;

  return (
    <PageContainer>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-5xl mb-6"
      >
        📈
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-xl font-bold mb-2"
      >
        你的财富曲线
      </motion.h2>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-white/60 text-sm mb-6"
      >
        从第一笔到现在的旅程
      </motion.p>

      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
          <defs>
            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <motion.path
            d={areaD}
            fill="url(#curveGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          />
          <motion.path
            d={pathD}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
          />
          {points.length > 0 && (
            <motion.circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="5"
              fill="#fbbf24"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.8, type: 'spring' }}
            />
          )}
          {points.length > 0 && (
            <>
              <motion.text
                x={points[0].x}
                y={points[0].y - 12}
                textAnchor="middle"
                className="fill-amber-400 text-[10px] font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                ¥{formatMoney(points[0].cumulative)}
              </motion.text>
              <motion.text
                x={points[points.length - 1].x}
                y={points[points.length - 1].y - 12}
                textAnchor="middle"
                className="fill-amber-400 text-[10px] font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
              >
                ¥{formatMoney(points[points.length - 1].cumulative)}
              </motion.text>
            </>
          )}
        </svg>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="flex justify-between w-full max-w-sm mt-4 text-xs text-white/50"
      >
        <span>{formatDateCN(data.dailyTrend[0].date)}</span>
        <span>{formatDateCN(data.dailyTrend[data.dailyTrend.length - 1].date)}</span>
      </motion.div>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="text-white/50 text-sm mt-8"
      >
        财富是这样一步步积累的
      </motion.p>
    </PageContainer>
  );
}

function Page06TimePattern({ data }: { data: ReportData }) {
  const hasStageData = data.stageStats.some((s) => s.winAmount > 0);

  if (!hasStageData) {
    return (
      <PageContainer>
        <div className="text-5xl mb-6">🎯</div>
        <h2 className="text-2xl font-bold mb-4">时间规律</h2>
        <p className="text-white/70">多记录几笔，看看你的运气规律</p>
      </PageContainer>
    );
  }

  const maxStageAmount = Math.max(...data.stageStats.map((s) => s.winAmount), 1);

  const stageEmojis: Record<string, string> = {
    '小组赛': '🏟️',
    '淘汰赛': '⚔️',
  };

  return (
    <PageContainer>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-5xl mb-4"
      >
        🎯
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-xl font-bold mb-2"
      >
        你的运气有规律吗
      </motion.h2>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <p className="text-white/60 text-xs mb-2 text-left">阶段对比</p>
        <div className="flex gap-3">
          {data.stageStats.map((s, i) => {
            const percent = maxStageAmount > 0 ? (s.winAmount / maxStageAmount) * 100 : 0;
            const isBetter = data.betterStage?.stage === s.stage;
            return (
              <motion.div
                key={s.stage}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7 + i * 0.15, type: 'spring' }}
                className={`flex-1 rounded-xl p-3 text-center ${
                  isBetter
                    ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-400/30'
                    : 'bg-white/10'
                }`}
              >
                <div className="text-2xl mb-1">{stageEmojis[s.label] || '⚽'}</div>
                <div className={`text-sm font-bold mb-1 ${isBetter ? 'text-amber-300' : 'text-white'}`}>
                  {s.label}
                </div>
                <div className="text-lg font-bold text-green-400">
                  ¥{formatMoney(s.winAmount)}
                </div>
                <div className="text-[10px] text-white/50 mt-1">
                  {s.winCount} 次中奖
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="text-white/50 text-sm mt-8"
      >
        原来你的好运也有时间表
      </motion.p>
    </PageContainer>
  );
}

function Page07FavoriteTeam({ data }: { data: ReportData }) {
  if (data.teamStats.length === 0) {
    return (
      <PageContainer>
        <div className="text-5xl mb-6">⚽</div>
        <h2 className="text-2xl font-bold mb-4">最有缘的球队</h2>
        <p className="text-white/70">上传彩票截图，AI识别后解锁</p>
      </PageContainer>
    );
  }

  const topTeams = data.teamStats.slice(0, 6);
  const favorite = data.favoriteTeam!;

  return (
    <PageContainer>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-5xl mb-4"
      >
        💝
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-xl font-bold mb-2"
      >
        你最有缘的球队是
      </motion.h2>
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="text-center mb-6"
      >
        <div className="text-7xl mb-3">{getTeamFlag(favorite.name)}</div>
        <div className="text-2xl font-bold text-amber-300">{favorite.name}</div>
        <div className="text-white/60 text-sm mt-2">
          你一共 {favorite.winCount} 次猜中了ta的比赛
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <p className="text-white/60 text-xs mb-3 text-left">猜中过的球队</p>
        <div className="grid grid-cols-6 gap-2">
          {topTeams.map((team, i) => (
            <motion.div
              key={team.name}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.1, type: 'spring' }}
              className="flex flex-col items-center"
            >
              <div className="text-2xl">{getTeamFlag(team.name)}</div>
              <div className="text-[10px] text-white/50 mt-1 truncate w-full text-center">
                {team.winCount}次
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="text-white/50 text-sm mt-8"
      >
        有些球队，就是特别给你面子
      </motion.p>
    </PageContainer>
  );
}

function Page08PlayType({ data }: { data: ReportData }) {
  if (data.playTypeStats.length === 0) {
    return (
      <PageContainer>
        <div className="text-5xl mb-6">🎯</div>
        <h2 className="text-2xl font-bold mb-4">最擅长的玩法</h2>
        <p className="text-white/70">上传彩票截图，AI识别后解锁</p>
      </PageContainer>
    );
  }

  const favorite = data.favoritePlayType!;
  const total = data.playTypeStats.reduce((sum, p) => sum + p.winCount, 0);
  const mvp = data.mvpPlayType;
  const totalAmount = data.playTypeAmountStats.reduce((sum, p) => sum + p.winAmount, 0);

  const playTypeEmojis: Record<string, string> = {
    '胜平负': '⚖️',
    '比分': '🔢',
    '总进球数': '⚽',
    '半全场': '⏱️',
    '其他': '🎲',
  };

  return (
    <PageContainer>
      <motion.div
        initial={{ scale: 0, rotate: 30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-5xl mb-4"
      >
        {playTypeEmojis[favorite.type] || '🎯'}
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-xl font-bold mb-2"
      >
        你最擅长的玩法是
      </motion.h2>
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="text-3xl font-bold text-amber-300 mb-2"
      >
        {favorite.type}
      </motion.div>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-white/70 mb-4"
      >
        {favorite.type}你猜中了 {favorite.winCount} 场
      </motion.p>

      {mvp && mvp.type !== favorite.type && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 rounded-xl px-4 py-2 mb-4 max-w-sm"
        >
          <span className="text-emerald-300 text-sm">
            💰 MVP玩法：{mvp.type}，帮你赚了 ¥{formatMoney(mvp.winAmount)}
          </span>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="w-full max-w-sm space-y-3"
      >
        {data.playTypeStats.slice(0, 4).map((pt, i) => {
          const percent = total > 0 ? (pt.winCount / total) * 100 : 0;
          const amountStat = data.playTypeAmountStats.find((a) => a.type === pt.type);
          return (
            <motion.div
              key={pt.type}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.1 + i * 0.15 }}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/80">
                  {playTypeEmojis[pt.type] || '🎲'} {pt.type}
                </span>
                <span className="text-amber-300">
                  {pt.winCount}场
                  {amountStat && (
                    <span className="text-green-400 ml-2 text-xs">
                      ¥{formatMoney(amountStat.winAmount)}
                    </span>
                  )}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ delay: 1.3 + i * 0.15, duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full"
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="text-white/50 text-sm mt-8"
      >
        下次多买{mvp?.type || favorite.type}，稳稳的幸福
      </motion.p>
    </PageContainer>
  );
}

function Page06BestDay({ data }: { data: ReportData }) {
  if (!data.bestDay) {
    return (
      <PageContainer>
        <div className="text-5xl mb-6">🌟</div>
        <h2 className="text-2xl font-bold mb-4">巅峰时刻</h2>
        <p className="text-white/70">你的高光时刻，即将到来</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-6xl mb-6"
      >
        ✨
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-xl font-bold mb-2"
      >
        你的高光时刻
      </motion.h2>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-amber-300 text-2xl font-bold mb-8"
      >
        {formatDateCN(data.bestDay.date)}
      </motion.div>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.7, type: 'spring' }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-sm"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="text-left">
            <div className="text-white/60 text-sm">单日中奖</div>
            <div className="text-xl font-bold">{data.bestDay.winCount} 次</div>
          </div>
          <div className="text-right">
            <div className="text-white/60 text-sm">单日盈利</div>
            <div className="text-xl font-bold text-green-400">
              ¥{formatMoney(data.bestDay.profit)}
            </div>
          </div>
        </div>
      </motion.div>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="text-white/50 text-sm mt-8"
      >
        那天你是不是对着屏幕喊出来了？
      </motion.p>
    </PageContainer>
  );
}

function Page07BiggestWin({ data }: { data: ReportData }) {
  if (!data.biggestWin) {
    return (
      <PageContainer>
        <div className="text-5xl mb-6">💎</div>
        <h2 className="text-2xl font-bold mb-4">最大一笔中奖</h2>
        <p className="text-white/70">你的幸运星，还在等你</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-6xl mb-6"
      >
        💎
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-xl font-bold mb-2"
      >
        你最大的一笔中奖
      </motion.h2>
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        className="text-5xl font-bold text-green-400 mb-4"
      >
        ¥{formatMoney(data.biggestWin.amount)}
      </motion.div>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-white/60 mb-6"
      >
        {formatDateCN(data.biggestWin.date)}
      </motion.p>
      {data.biggestWin.note && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 max-w-sm"
        >
          <p className="text-white/80 text-sm">「{data.biggestWin.note}」</p>
        </motion.div>
      )}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="text-white/50 text-sm mt-8"
      >
        这一票，买中了一整个夏天的快乐
      </motion.p>
    </PageContainer>
  );
}

function Page08AIComment({ data }: { data: ReportData }) {
  if (!data.bestAIComment) {
    return (
      <PageContainer>
        <div className="text-5xl mb-6">🤖</div>
        <h2 className="text-2xl font-bold mb-4">AI 金句</h2>
        <p className="text-white/70">上传彩票截图，AI识别后解锁</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-6xl mb-6"
      >
        🤖
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-xl font-bold mb-2"
      >
        AI 是这样评价你的
      </motion.h2>
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        className="bg-gradient-to-br from-violet-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-8 w-full max-w-sm border border-white/10"
      >
        <div className="text-4xl mb-4">💬</div>
        <p className="text-lg text-white leading-relaxed">
          「{data.bestAIComment}」
        </p>
      </motion.div>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="text-white/50 text-sm mt-8"
      >
        连 AI 都为你鼓掌了 👏
      </motion.p>
    </PageContainer>
  );
}

function Page09Streak({ data }: { data: ReportData }) {
  if (data.maxStreak < 2) {
    return (
      <PageContainer>
        <div className="text-5xl mb-6">🔥</div>
        <h2 className="text-2xl font-bold mb-4">连胜记录</h2>
        <p className="text-white/70">好运正在酝酿中</p>
        <p className="text-white/50 text-sm mt-2">连续中奖的记录，等你来创造</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-6xl mb-6"
      >
        🔥
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-xl font-bold mb-2"
      >
        你曾连续
      </motion.h2>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        className="text-6xl font-bold text-orange-400 mb-2"
      >
        {data.maxStreak}
      </motion.div>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-xl text-white/80 mb-8"
      >
        天中奖
      </motion.p>
      {data.streakStartDate && data.streakEndDate && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-white/60 mb-8"
        >
          从 {formatDateCN(data.streakStartDate)} 到 {formatDateCN(data.streakEndDate)}
          <br />
          好运连成线
        </motion.div>
      )}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.1, duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-sm h-2 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full origin-left"
      />
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="text-white/50 text-sm mt-8"
      >
        那段时间，你是不是觉得自己能看透比赛？
      </motion.p>
    </PageContainer>
  );
}

function Page11SocialCompare({ data }: { data: ReportData }) {
  return (
    <PageContainer>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-5xl mb-4"
      >
        {data.socialTitleEmoji}
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-xl font-bold mb-2"
      >
        你在群内排名
      </motion.h2>
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="text-center mb-6"
      >
        <div className="text-4xl font-bold text-amber-300 mb-2">
          第 {data.rank} 名
        </div>
        <div className="text-lg font-semibold text-white/80">
          【{data.socialTitle}】
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="w-full max-w-sm mb-6"
      >
        <p className="text-white/60 text-xs mb-3 text-left">👑 TOP3 大佬</p>
        <div className="flex justify-between items-end gap-2">
          {data.topUsers.map((user, i) => (
            <motion.div
              key={user.userId}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8 + i * 0.15, type: 'spring' }}
              className="flex-1 flex flex-col items-center"
              style={{ marginBottom: `${(2 - i) * 12}px` }}
            >
              {user.avatar && (user.avatar.startsWith('/') || user.avatar.startsWith('http')) ? (
                <img
                  src={user.avatar}
                  alt={user.nickname}
                  className="w-12 h-12 rounded-full object-cover mb-2 border-2 border-white/20"
                />
              ) : (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2 ${
                  i === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500' :
                  i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                  'bg-gradient-to-br from-amber-700 to-amber-800'
                }`}>
                  {user.avatar || '👤'}
                </div>
              )}
              <div className="text-xs text-white/80 truncate w-full text-center mb-1">
                {user.nickname}
              </div>
              <div className="text-sm font-bold text-green-400">
                ¥{formatMoney(user.totalWinAmount)}
              </div>
              <div className={`text-[10px] text-white/50 mt-1 ${i === 0 ? 'text-amber-400' : ''}`}>
                {['冠军', '亚军', '季军'][i]}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="w-full max-w-sm mb-6"
      >
        <p className="text-white/60 text-xs mb-3 text-left">📊 群内数据</p>
        <div className="grid grid-cols-3 gap-2">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.1, type: 'spring' }}
            className="bg-white/10 rounded-xl p-3 text-center"
          >
            <div className="text-lg font-bold text-amber-300">
              ¥{formatMoney(data.groupStats.avgWinAmount)}
            </div>
            <div className="text-[10px] text-white/50 mt-1">平均中奖</div>
          </motion.div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2, type: 'spring' }}
            className="bg-white/10 rounded-xl p-3 text-center"
          >
            <div className="text-lg font-bold text-red-400">
              ¥{formatMoney(data.groupStats.maxSingleWin)}
            </div>
            <div className="text-[10px] text-white/50 mt-1">最高单注</div>
          </motion.div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.3, type: 'spring' }}
            className="bg-white/10 rounded-xl p-3 text-center"
          >
            <div className="text-lg font-bold text-blue-400">
              {data.groupStats.avgWinMatches.toFixed(0)}
            </div>
            <div className="text-[10px] text-white/50 mt-1">人均猜中</div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl p-4"
      >
        <p className="text-white/60 text-xs mb-3 text-left">⚔️ 胜负关系</p>
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-green-400">{data.groupStats.beatCount}</div>
            <div className="text-[10px] text-white/50">击败人数</div>
          </motion.div>
          <div className="text-2xl">💥</div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.5 }}
            className="text-center"
          >
            <div className="text-2xl font-bold text-red-400">{data.groupStats.lostCount}</div>
            <div className="text-[10px] text-white/50">被压制</div>
          </motion.div>
        </div>
      </motion.div>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="text-white/50 text-sm mt-8"
      >
        {data.rank === 1 ? '继续保持，你就是群内传说！' : '继续加油，冲击更高排名！'}
      </motion.p>
    </PageContainer>
  );
}

function Page10CPBadges({ data }: { data: ReportData }) {
  return (
    <PageContainer>
      <motion.div className="w-full max-w-sm">
        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg font-bold mb-4 text-left"
        >
          🤝 你的中奖搭子
        </motion.h3>
        {data.bestCP ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-8"
          >
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <Avatar src={data.avatar} alt={data.nickname} size="md" />
                <div className="text-sm text-white/70 mt-2">{data.nickname}</div>
              </div>
              <div className="text-3xl">❤️</div>
              <div className="text-center">
                <Avatar src={data.bestCP.avatar} alt={data.bestCP.nickname} size="md" />
                <div className="text-sm text-white/70 mt-2">{data.bestCP.nickname}</div>
              </div>
            </div>
            <div className="text-center mt-4 text-amber-300 font-bold">
              一起中奖 {data.bestCP.commonWinDays} 天
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-8 text-white/60"
          >
            寻找你的中奖搭子中...
          </motion.div>
        )}

        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-lg font-bold mb-4 text-left"
        >
          🏅 解锁成就
        </motion.h3>
        {data.topBadges.length > 0 ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="grid grid-cols-3 gap-3"
          >
            {data.topBadges.slice(0, 6).map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1 + i * 0.1, type: 'spring' }}
                className={`bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center ${
                  badge.rarity >= 4 ? 'ring-2 ring-amber-400/50' : ''
                }`}
              >
                <div className="text-3xl mb-1">{badge.emoji}</div>
                <div className="text-xs text-white/80">{badge.name}</div>
                <div className="text-[10px] text-amber-300">
                  {'⭐'.repeat(badge.rarity)}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-white/60"
          >
            继续加油，解锁更多徽章！
          </motion.div>
        )}
      </motion.div>
    </PageContainer>
  );
}

function Page11Ending({ data }: { data: ReportData }) {
  return (
    <PageContainer>
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="text-7xl mb-6"
      >
        {data.titleEmoji}
      </motion.div>
      <motion.h2
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-sm text-white/60 mb-2"
      >
        你的专属称号
      </motion.h2>
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent mb-3"
      >
        {data.title}
      </motion.div>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-white/70 mb-10"
      >
        {data.titleDesc}
      </motion.p>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 w-full max-w-sm mb-8"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/60">累计盈利</span>
          <span className="text-xl font-bold text-green-400">
            ¥{formatMoney(data.totalWinAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-white/60">猜中场次</span>
          <span className="text-white font-bold">{data.totalWinMatches} 场</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/60">群内排名</span>
          <span className="text-amber-300 font-bold">
            第 {data.rank} 名 / 共 {data.totalUsers} 人
          </span>
        </div>
      </motion.div>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="text-white/40 text-sm mt-8"
      >
        感谢这个夏天的每一次心跳
        <br />
        我们下届世界杯，再见
      </motion.p>
    </PageContainer>
  );
}

export default function ReportPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const users = useAppStore((state) => state.users);
  const bets = useAppStore((state) => state.bets);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartY = useRef(0);
  const isAnimating = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const user = users.find((u) => u.id === userId);

  const reportData = user ? generateReportData(user, users, bets) : null;

  const goToPage = useCallback(
    (newPage: number) => {
      if (isAnimating.current) return;
      if (newPage < 0 || newPage >= TOTAL_PAGES) return;

      setDirection(newPage > currentPage ? 1 : -1);
      isAnimating.current = true;
      setCurrentPage(newPage);

      setTimeout(() => {
        isAnimating.current = false;
      }, 400);
    },
    [currentPage]
  );

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 10) return;
      e.preventDefault();
      if (e.deltaY > 0) {
        goToPage(currentPage + 1);
      } else {
        goToPage(currentPage - 1);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [currentPage, goToPage]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        goToPage(currentPage + 1);
      } else {
        goToPage(currentPage - 1);
      }
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        goToPage(currentPage + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === 'Escape') {
        navigate(-1);
      }
    },
    [currentPage, goToPage, navigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 动态设置标题，便于微信分享时展示用户昵称
  useEffect(() => {
    if (reportData) {
      document.title = `${reportData.nickname}的世界杯中奖报告`;
    }
    return () => {
      document.title = '世界杯中奖排行榜';
    };
  }, [reportData]);

  if (!user || !reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-white">
        用户不存在
      </div>
    );
  }

  const pages = [
    <Page01Cover key="1" data={reportData} />,
    <Page02FirstWin key="2" data={reportData} />,
    <Page03Overview key="3" data={reportData} />,
    <Page04WealthCurve key="4" data={reportData} />,
    <Page06TimePattern key="5" data={reportData} />,
    <Page06BestDay key="6" data={reportData} />,
    <Page07BiggestWin key="7" data={reportData} />,
    <Page08AIComment key="8" data={reportData} />,
    <Page08PlayType key="9" data={reportData} />,
    <Page07FavoriteTeam key="10" data={reportData} />,
    <Page09Streak key="11" data={reportData} />,
    <Page11SocialCompare key="12" data={reportData} />,
    <Page10CPBadges key="13" data={reportData} />,
    <Page11Ending key="14" data={reportData} />,
  ];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden z-[100]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/report-bg.jpg)' }}
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 right-4 z-50 p-2 text-white/60 hover:text-white transition-colors"
      >
        <X size={24} />
      </button>

      {currentPage > 0 && (
        <button
          onClick={() => goToPage(currentPage - 1)}
          className="fixed top-1/2 left-4 -translate-y-1/2 z-50 p-2 text-white/40 hover:text-white/80 transition-colors"
        >
          <ChevronUp size={28} />
        </button>
      )}
      {currentPage < TOTAL_PAGES - 1 && (
        <button
          onClick={() => goToPage(currentPage + 1)}
          className="fixed top-1/2 right-4 -translate-y-1/2 z-50 p-2 text-white/40 hover:text-white/80 transition-colors"
        >
          <ChevronDown size={28} />
        </button>
      )}

      <ProgressDots current={currentPage} />

      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentPage}
          custom={direction}
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          {pages[currentPage]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
