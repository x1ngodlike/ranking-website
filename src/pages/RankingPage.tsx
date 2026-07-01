import { useMemo, useRef, useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { calculateRankings, calculateDailyTrend, getDailyStarUserId, getTodayStr } from '@/utils/calculations';
import { Trophy, Hash, RefreshCw, TrendingUp } from 'lucide-react';
import RankingPodium from '@/components/RankingPodium/RankingPodium';
import RankingList from '@/components/RankingList/RankingList';
import TrendChart from '@/components/TrendChart/TrendChart';
import type { RankingSortType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = RankingSortType | 'trend';

const tabs: { type: TabType; label: string; icon: typeof Trophy }[] = [
  { type: 'totalWin', label: '中奖总额', icon: Trophy },
  { type: 'trend', label: '中奖走势', icon: TrendingUp },
  { type: 'totalBets', label: '记录总数', icon: Hash },
];

const PULL_THRESHOLD = 60;
const PULL_MAX = 100;

const RankingPage = () => {
  const sortType = useAppStore((state) => state.sortType);
  const setSortType = useAppStore((state) => state.setSortType);
  const users = useAppStore((state) => state.users);
  const matches = useAppStore((state) => state.matches);
  const bets = useAppStore((state) => state.bets);
  const refreshData = useAppStore((state) => state.refreshData);

  const [activeTab, setActiveTab] = useState<TabType>('totalWin');

  const pullStartY = useRef<number>(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const canPull = useRef(false);

  const rankings = useMemo(
    () => calculateRankings(users, bets, sortType),
    [users, bets, sortType]
  );

  const podiumRankings = useMemo(
    () => calculateRankings(users, bets, 'totalWin'),
    [users, bets]
  );

  const dailyTrend = useMemo(
    () => calculateDailyTrend(users, bets),
    [users, bets]
  );

  const dailyStarUserId = useMemo(
    () => getDailyStarUserId(bets),
    [bets]
  );

  const todayStr = getTodayStr();

  const finishedMatches = matches.filter((m) => m.status === 'finished').length;
  const totalMatches = matches.length;
  const remainingMatches = totalMatches - finishedMatches;
  const totalWinAmount = bets
    .filter((b) => (b.winAmount ?? 0) > 0)
    .reduce((sum, b) => sum + (b.winAmount ?? 0), 0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY <= 0) {
        canPull.current = true;
        pullStartY.current = e.touches[0].clientY;
      } else {
        canPull.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPull.current || isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - pullStartY.current;
      const scrollY = window.scrollY || window.pageYOffset;

      if (diff > 0 && scrollY <= 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const distance = Math.min(diff * 0.5, PULL_MAX);
        setPullDistance(distance);
      } else if (diff <= 0) {
        canPull.current = false;
      }
    };

    const handleTouchEnd = async () => {
      if (!canPull.current || isRefreshing) {
        canPull.current = false;
        return;
      }

      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        try {
          await refreshData();
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 400);
        }
      } else {
        setPullDistance(0);
      }
      canPull.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isRefreshing, pullDistance, refreshData]);

  return (
    <div className="max-w-5xl mx-auto">
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: isRefreshing ? 50 : pullDistance,
          transition: isRefreshing || pullDistance === 0 ? 'height 300ms ease-out' : 'none',
          opacity: isRefreshing || pullDistance > 0 ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2 text-primary-500 text-sm">
          <RefreshCw
            size={18}
            className={isRefreshing ? 'animate-spin' : ''}
            style={{
              transform: isRefreshing ? undefined : `rotate(${pullDistance * 2}deg)`,
            }}
          />
          <span>
            {isRefreshing
              ? '刷新中...'
              : pullDistance >= PULL_THRESHOLD
              ? '释放刷新'
              : '下拉刷新'}
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 md:mb-12"
      >
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-gradient-gold mb-2 md:mb-3">
          世界杯中奖排行榜
        </h1>
        <p className="text-neutral-500 dark:text-neutral-500 text-sm md:text-base">
          群雄逐鹿，谁是真正的预言家？
        </p>

        <div className="flex items-center justify-center gap-3 sm:gap-5 md:gap-8 mt-5 md:mt-6">
          <div className="text-center">
            <p className="font-display text-xl sm:text-2xl md:text-3xl text-primary-500">{rankings.length}</p>
            <p className="text-xs sm:text-sm md:text-sm text-neutral-500 dark:text-neutral-500">参赛人数</p>
          </div>
          <div className="w-px h-7 sm:h-9 md:h-10 bg-primary/20" />
          <div className="text-center">
            <p className="font-display text-xl sm:text-2xl md:text-3xl text-primary-500">{bets.length}</p>
            <p className="text-xs sm:text-sm md:text-sm text-neutral-500 dark:text-neutral-500">记录总数</p>
          </div>
          <div className="w-px h-7 sm:h-9 md:h-10 bg-primary/20" />
          <div className="text-center">
            <p className="font-display text-xl sm:text-2xl md:text-3xl text-primary-500">{finishedMatches}/{remainingMatches}</p>
            <p className="text-xs sm:text-sm md:text-sm text-neutral-500 dark:text-neutral-500">已赛/剩余场次</p>
          </div>
          <div className="w-px h-7 sm:h-9 md:h-10 bg-primary/20" />
          <div className="text-center">
            <p className="font-display text-xl sm:text-2xl md:text-3xl text-amber-600 dark:text-gold-400">¥{totalWinAmount.toFixed(2)}</p>
            <p className="text-xs sm:text-sm md:text-sm text-neutral-500 dark:text-neutral-500">中奖总额</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <RankingPodium rankings={podiumRankings} dailyStarUserId={dailyStarUserId} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.type;
            const handleClick = () => {
              if (tab.type === 'trend') {
                setActiveTab('trend');
              } else {
                setActiveTab(tab.type);
                setSortType(tab.type);
              }
            };
            return (
              <button
                key={tab.type}
                onClick={handleClick}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.replace('总额', '').replace('走势', '').replace('总数', '')}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'trend' ? (
            <motion.div
              key="trend"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TrendChart data={dailyTrend} dailyStarUserId={dailyStarUserId} />
            </motion.div>
          ) : (
            <motion.div
              key="ranking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RankingList rankings={rankings} sortType={sortType} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default RankingPage;
