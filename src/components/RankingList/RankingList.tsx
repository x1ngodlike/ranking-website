import { Link } from 'react-router-dom';
import type { RankingItem, RankingSortType } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { motion } from 'framer-motion';
import Avatar from '@/components/Avatar';
import { RARITY_STYLES, BadgeRarity } from '@/utils/badges';

interface RankingListProps {
  rankings: RankingItem[];
  sortType: RankingSortType;
}

const RankingList = ({ rankings, sortType }: RankingListProps) => {
  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return 'badge-rank-1';
    if (rank === 2) return 'badge-rank-2';
    if (rank === 3) return 'badge-rank-3';
    return 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400';
  };

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800/50">
              <th className="text-left py-3 px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium">
                排名
              </th>
              <th className="text-left py-3 px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium">
                用户
              </th>
              <th className="text-right py-3 px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium">
                {sortType === 'totalWin' && '中奖总额'}
                {sortType === 'winDays' && '中奖天数'}
                {sortType === 'totalBets' && '记录总数'}
              </th>
              <th className="text-right py-3 px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium hidden md:table-cell">
                平均中奖
              </th>
              <th className="text-right py-3 px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium hidden sm:table-cell">
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
                className="border-b border-gold/5 hover:bg-gold-500/5 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className={`badge-rank ${getRankBadgeClass(index + 1)}`}>
                    {index + 1}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <Link
                    to={`/profile/${item.userId}`}
                    className="flex items-center gap-3 group"
                  >
                    <Avatar src={item.avatar} alt={item.nickname} size="md" />
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-primary-500 transition-colors">
                        {item.nickname}
                      </p>
                      {item.topBadges && item.topBadges.length > 0 ? (
                        <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5">
                          {item.topBadges.map((badge) => (
                            <div
                              key={badge.id}
                              className={`flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 rounded-full border ${RARITY_STYLES[badge.rarity as BadgeRarity].borderColor} ${RARITY_STYLES[badge.rarity as BadgeRarity].bgColor} ${RARITY_STYLES[badge.rarity as BadgeRarity].animation}`}
                              title={badge.name}
                            >
                              <span className="text-[10px] sm:text-xs">{badge.emoji}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">
                          中奖 {item.winDays} 天
                        </p>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="py-4 px-4 text-right">
                  {sortType === 'totalWin' && (
                    <span className="font-bold text-lg text-amber-600 dark:text-gold-400">
                      ¥{item.totalWinAmount.toFixed(2)}
                    </span>
                  )}
                  {sortType === 'winDays' && (
                    <span className="font-bold text-lg text-profit-500">
                      {item.winDays} 天
                    </span>
                  )}
                  {sortType === 'totalBets' && (
                    <span className="font-bold text-lg text-neutral-800 dark:text-neutral-200">
                      {item.totalBets} 条
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-right hidden md:table-cell">
                  <span className="text-sm text-amber-600 dark:text-gold-400">
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
