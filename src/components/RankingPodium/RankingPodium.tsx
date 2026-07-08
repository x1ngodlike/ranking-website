import { Link } from 'react-router-dom';
import type { RankingItem } from '@/types';
import { motion } from 'framer-motion';
import { isImageAvatar } from '@/components/Avatar';
import { RARITY_STYLES, BadgeRarity } from '@/utils/badges';
import { getBadgeIconSrc } from '@/utils/badgeIcons';
import { TrendingUp, Minus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface RankingPodiumProps {
  rankings: RankingItem[];
  dailyStarUserId?: string | null;
  todayWinUsers?: Set<string>;
}

const podiumConfig = [
  { rank: 2, height: 'h-28', medal: '🥈', glow: 'from-gray-300 to-gray-500' },
  { rank: 1, height: 'h-36', medal: '🏆', glow: 'from-gold-300 to-gold-600' },
  { rank: 3, height: 'h-20', medal: '🥉', glow: 'from-amber-600 to-amber-800' },
];

const RankingPodium = ({ rankings, dailyStarUserId, todayWinUsers }: RankingPodiumProps) => {
  const designVersion = useAppStore((state) => state.designVersion);
  const top3 = rankings.slice(0, 3);

  if (top3.length === 0) return null;

  const getPodiumItem = (rank: number) => {
    const item = top3.find((r, idx) => {
      if (rank === 1) return idx === 0;
      if (rank === 2) return idx === 1;
      if (rank === 3) return idx === 2;
      return false;
    });
    return item;
  };

  return (
    <div className="flex items-end justify-center gap-4 md:gap-8 mb-12">
      {podiumConfig.map((config) => {
        const item = getPodiumItem(config.rank);
        if (!item) return <div key={config.rank} className="w-24 md:w-32" />;

        return (
          <motion.div
            key={config.rank}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: config.rank === 1 ? 0.2 : 0.4 }}
            className="flex flex-col items-center"
          >
            <Link
              to={`/profile/${item.userId}`}
              className="flex flex-col items-center group"
            >
              <div className="relative mb-3">
                <div className="relative w-14 h-14 md:w-20 md:h-20">
                  <div className={`w-full h-full rounded-full ${
                    designVersion === 'v2'
                      ? config.rank === 1
                        ? 'bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 ring-2 ring-yellow-300/50'
                        : config.rank === 2
                          ? 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 ring-2 ring-gray-200/50'
                          : 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 ring-2 ring-amber-400/50'
                      : `bg-gradient-to-br ${config.glow}`
                  } shadow-lg group-hover:scale-110 transition-transform overflow-hidden flex items-center justify-center text-3xl md:text-4xl`}>
                    {isImageAvatar(item.avatar) ? (
                      <img
                        src={item.avatar}
                        alt={item.nickname}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      item.avatar
                    )}
                  </div>
                  {dailyStarUserId === item.userId && (
                    <div
                      className="absolute left-0 right-0 flex justify-center z-10 pointer-events-none"
                      style={{ top: -14 }}
                      title="今日之星"
                    >
                      <span className="text-2xl md:text-3xl animate-bounce leading-none">👑</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 mb-1">
                <p className={
                  designVersion === 'v2'
                    ? 'font-v2-display font-semibold text-neutral-800 dark:text-neutral-200 text-center'
                    : 'font-display text-lg md:text-xl text-neutral-800 dark:text-neutral-200 text-center'
                }>
                  {item.nickname}
                </p>
                {todayWinUsers && todayWinUsers.has(item.userId) ? (
                  <TrendingUp size={14} className="text-profit-500 flex-shrink-0" />
                ) : (
                  <Minus size={14} className="text-neutral-400 flex-shrink-0" />
                )}
              </div>

              <p
                className={
                  designVersion === 'v2'
                    ? `font-v2-mono font-bold mb-1 text-xl md:text-2xl ${
                        config.rank === 1
                          ? 'text-amber-600 dark:text-yellow-400'
                          : config.rank === 2
                            ? 'text-gray-600 dark:text-gray-300'
                            : 'text-amber-700 dark:text-amber-500'
                      }`
                    : 'font-display text-xl md:text-2xl text-amber-600 dark:text-gold-400 mb-1'
                }
              >
                ¥{item.totalWinAmount.toFixed(2)}
              </p>

              {item.topBadges && item.topBadges.length > 0 && (
                <div className="flex items-center gap-1">
                  {item.topBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border overflow-hidden ${RARITY_STYLES[badge.rarity as BadgeRarity].borderColor} ${RARITY_STYLES[badge.rarity as BadgeRarity].bgColor} ${RARITY_STYLES[badge.rarity as BadgeRarity].animation}`}
                      title={badge.name}
                    >
                      <img src={getBadgeIconSrc(badge.id)} alt={badge.name} className="w-full h-full object-cover rounded-full" />
                    </div>
                  ))}
                </div>
              )}
            </Link>

            <div
              className={`w-24 md:w-32 ${config.height} mt-3 rounded-t-xl ${
                designVersion === 'v2'
                  ? config.rank === 1
                    ? 'bg-gradient-to-t from-yellow-500 to-yellow-400'
                    : config.rank === 2
                      ? 'bg-gradient-to-t from-gray-500 to-gray-400'
                      : 'bg-gradient-to-t from-amber-700 to-amber-600'
                  : 'bg-gradient-to-t from-white dark:from-neutral-800 to-neutral-100 dark:to-neutral-700 border-t border-x border-gold/20'
              } flex items-start justify-center pt-3 relative overflow-hidden`}
            >
              {designVersion === 'v2' ? (
                <span className="font-v2-display text-2xl md:text-3xl font-bold text-white/90">
                  #{config.rank}
                </span>
              ) : (
                <>
                  <div className="text-4xl md:text-5xl animate-float">
                    {config.medal}
                  </div>
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${config.glow} opacity-10`}
                  />
                </>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default RankingPodium;
