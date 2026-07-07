import { useState, useMemo, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import BetForm from '@/components/BetForm/BetForm';
import BetList from '@/components/BetList/BetList';
import { Plus, Filter, Trophy, Calendar, RefreshCw, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/utils/api';

const BetsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{ current: number; total: number; success: number; failed: number; currentBet?: string; cancelled?: boolean } | null>(null);
  const cancelUpdateRef = useRef(false);

  const bets = useAppStore((state) => state.bets);
  const users = useAppStore((state) => state.users);
  const isAdminLoggedIn = useAppStore((state) => state.isAdminLoggedIn);
  const updateBet = useAppStore((state) => state.updateBet);
  const refreshData = useAppStore((state) => state.refreshData);
  const designVersion = useAppStore((s) => s.designVersion);

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
    const totalWinAmount = bets
      .filter((b) => (b.winAmount ?? 0) > 0)
      .reduce((sum, b) => sum + (b.winAmount ?? 0), 0);
    const biggestWin = Math.max(0, ...bets.filter((b) => (b.winAmount ?? 0) > 0).map((b) => b.winAmount ?? 0));

    return {
      total: bets.length,
      totalWinAmount,
      biggestWin,
    };
  }, [bets]);

  const handleUpdateAllAiComments = async () => {
    const betsWithImages = sortedBets.filter(bet => bet.imageUrl);
    const total = betsWithImages.length;
    
    if (total === 0) {
      setUpdateProgress({ current: 0, total: 0, success: 0, failed: 0 });
      return;
    }
    
    cancelUpdateRef.current = false;
    setIsUpdatingAll(true);
    setUpdateProgress({ current: 0, total, success: 0, failed: 0 });
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < betsWithImages.length; i++) {
      if (cancelUpdateRef.current) {
        break;
      }
      
      const bet = betsWithImages[i];
      const user = users.find(u => u.id === bet.userId);
      const betName = user ? `${user.nickname} - ${bet.date}` : bet.date;
      
      setUpdateProgress({ current: i + 1, total, success, failed, currentBet: betName });
      
      try {
        const result = await api.recognizeBetImage(bet.imageUrl!, bet.winAmount);
        if (result.success && result.result?.comment) {
          updateBet(bet.id, { aiComment: result.result.comment });
          success++;
        } else {
          failed++;
        }
      } catch (e) {
        console.error(`更新记录 ${bet.id} 失败:`, e);
        failed++;
      }
      
      setUpdateProgress({ current: i + 1, total, success, failed, currentBet: betName });
    }
    
    const wasCancelled = cancelUpdateRef.current;
    setUpdateProgress({ current: Math.min(success + failed, total), total, success, failed, cancelled: wasCancelled });
    setIsUpdatingAll(false);
    
    await refreshData();
  };

  const handleCancelUpdate = () => {
    cancelUpdateRef.current = true;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className={`mb-2 ${designVersion === 'v2' ? 'font-v2-display font-bold text-[var(--v2-text)] text-4xl' : 'font-display text-4xl text-gradient-gold'}`}>中奖记录</h1>
          <p className={designVersion === 'v2' ? 'text-[var(--v2-text-secondary)]' : 'text-neutral-500 dark:text-neutral-500'}>记录每一次心跳加速的时刻</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 ${designVersion === 'v2' ? 'px-4 py-2 rounded-lg border border-[var(--v2-border)] bg-[var(--v2-bg-card)] text-[var(--v2-text)] text-sm font-v2-body hover:border-v2-primary-500 transition-colors' : 'btn-outline'}`}
          >
            <Filter size={18} />
            筛选
          </button>
          {isAdminLoggedIn && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpdateAllAiComments}
                disabled={isUpdatingAll}
                className={`flex items-center gap-2 ${designVersion === 'v2' ? 'px-4 py-2 rounded-lg border border-[var(--v2-border)] bg-[var(--v2-bg-card)] text-[var(--v2-text)] text-sm font-v2-body hover:border-v2-primary-500 transition-colors' : 'btn-outline'}`}
              >
                <RefreshCw size={18} className={isUpdatingAll ? 'animate-spin' : ''} />
                {isUpdatingAll ? '更新中...' : '更新全部AI评价'}
              </button>
            </div>
          )}
          <button
            onClick={() => setShowForm(true)}
            className={`flex items-center gap-2 ${designVersion === 'v2' ? 'px-5 py-2.5 rounded-lg bg-profit-500 text-white font-v2-body font-bold text-sm hover:bg-profit-600 active:scale-[0.98] transition-all shadow-sm shadow-profit-500/25' : 'btn-gold'}`}
          >
            <Plus size={18} />
            新增记录
          </button>
        </div>
      </motion.div>

      {updateProgress && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">
              {updateProgress.cancelled ? '已终止' : isUpdatingAll ? '正在更新...' : '更新完成'}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm">
                进度: {updateProgress.current}/{updateProgress.total}
              </span>
              {isUpdatingAll && (
                <button
                  onClick={handleCancelUpdate}
                  className="flex items-center gap-1 text-sm px-3 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  <XCircle size={16} />
                  终止
                </button>
              )}
            </div>
          </div>
          {updateProgress.total > 0 && (
            <div className="w-full h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(updateProgress.current / updateProgress.total) * 100}%` }}
              />
            </div>
          )}
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 dark:text-green-400">成功: {updateProgress.success}</span>
            <span className="text-red-600 dark:text-red-400">失败: {updateProgress.failed}</span>
          </div>
          {updateProgress.currentBet && isUpdatingAll && (
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 truncate">
              当前: {updateProgress.currentBet}
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 gap-4 mb-8"
      >
        <div className={designVersion === 'v2' ? 'rounded-xl p-4 border border-[var(--v2-border)] bg-[var(--v2-bg-card)]' : 'card p-4'}>
          <div className={`flex items-center gap-2 text-sm mb-2 ${designVersion === 'v2' ? 'text-[var(--v2-text-secondary)]' : 'text-neutral-500 dark:text-neutral-500'}`}>
            <Calendar size={16} />
            <span>总记录</span>
          </div>
          <p className={designVersion === 'v2' ? 'font-v2-mono font-bold text-2xl md:text-3xl text-[var(--v2-text)]' : 'font-display text-2xl md:text-3xl text-neutral-800 dark:text-neutral-200'}>{stats.total}</p>
        </div>
        <div className={designVersion === 'v2' ? 'rounded-xl p-4 border border-[var(--v2-border)] bg-[var(--v2-bg-card)]' : 'card p-4'}>
          <div className={`flex items-center gap-2 text-sm mb-2 ${designVersion === 'v2' ? 'text-[var(--v2-text-secondary)]' : 'text-amber-600 dark:text-gold-400'}`}>
            <Trophy size={16} />
            <span>中奖总额</span>
          </div>
          <p className={designVersion === 'v2' ? 'font-v2-mono font-bold text-2xl md:text-3xl text-profit-500' : 'font-display text-2xl md:text-3xl text-amber-600 dark:text-gold-400'}>
            ¥{stats.totalWinAmount.toFixed(2)}
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={designVersion === 'v2' ? 'rounded-xl p-4 border border-[var(--v2-border)] bg-[var(--v2-bg-card)]' : 'card p-4'}>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                  <p className={`text-sm mb-2 ${designVersion === 'v2' ? 'font-v2-body text-sm font-medium text-[var(--v2-text-secondary)]' : 'text-neutral-500 dark:text-neutral-500'}`}>用户筛选</p>
                  <select
                    value={filterUserId}
                    onChange={(e) => setFilterUserId(e.target.value)}
                    className={designVersion === 'v2' ? 'w-full px-4 py-2.5 rounded-lg border border-[var(--v2-border)] bg-[var(--v2-bg)] text-[var(--v2-text)] text-sm font-v2-body focus:border-v2-primary-500 focus:outline-none transition-colors' : 'w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-sm focus:outline-none focus:border-primary-500/50'}
                  >
                    <option value="all">全部用户</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nickname}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <BetForm onClose={() => setShowForm(false)} />
            </motion.div>
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
