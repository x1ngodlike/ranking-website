import { Link } from 'react-router-dom';
import type { RankingItem, RankingSortType } from '@/types';
import { motion } from 'framer-motion';
import Avatar from '@/components/Avatar';
import { RARITY_STYLES, BadgeRarity } from '@/utils/badges';
import { getBadgeIconSrc } from '@/utils/badgeIcons';
import { TrendingUp, Minus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface RankingListProps {
  rankings: RankingItem[];
  sortType: RankingSortType;
  todayWinUsers?: Set<string>;
}

const RankingList = ({ rankings, sortType, todayWinUsers }: RankingListProps) => {
  const designVersion = useAppStore((state) => state.designVersion);

  if (rankings.length === 0) {
    return (
      <section
        className={designVersion === 'v2' ? 'rounded-xl p-8 border border-[var(--v2-border)] bg-[var(--v2-bg-card)] text-center' : 'card p-8 text-center'}
        aria-labelledby="ranking-empty-title"
      >
        <h2 id="ranking-empty-title" className="text-base font-medium text-neutral-700 dark:text-neutral-200">
          暂无排行数据
        </h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          管理员添加成员和投注记录后，排行会自动生成。
        </p>
      </section>
    );
  }

  const getRankBadgeClass = (rank: number) => {
    if (designVersion === 'v2') {
      if (rank === 1) return 'rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900';
      if (rank === 2) return 'rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700';
      if (rank === 3) return 'rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white';
      return 'rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400';
    }
    if (rank === 1) return 'badge-rank-1';
    if (rank === 2) return 'badge-rank-2';
    if (rank === 3) return 'badge-rank-3';
    return 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400';
  };

  return (
    <div className={designVersion === 'v2' ? 'rounded-xl p-5 border border-[var(--v2-border)] bg-[var(--v2-bg-card)]' : 'card'}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800/50">
              <th className={
                designVersion === 'v2'
                  ? 'text-left py-3 px-2 sm:px-4 font-v2-body text-xs font-semibold text-[var(--v2-text-secondary)] uppercase tracking-wider'
                  : 'text-left py-3 px-2 sm:px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium'
              }>
                排名
              </th>
              <th className={
                designVersion === 'v2'
                  ? 'text-left py-3 px-2 sm:px-4 font-v2-body text-xs font-semibold text-[var(--v2-text-secondary)] uppercase tracking-wider'
                  : 'text-left py-3 px-2 sm:px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium'
              }>
                用户
              </th>
              <th className={
                designVersion === 'v2'
                  ? 'text-right py-3 px-4 font-v2-body text-xs font-semibold text-[var(--v2-text-secondary)] uppercase tracking-wider'
                  : 'text-right py-3 px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium'
              }>
                {sortType === 'totalWin' && '中奖总额'}
                {sortType === 'winDays' && '中奖天数'}
                {sortType === 'totalBets' && '记录总数'}
              </th>
              <th className={
                designVersion === 'v2'
                  ? 'text-right py-3 px-4 font-v2-body text-xs font-semibold text-[var(--v2-text-secondary)] uppercase tracking-wider hidden md:table-cell'
                  : 'text-right py-3 px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium hidden md:table-cell'
              }>
                平均中奖
              </th>
              <th className={
                designVersion === 'v2'
                  ? 'text-right py-3 px-4 font-v2-body text-xs font-semibold text-[var(--v2-text-secondary)] uppercase tracking-wider hidden sm:table-cell'
                  : 'text-right py-3 px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium hidden sm:table-cell'
              }>
                记录数
              </th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((item, index) => (
              <motion.tr
                key={item.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`border-b border-gold/5 ${
                  designVersion === 'v2'
                    ? 'hover:bg-v2-primary-500/3'
                    : 'hover:bg-gold-500/5'
                } transition-colors`}
              >
                <td className="py-4 px-2 sm:px-4">
                  <div className={`badge-rank ${getRankBadgeClass(index + 1)}`}>
                    {index + 1}
                  </div>
                </td>
                <td className="py-4 px-2 sm:px-4">
                  <Link
                    to={`/profile/${item.userId}`}
                    className="flex items-center gap-2 sm:gap-3 group"
                  >
                    <Avatar src={item.avatar} alt={item.nickname} size="sm" className="sm:w-[60px] sm:h-[60px] sm:text-2xl" />
                    <div>
                      <div className="flex items-center gap-1">
                        <p className={
                          designVersion === 'v2'
                            ? 'font-v2-body font-medium text-[var(--v2-text)] group-hover:text-v2-primary-500 transition-colors'
                            : 'font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-primary-500 transition-colors'
                        }>
                          {item.nickname}
                        </p>
                        {todayWinUsers && todayWinUsers.has(item.userId) ? (
                          <TrendingUp size={13} className="text-profit-500 flex-shrink-0" />
                        ) : (
                          <Minus size={13} className="text-neutral-400 flex-shrink-0" />
                        )}
                      </div>
                      {item.topBadges && item.topBadges.length > 0 ? (
                        <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5">
                          {item.topBadges.map((badge) => (
                            <div
                              key={badge.id}
                              className={`flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 rounded-full border overflow-hidden ${RARITY_STYLES[badge.rarity as BadgeRarity].borderColor} ${RARITY_STYLES[badge.rarity as BadgeRarity].bgColor} ${RARITY_STYLES[badge.rarity as BadgeRarity].animation}`}
                              title={badge.name}
                            >
                              <img src={getBadgeIconSrc(badge.id)} alt={badge.name} className="w-full h-full object-cover rounded-full" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={
                          designVersion === 'v2'
                            ? 'font-v2-body text-xs text-[var(--v2-text-secondary)]'
                            : 'text-xs text-neutral-500 dark:text-neutral-500'
                        }>
                          中奖 {item.winDays} 天
                        </p>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="py-4 px-4 text-right">
                  {sortType === 'totalWin' && (
                    <span className={
                      designVersion === 'v2'
                        ? 'font-v2-mono font-bold text-lg text-profit-500'
                        : 'font-display text-lg text-amber-600 dark:text-gold-400'
                    }>
                      ¥{item.totalWinAmount.toFixed(2)}
                    </span>
                  )}
                  {sortType === 'winDays' && (
                    <span className={
                      designVersion === 'v2'
                        ? 'font-v2-mono font-bold text-lg text-profit-500'
                        : 'font-bold text-lg text-profit-500'
                    }>
                      {item.winDays} 天
                    </span>
                  )}
                  {sortType === 'totalBets' && (
                    <span className={
                      designVersion === 'v2'
                        ? 'font-v2-mono font-bold text-lg text-neutral-800 dark:text-neutral-200'
                        : 'font-bold text-lg text-neutral-800 dark:text-neutral-200'
                    }>
                      {item.totalBets} 条
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-right hidden md:table-cell">
                  <span className={
                      designVersion === 'v2'
                        ? 'font-v2-mono text-sm text-profit-500'
                        : 'font-display text-sm text-amber-600 dark:text-gold-400'
                  }>
                    ¥{item.avgWin.toFixed(2)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right text-neutral-600 dark:text-neutral-400 text-sm hidden sm:table-cell">
                  {item.totalBets} 条
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
  );
};

export default RankingList;
