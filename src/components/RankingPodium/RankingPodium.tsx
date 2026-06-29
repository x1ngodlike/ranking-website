import { Link } from 'react-router-dom';
import type { RankingItem } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { motion } from 'framer-motion';
import { isImageAvatar } from '@/components/Avatar';
import { RARITY_STYLES, BadgeRarity } from '@/utils/badges';

interface RankingPodiumProps {
  rankings: RankingItem[];
}

const podiumConfig = [
  { rank: 2, height: 'h-28', medal: '🥈', glow: 'from-gray-300 to-gray-500' },
  { rank: 1, height: 'h-36', medal: '🏆', glow: 'from-gold-300 to-gold-600' },
  { rank: 3, height: 'h-20', medal: '🥉', glow: 'from-amber-600 to-amber-800' },
];

const RankingPodium = ({ rankings }: RankingPodiumProps) => {
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
                <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${config.glow} shadow-lg group-hover:scale-110 transition-transform overflow-hidden flex items-center justify-center text-3xl md:text-4xl`}>
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
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-neutral-800 border-2 border-neutral-100 dark:border-neutral-700 flex items-center justify-center text-base font-bold">
                <span className={config.rank === 1 ? 'text-gold-600' : config.rank === 2 ? 'text-neutral-500' : 'text-amber-700'}>
                  {config.rank}
                </span>
              </div>
              </div>

              <p className="font-display text-lg md:text-xl text-neutral-800 dark:text-neutral-200 mb-1 text-center">
                {item.nickname}
              </p>

              {item.topBadges && item.topBadges.length > 0 && (
                <div className="flex items-center gap-1 mb-1">
                  {item.topBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${RARITY_STYLES[badge.rarity as BadgeRarity].borderColor} ${RARITY_STYLES[badge.rarity as BadgeRarity].bgColor} ${RARITY_STYLES[badge.rarity as BadgeRarity].animation}`}
                      title={badge.name}
                    >
                      <span className="text-sm">{badge.emoji}</span>
                    </div>
                  ))}
                </div>
              )}

              <p
                className={`text-xl md:text-2xl font-bold text-amber-600 dark:text-gold-400`}
              >
                ¥{item.totalWinAmount.toFixed(2)}
              </p>
            </Link>

            <div
              className={`w-24 md:w-32 ${config.height} mt-3 rounded-t-xl bg-gradient-to-t from-white dark:from-neutral-800 to-neutral-100 dark:to-neutral-700 border-t border-x border-gold/20 flex items-start justify-center pt-3 relative overflow-hidden`}
            >
              <div className="text-4xl md:text-5xl animate-float">
                {config.medal}
              </div>
              <div
                className={`absolute inset-0 bg-gradient-to-t ${config.glow} opacity-10`}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default RankingPodium;
