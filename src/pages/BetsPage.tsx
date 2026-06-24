import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import BetForm from '@/components/BetForm/BetForm';
import BetList from '@/components/BetList/BetList';
import { Plus, Filter, X, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BetsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const bets = useAppStore((state) => state.bets);
  const users = useAppStore((state) => state.users);

  const sortedBets = useMemo(() => {
    return [...bets].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [bets]);

  const filteredBets = useMemo(() => {
    return sortedBets.filter((bet) => {
      if (filterUserId !== 'all' && bet.userId !== filterUserId) return false;
      return true;
    });
  }, [sortedBets, filterUserId]);

  const stats = useMemo(() => {
    const totalAmount = bets.reduce((sum, b) => sum + b.amount, 0);
    const totalProfit = bets.reduce((sum, b) => sum + (b.profitLoss ?? 0), 0);
    const winDays = bets.filter((b) => b.profitLoss !== undefined && b.profitLoss > 0).length;
    const lossDays = bets.filter((b) => b.profitLoss !== undefined && b.profitLoss < 0).length;
    const pendingDays = bets.filter((b) => b.profitLoss === undefined).length;

    return {
      total: bets.length,
      totalAmount,
      totalProfit,
      winDays,
      lossDays,
      pendingDays,
    };
  }, [bets]);

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="font-display text-4xl text-gradient-gold mb-2">
            投注记录
          </h1>
          <p className="text-neutral-500 dark:text-neutral-500">记录每一次心跳加速的时刻</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center gap-2"
          >
            <Filter size={18} />
            筛选
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center gap-2"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? '取消' : '新增记录'}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
      >
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-500 text-sm mb-2">
            <Calendar size={16} />
            <span>总天数</span>
          </div>
          <p className="font-display text-3xl text-neutral-800 dark:text-neutral-200">{stats.total}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-500 text-sm mb-2">
            <DollarSign size={16} />
            <span>总投注</span>
          </div>
          <p className="font-display text-3xl text-neutral-800 dark:text-neutral-200">
            ¥{stats.totalAmount.toFixed(0)}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-profit-500 text-sm mb-2">
            <TrendingUp size={16} />
            <span>盈利天数</span>
          </div>
          <p className="font-display text-3xl text-profit-500">{stats.winDays}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-loss-500 text-sm mb-2">
            <TrendingDown size={16} />
            <span>亏损天数</span>
          </div>
          <p className="font-display text-3xl text-loss-500">{stats.lossDays}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-gold-400 text-sm mb-2">
            <span className="font-medium">?</span>
            <span>待结算</span>
          </div>
          <p className="font-display text-3xl text-amber-600 dark:text-gold-400">{stats.pendingDays}</p>
        </div>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <BetForm onClose={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="card p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-2">用户筛选</p>
                  <select
                    value={filterUserId}
                    onChange={(e) => setFilterUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-sm focus:outline-none focus:border-primary-500/50"
                  >
                    <option value="all">全部用户</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.avatar} {u.nickname}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <BetList bets={filteredBets} showUser={true} canDelete={true} />
      </motion.div>
    </div>
  );
};

export default BetsPage;
