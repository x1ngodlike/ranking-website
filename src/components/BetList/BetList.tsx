import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatDateShort } from '@/utils/helpers';
import { Trash2, Calendar, Edit2, AlertTriangle, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/utils/api';
import type { Bet, User } from '@/types';
import Avatar from '@/components/Avatar';
import ImageViewer from '@/components/ImageViewer/ImageViewer';
import BetForm from '@/components/BetForm/BetForm';

interface BetListProps {
  bets: (Bet & { user?: User })[];
  showUser?: boolean;
  canDelete?: boolean;
}

const BetList = ({ bets, showUser = false, canDelete = false }: BetListProps) => {
  const users = useAppStore((state) => state.users);
  const removeBet = useAppStore((state) => state.removeBet);
  const updateBet = useAppStore((state) => state.updateBet);
  const isAdminLoggedIn = useAppStore((state) => state.isAdminLoggedIn);
  const designVersion = useAppStore((s) => s.designVersion);

  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const [recognizingId, setRecognizingId] = useState<string | null>(null);
  const [recognitionStatus, setRecognitionStatus] = useState<string>('');
  const [recognitionError, setRecognitionError] = useState<Record<string, string>>({});

  const canManage = canDelete && isAdminLoggedIn;

  const getUser = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  const handleDelete = (id: string) => {
    removeBet(id);
    setDeleteConfirmId(null);
  };

  const handleAIRecognize = async (bet: Bet) => {
    if (!bet.imageUrl) return;

    setRecognizingId(bet.id);
    setRecognitionError(prev => ({ ...prev, [bet.id]: '' }));
    setRecognitionStatus('正在调用AI识别...');

    try {
      setRecognitionStatus('AI正在分析图片内容...');

      const res = await api.recognizeBetImage(bet.imageUrl, bet.winAmount);

      if (res.success && res.result?.comment) {
        setRecognitionStatus('正在保存AI评价...');

        try {
          await updateBet(bet.id, {
            aiComment: res.result.comment,
            aiRecognizing: undefined,
          });
        } catch (e) {
          console.error('保存AI评价失败:', e);
        }

        setRecognitionStatus('');
      } else {
        setRecognitionError(prev => ({ ...prev, [bet.id]: res.message || '未能识别出图片信息' }));
        setRecognitionStatus('');
        // 识别失败也清除识别中标记
        if (bet.aiRecognizing) {
          await updateBet(bet.id, { aiRecognizing: undefined });
        }
      }
    } catch (error) {
      console.error('AI识别失败:', error);
      setRecognitionError(prev => ({ ...prev, [bet.id]: error instanceof Error ? error.message : 'AI识别失败' }));
      setRecognitionStatus('');
      // 出错也清除识别中标记，避免永久卡住
      if (bet.aiRecognizing) {
        await updateBet(bet.id, { aiRecognizing: undefined });
      }
    } finally {
      setTimeout(() => setRecognizingId(null), 500);
    }
  };

  if (bets.length === 0) {
    return (
      <div className={designVersion === 'v2' ? 'rounded-xl p-12 border border-[var(--v2-border)] bg-[var(--v2-bg-card)] text-center' : 'card p-12 text-center'}>
        <div className="text-5xl mb-4">📝</div>
        <p className="text-neutral-500 dark:text-neutral-400">暂无记录</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-3">
      {bets.map((bet, index) => {
        const user = bet.user || getUser(bet.userId);
        const isRecognizing = recognizingId === bet.id;
        const error = recognitionError[bet.id];

        return (
          <motion.div
            key={bet.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            className={['p-4 hover:shadow-lg transition-all duration-300', designVersion === 'v2' ? 'rounded-xl border border-[var(--v2-border)] bg-[var(--v2-bg-card)]' : 'card'].join(' ')}
          >
            <div className="flex items-start gap-4">
              {showUser && user && (
                <Avatar src={user.avatar} alt={user.nickname} size="lg" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {showUser && user && (
                    <span className={designVersion === 'v2' ? 'font-v2-body font-medium text-[var(--v2-text)]' : 'font-medium text-neutral-800 dark:text-neutral-200'}>
                      {user.nickname}
                    </span>
                  )}
                  <div className={['flex items-center gap-1 text-xs', designVersion === 'v2' ? 'text-[var(--v2-text-secondary)]' : 'text-neutral-500 dark:text-neutral-400'].join(' ')}>
                    <Calendar size={12} />
                    <span>{formatDateShort(bet.date)}</span>
                  </div>
                </div>

                {bet.note && (
                  <p className={designVersion === 'v2' ? 'font-v2-body text-xs text-[var(--v2-text-secondary)] mb-2' : 'text-sm text-neutral-500 dark:text-neutral-400 mb-2'}>
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
                      alt="记录图片"
                      className="w-20 h-20 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700 group-hover:opacity-80 transition-opacity"
                      loading="lazy"
                    />
                  </div>
                )}

              </div>

              <div className="text-right flex-shrink-0 min-w-[80px]">
                <div className={designVersion === 'v2' ? 'font-v2-mono font-bold text-lg text-profit-500' : 'font-display text-xl text-amber-600 dark:text-gold-400'}>
                  ¥{(bet.winAmount ?? 0).toFixed(2)}
                </div>

                {canManage && (
                  <div className="flex items-center justify-end gap-1 mt-2">
                    {bet.imageUrl && (
                      <button
                        onClick={() => handleAIRecognize(bet)}
                        disabled={isRecognizing}
                        className={[
                          'p-1.5 rounded-lg transition-all',
                          isRecognizing
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500'
                            : 'hover:bg-primary-50 dark:hover:bg-primary-900/20 text-neutral-400 hover:text-primary-500',
                          'disabled:cursor-not-allowed'
                        ].join(' ')}
                        title="AI评价"
                      >
                        {isRecognizing ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Sparkles size={16} />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setEditingBet(bet)}
                      className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-neutral-400 hover:text-primary-500 transition-colors"
                      title="编辑"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(bet.id)}
                      className={['p-1.5 transition-colors', designVersion === 'v2' ? 'rounded-lg text-profit-500 hover:bg-profit-500/10' : 'rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500'].join(' ')}
                      title="删除记录"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* AI评价展示 - 放在外层，横跨整个卡片宽度 */}
            {bet.aiComment && !isRecognizing && !bet.aiRecognizing && (
              <div className={['mt-2', designVersion === 'v2' ? 'bg-v2-primary-500/5 rounded-lg p-3' : 'p-2 rounded-lg bg-primary-50/50 dark:bg-primary-900/10 border border-primary-200/50 dark:border-primary-800/30'].join(' ')}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={13} className="text-primary-500" />
                  <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                    AI评价
                  </span>
                </div>
                <p className={designVersion === 'v2' ? 'text-xs text-[var(--v2-text)] leading-relaxed whitespace-pre-wrap font-v2-body' : 'text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap'}>
                  {bet.aiComment}
                </p>
              </div>
            )}

            {/* AI识别中状态 - 新增记录自动识别 */}
            {bet.aiRecognizing && !isRecognizing && (
              <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                  <span className="text-xs text-blue-700 dark:text-blue-300">
                    AI识别中...
                  </span>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleAIRecognize(bet)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                  >
                    重新识别
                  </button>
                )}
              </div>
            )}

            {/* 识别进度 */}
            {isRecognizing && (
              <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span className="text-xs text-blue-700 dark:text-blue-300">
                  {recognitionStatus || 'AI识别中...'}
                </span>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-1.5">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>

    <AnimatePresence>
      {editingBet && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setEditingBet(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <BetForm bet={editingBet} onClose={() => setEditingBet(null)} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

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
