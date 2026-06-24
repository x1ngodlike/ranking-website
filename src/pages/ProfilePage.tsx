import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { calculateRankings, getDailyProfitLoss } from '@/utils/calculations';
import { formatCurrency } from '@/utils/helpers';
import { ProfitChart } from '@/components/Charts/ProfitChart';
import BetList from '@/components/BetList/BetList';
import { ArrowLeft, TrendingUp, TrendingDown, Trophy, DollarSign, Calendar, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import Avatar from '@/components/Avatar';

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const users = useAppStore((state) => state.users);
  const bets = useAppStore((state) => state.bets);

  const rankings = useMemo(
    () => calculateRankings(users, bets, 'profit'),
    [users, bets]
  );

  const user = users.find((u) => u.id === userId);
  const ranking = rankings.find((r) => r.userId === userId);
  const rankIndex = rankings.findIndex((r) => r.userId === userId);

  const userBets = useMemo(() => {
    return bets
      .filter((b) => b.userId === userId)
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [bets, userId]);

  const dailyData = useMemo(
    () => (userId ? getDailyProfitLoss(userId, bets) : []),
    [userId, bets]
  );

  if (!user || !ranking) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-neutral-500 dark:text-neutral-500 text-lg">用户不存在</p>
        <Link to="/" className="btn-primary inline-block mt-6">
          返回排行榜
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-neutral-500 dark:text-neutral-500 hover:text-primary-400 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          返回排行榜
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="card mb-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            <Avatar src={user.avatar} alt={user.nickname} size="xl" className="border-2 border-primary/30" />
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gold-500 text-neutral-900 dark:text-neutral-100 flex items-center justify-center font-bold text-lg shadow-lg">
              #{rankIndex + 1}
            </div>
          </div>

          <div className="flex-1">
            <h1 className="font-display text-4xl text-gradient-gold mb-1">
              {user.nickname}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-500">
              {user.isAdmin ? '管理员' : '普通成员'}
            </p>

            <div className="flex items-center gap-6 mt-4 flex-wrap">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">总盈亏</p>
                <p
                  className={`font-display text-3xl ${
                    ranking.totalProfitLoss >= 0
                      ? 'text-profit-500'
                      : 'text-loss-500'
                  }`}
                >
                  {formatCurrency(ranking.totalProfitLoss)}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">回报率</p>
                <p
                  className={`font-display text-3xl ${
                    ranking.avgReturn >= 0 ? 'text-profit-500' : 'text-loss-500'
                  }`}
                >
                  {ranking.avgReturn >= 0 ? '+' : ''}{ranking.avgReturn.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">总投注</p>
                <p className="font-display text-3xl text-neutral-800 dark:text-neutral-200">
                  ¥{ranking.totalAmount.toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="card p-4">
          <div className="flex items-center gap-2 text-profit-500 mb-2">
            <TrendingUp size={20} />
            <span className="text-sm">最大盈利</span>
          </div>
          <p className="font-display text-2xl text-profit-500">
            +¥{ranking.biggestWin.toFixed(0)}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-loss-500 mb-2">
            <TrendingDown size={20} />
            <span className="text-sm">最大亏损</span>
          </div>
          <p className="font-display text-2xl text-loss-500">
            ¥{ranking.biggestLoss.toFixed(0)}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-profit-500 mb-2">
            <Trophy size={20} />
            <span className="text-sm">盈利天数</span>
          </div>
          <p className="font-display text-2xl text-neutral-800 dark:text-neutral-200">
            {ranking.winDays}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 mb-2">
            <Calendar size={20} />
            <span className="text-sm">记录天数</span>
          </div>
          <p className="font-display text-2xl text-neutral-800 dark:text-neutral-200">
            {ranking.totalBets}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="card mb-8"
      >
        <h3 className="font-display text-xl text-gradient-gold mb-4">
          盈亏走势
        </h3>
        <ProfitChart data={dailyData} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="font-display text-2xl text-gradient-gold mb-4">
          投注记录
        </h2>
        <BetList bets={userBets} showUser={false} />
      </motion.div>
    </div>
  );
};

export default ProfilePage;
