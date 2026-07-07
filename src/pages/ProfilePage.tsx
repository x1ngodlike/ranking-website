import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { calculateRankings, getDailyWinAmount } from '@/utils/calculations';
import { ProfitChart } from '@/components/Charts/ProfitChart';
import BetList from '@/components/BetList/BetList';
import BetForm from '@/components/BetForm/BetForm';
import BadgeDisplay from '@/components/BadgeDisplay/BadgeDisplay';
import { ArrowLeft, TrendingUp, Trophy, DollarSign, Calendar, Plus, Award, Flame, Heart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '@/components/Avatar';

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const users = useAppStore((state) => state.users);
  const bets = useAppStore((state) => state.bets);
  const designVersion = useAppStore((s) => s.designVersion);
  const [showForm, setShowForm] = useState(false);

  const rankings = useMemo(
    () => calculateRankings(users, bets, 'totalWin'),
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
    () => (userId ? getDailyWinAmount(userId, bets) : []),
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
            <Avatar src={user.avatar} alt={user.nickname} size="xl" className={designVersion === 'v2' ? 'border-2 border-primary/30 ring-2 ring-gray-400' : 'border-2 border-primary/30'} />
            <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gold-500 text-neutral-900 dark:text-neutral-100 flex items-center justify-center font-bold text-lg shadow-lg ${designVersion === 'v2' ? 'font-v2-mono' : ''}`}>
              #{rankIndex + 1}
            </div>
          </div>

          <div className="flex-1">
            <h1 className={designVersion === 'v2' ? 'font-v2-display font-bold text-2xl md:text-3xl text-[var(--v2-text)] mb-1' : 'font-display text-4xl text-blue-600 dark:text-blue-400 mb-1'}>
              {user.nickname}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-500">
              {user.isAdmin ? '管理员' : '普通成员'}
            </p>

            <div className="flex items-center gap-6 mt-4 flex-wrap">
              <div>
                <p className={designVersion === 'v2' ? 'font-v2-body text-xs text-[var(--v2-text-secondary)]' : 'text-sm text-neutral-500 dark:text-neutral-500'}>中奖总额</p>
                <p className={designVersion === 'v2' ? 'font-v2-mono font-bold text-xl md:text-2xl text-profit-500' : 'font-display text-3xl text-amber-600 dark:text-gold-400'}>
                  ¥{ranking.totalWinAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className={designVersion === 'v2' ? 'font-v2-body text-xs text-[var(--v2-text-secondary)]' : 'text-sm text-neutral-500 dark:text-neutral-500'}>平均中奖</p>
                <p className={designVersion === 'v2' ? 'font-v2-mono font-bold text-xl md:text-2xl text-v2-primary-500 dark:text-v2-primary-400' : 'font-display text-3xl text-blue-600 dark:text-blue-400'}>
                  ¥{ranking.avgWin.toFixed(2)}
                </p>
              </div>
              <div>
                <p className={designVersion === 'v2' ? 'font-v2-body text-xs text-[var(--v2-text-secondary)]' : 'text-sm text-neutral-500 dark:text-neutral-500'}>记录总数</p>
                <p className={designVersion === 'v2' ? 'font-v2-mono font-bold text-xl md:text-2xl text-v2-primary-500 dark:text-v2-primary-400' : 'font-display text-3xl text-neutral-800 dark:text-neutral-200'}>
                  {ranking.totalBets}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/report/${userId}`)}
              className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold px-5 py-2.5 rounded-full hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20"
            >
              <Sparkles size={18} />
              生成我的中奖报告
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className={designVersion === 'v2' ? 'rounded-xl p-4 border border-[var(--v2-border)] bg-[var(--v2-bg-card)]' : 'card p-4'}>
          <div className={`flex items-center gap-2 ${designVersion === 'v2' ? 'text-profit-500' : 'text-amber-600 dark:text-gold-400'} mb-2`}>
            <Trophy size={20} />
            <span className={designVersion === 'v2' ? 'font-v2-body text-xs text-[var(--v2-text-secondary)]' : 'text-sm'}>最大中奖</span>
          </div>
          <p className={designVersion === 'v2' ? 'font-v2-mono font-bold text-xl md:text-2xl text-profit-500' : 'font-display text-2xl text-amber-600 dark:text-gold-400'}>
            ¥{ranking.biggestWin.toFixed(2)}
          </p>
        </div>
        <div className={designVersion === 'v2' ? 'rounded-xl p-4 border border-[var(--v2-border)] bg-[var(--v2-bg-card)]' : 'card p-4'}>
          <div className={`flex items-center gap-2 text-profit-500 mb-2`}>
            <TrendingUp size={20} />
            <span className={designVersion === 'v2' ? 'font-v2-body text-xs text-[var(--v2-text-secondary)]' : 'text-sm'}>中奖天数</span>
          </div>
          <p className={designVersion === 'v2' ? 'font-v2-mono font-bold text-xl md:text-2xl text-profit-500' : 'font-display text-2xl text-profit-500'}>
            {ranking.winDays}
          </p>
        </div>
        <div className={designVersion === 'v2' ? 'rounded-xl p-4 border border-[var(--v2-border)] bg-[var(--v2-bg-card)]' : 'card p-4'}>
          <div className={`flex items-center gap-2 ${designVersion === 'v2' ? 'text-orange-500' : 'text-orange-500 dark:text-orange-400'} mb-2`}>
            <Flame size={20} />
            <span className={designVersion === 'v2' ? 'font-v2-body text-xs text-[var(--v2-text-secondary)]' : 'text-sm'}>连胜天数</span>
          </div>
          <p className={designVersion === 'v2' ? 'font-v2-mono font-bold text-xl md:text-2xl text-orange-500' : 'font-display text-2xl text-neutral-800 dark:text-neutral-200'}>
            {ranking.maxStreak}
          </p>
        </div>
        <div className={designVersion === 'v2' ? 'rounded-xl p-4 border border-[var(--v2-border)] bg-[var(--v2-bg-card)]' : 'card p-4'}>
          <div className={`flex items-center gap-2 text-rose-500 dark:text-rose-400 mb-2`}>
            <Heart size={20} />
            <span className={designVersion === 'v2' ? 'font-v2-body text-xs text-[var(--v2-text-secondary)]' : 'text-sm'}>最佳CP</span>
          </div>
          {ranking.bestCP ? (
            <div className="flex items-center gap-2">
              <Avatar src={ranking.bestCP.avatar} alt={ranking.bestCP.nickname} size="sm" />
              <span className={designVersion === 'v2' ? 'font-v2-body font-semibold text-base text-[var(--v2-text)]' : 'font-display text-xl text-neutral-800 dark:text-neutral-200'}>
                {ranking.bestCP.nickname}
              </span>
            </div>
          ) : (
            <p className={designVersion === 'v2' ? 'font-v2-body text-base text-[var(--v2-text-muted)]' : 'font-display text-xl text-neutral-400'}>暂无</p>
          )}
        </div>
      </motion.div>

      {/* 成就徽章 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className={designVersion === 'v2' ? 'rounded-xl p-5 border border-[var(--v2-border)] bg-[var(--v2-bg-card)] mb-8' : 'card mb-8'}
      >
        <h3 className={designVersion === 'v2' ? 'font-v2-display font-semibold text-lg text-[var(--v2-text)]' : 'font-display text-xl text-blue-600 dark:text-blue-400'}>
          成就徽章
        </h3>
        <BadgeDisplay userId={userId || ''} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className={designVersion === 'v2' ? 'rounded-xl p-5 border border-[var(--v2-border)] bg-[var(--v2-bg-card)] mb-8' : 'card mb-8'}
      >
        <h3 className={designVersion === 'v2' ? 'font-v2-display font-semibold text-lg text-[var(--v2-text)] mb-4' : 'font-display text-xl text-blue-600 dark:text-blue-400 mb-4'}>
          中奖走势
        </h3>
        <ProfitChart data={dailyData} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={designVersion === 'v2' ? 'font-v2-display font-bold text-2xl md:text-3xl text-[var(--v2-text)]' : 'font-display text-2xl text-blue-600 dark:text-blue-400'}>
            中奖记录
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className={`flex items-center gap-2 ${designVersion === 'v2' ? 'px-5 py-2.5 rounded-lg bg-profit-500 text-white font-v2-body font-bold text-sm hover:bg-profit-600 active:scale-[0.98] transition-all shadow-sm shadow-profit-500/25' : 'btn-gold'}`}
          >
            <Plus size={16} />
            新增记录
          </button>
        </div>
        <BetList bets={userBets} showUser={false} canDelete={true} />
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <BetForm onClose={() => setShowForm(false)} preSelectedUserId={userId} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
