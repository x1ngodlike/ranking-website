import { Link } from 'react-router-dom';
import type { RankingItem, RankingSortType } from '@/types';
import { formatCurrency } from '@/utils/helpers';
import { motion } from 'framer-motion';
import Avatar from '@/components/Avatar';

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
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              <th className="text-left py-3 px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium">
                排名
              </th>
              <th className="text-left py-3 px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium">
                用户
              </th>
              <th className="text-right py-3 px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium">
                {sortType === 'profit' && '总盈亏'}
                {sortType === 'avgReturn' && '回报率'}
                {sortType === 'totalBets' && '投注天数'}
              </th>
              <th className="text-right py-3 px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium hidden md:table-cell">
                回报率
              </th>
              <th className="text-right py-3 px-4 text-neutral-500 dark:text-neutral-500 text-sm font-medium hidden sm:table-cell">
                总投注
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
                      <p className="font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-gold-400 transition-colors">
                        {item.nickname}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500">
                        盈利 {item.winDays} 天 / 亏损 {item.lossDays} 天
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="py-4 px-4 text-right">
                  {sortType === 'profit' && (
                    <span
                      className={`font-bold text-lg ${
                        item.totalProfitLoss >= 0
                          ? 'text-profit-500'
                          : 'text-loss-500'
                      }`}
                    >
                      {formatCurrency(item.totalProfitLoss)}
                    </span>
                  )}
                  {sortType === 'avgReturn' && (
                    <span
                      className={`font-bold text-lg ${
                        item.avgReturn >= 0 ? 'text-profit-500' : 'text-loss-500'
                      }`}
                    >
                      {item.avgReturn >= 0 ? '+' : ''}{item.avgReturn.toFixed(1)}%
                    </span>
                  )}
                  {sortType === 'totalBets' && (
                    <span className="font-bold text-lg text-neutral-800 dark:text-neutral-200">
                      {item.totalBets} 天
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-right hidden md:table-cell">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-20 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.avgReturn >= 0
                            ? 'bg-gradient-to-r from-profit-500 to-profit-400'
                            : 'bg-gradient-to-r from-loss-500 to-loss-400'
                        }`}
                        style={{ width: `${Math.min(Math.abs(item.avgReturn), 100)}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm ${
                        item.avgReturn >= 0 ? 'text-profit-500' : 'text-loss-500'
                      }`}
                    >
                      {item.avgReturn >= 0 ? '+' : ''}{item.avgReturn.toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right text-neutral-600 dark:text-neutral-400 text-sm hidden sm:table-cell">
                  ¥{item.totalAmount.toFixed(0)}
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
