import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDateShort } from '@/utils/helpers';
import { Trash2, Calendar, Edit2, Check, X, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Bet, User } from '@/types';
import Avatar from '@/components/Avatar';
import ImageViewer from '@/components/ImageViewer/ImageViewer';

interface BetListProps {
  bets: (Bet & { user?: User })[];
  showUser?: boolean;
  canDelete?: boolean;
}

const BetList = ({ bets, showUser = false, canDelete = false }: BetListProps) => {
  const users = useAppStore((state) => state.users);
  const removeBet = useAppStore((state) => state.removeBet);
  const addBet = useAppStore((state) => state.addBet);
  const isAdminLoggedIn = useAppStore((state) => state.isAdminLoggedIn);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWinAmount, setEditWinAmount] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  // 只有管理员登录后才能删除/编辑
  const canManage = canDelete && isAdminLoggedIn;

  const getUser = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const handleStartEdit = (bet: Bet) => {
    setEditingId(bet.id);
    setEditWinAmount(bet.winAmount?.toString() || '0');
  };

  const handleSaveEdit = (bet: Bet) => {
    const winNum = editWinAmount ? parseFloat(editWinAmount) : 0;
    const updatedBet: Bet = {
      ...bet,
      winAmount: winNum,
    };
    removeBet(bet.id);
    addBet(updatedBet);
    setEditingId(null);
    setEditWinAmount('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditWinAmount('');
  };

  const handleDelete = (id: string) => {
    removeBet(id);
    setDeleteConfirmId(null);
  };

  if (bets.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">📝</div>
        <p className="text-neutral-500 dark:text-neutral-400">暂无投注记录</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-3">
      {bets.map((bet, index) => {
        const user = bet.user || getUser(bet.userId);
        const isWin = (bet.winAmount ?? 0) > 0;
        const isLoss = bet.winAmount !== undefined && bet.winAmount === 0;
        const isPending = bet.winAmount === undefined;

        return (
          <motion.div
            key={bet.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            className="card p-4 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              {showUser && user && (
                <Avatar src={user.avatar} alt={user.nickname} size="lg" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {showUser && user && (
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {user.nickname}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <Calendar size={12} />
                    <span>{formatDateShort(bet.date)}</span>
                  </div>
                </div>

                {bet.note && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                    {bet.note}
                  </p>
                )}

                {bet.imageUrl && (
                  <div
                    className="mt-2 inline-block cursor-pointer group"
                    onClick={() => setViewerImage(bet.imageUrl!)}
                  >
                    <img
                      src={bet.imageUrl}
                      alt="投注图片"
                      className="w-20 h-20 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700 group-hover:opacity-80 transition-opacity"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>

              <div className="text-right flex-shrink-0 min-w-[80px]">
                {editingId === bet.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={editWinAmount}
                      onChange={(e) => setEditWinAmount(e.target.value)}
                      placeholder="中奖金额"
                      min="0"
                      className="w-20 px-2 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                    />
                    <button
                      onClick={() => handleSaveEdit(bet)}
                      className="p-1 text-profit-500 hover:bg-profit-50 dark:hover:bg-profit-900/20 rounded"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className={`font-display text-xl ${
                        isPending
                          ? 'text-amber-600 dark:text-gold-400'
                          : isWin
                          ? 'text-profit-500'
                          : isLoss
                          ? 'text-loss-500'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {isPending ? '待结算' : `¥${(bet.winAmount ?? 0).toFixed(0)}`}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {isPending ? '可补填' : isWin ? '中奖' : isLoss ? '未中奖' : '持平'}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {isPending && canManage && (
                  <button
                    onClick={() => handleStartEdit(bet)}
                    className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-gold-900/20 text-neutral-400 hover:text-amber-600 dark:hover:text-gold-400 transition-colors"
                    title="补填中奖"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
                {canManage && (
                  <button
                    onClick={() => setDeleteConfirmId(bet.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                    title="删除记录"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>

    <AnimatePresence>
      {deleteConfirmId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setDeleteConfirmId(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="card p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-display text-lg text-neutral-800 dark:text-neutral-200">
                  确认删除
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  删除后无法恢复
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                确认删除
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <ImageViewer
      isOpen={!!viewerImage}
      imageUrl={viewerImage || ''}
      onClose={() => setViewerImage(null)}
    />
    </>
  );
};

export default BetList;
