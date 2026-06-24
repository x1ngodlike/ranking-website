import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { calculateRankings } from '@/utils/calculations';
import { Trophy, Hash } from 'lucide-react';
import RankingPodium from '@/components/RankingPodium/RankingPodium';
import RankingList from '@/components/RankingList/RankingList';
import type { RankingSortType } from '@/types';
import { motion } from 'framer-motion';

const tabs: { type: RankingSortType; label: string; icon: typeof Trophy }[] = [
  { type: 'totalWin', label: '中奖总额', icon: Trophy },
  { type: 'totalBets', label: '记录总数', icon: Hash },
];

const RankingPage = () => {
  const sortType = useAppStore((state) => state.sortType);
  const setSortType = useAppStore((state) => state.setSortType);
  const users = useAppStore((state) => state.users);
  const matches = useAppStore((state) => state.matches);
  const bets = useAppStore((state) => state.bets);

  const rankings = useMemo(
    () => calculateRankings(users, bets, sortType),
    [users, bets, sortType]
  );

  const finishedMatches = matches.filter((m) => m.status === 'finished').length;
  const totalWinAmount = bets
    .filter((b) => (b.winAmount ?? 0) > 0)
    .reduce((sum, b) => sum + (b.winAmount ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto">
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
            <p className="font-display text-xl sm:text-2xl md:text-3xl text-primary-500">{finishedMatches}</p>
            <p className="text-xs sm:text-sm md:text-sm text-neutral-500 dark:text-neutral-500">已赛场次</p>
          </div>
          <div className="w-px h-7 sm:h-9 md:h-10 bg-primary/20" />
          <div className="text-center">
            <p className="font-display text-xl sm:text-2xl md:text-3xl text-primary-500">{bets.length}</p>
            <p className="text-xs sm:text-sm md:text-sm text-neutral-500 dark:text-neutral-500">记录总数</p>
          </div>
          <div className="w-px h-7 sm:h-9 md:h-10 bg-primary/20" />
          <div className="text-center">
            <p className="font-display text-xl sm:text-2xl md:text-3xl text-amber-600 dark:text-gold-400">¥{totalWinAmount.toFixed(0)}</p>
            <p className="text-xs sm:text-sm md:text-sm text-neutral-500 dark:text-neutral-500">中奖总额</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <RankingPodium rankings={rankings} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = sortType === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => setSortType(tab.type)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <RankingList rankings={rankings} sortType={sortType} />
      </motion.div>
    </div>
  );
};

export default RankingPage;
