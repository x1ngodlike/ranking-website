import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/utils/api';
import { X, Calendar } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ImageUploader from '@/components/ImageUploader/ImageUploader';
import type { Bet } from '@/types';

interface BetFormProps {
  onClose?: () => void;
  preSelectedUserId?: string;
  bet?: Bet;
}

const BetForm = ({ onClose, preSelectedUserId, bet }: BetFormProps) => {
  const users = useAppStore((state) => state.users);
  const createBet = useAppStore((state) => state.createBet);
  const updateBet = useAppStore((state) => state.updateBet);
  const isAdminLoggedIn = useAppStore((state) => state.isAdminLoggedIn);
  const designVersion = useAppStore((s) => s.designVersion);

  const isEditMode = !!bet;

  const [selectedUserId, setSelectedUserId] = useState<string>(bet?.userId || '');
  const [date, setDate] = useState(bet?.date || new Date().toISOString().split('T')[0]);
  const [winAmount, setWinAmount] = useState(bet?.winAmount?.toString() || '');
  const [note, setNote] = useState(bet?.note || '');
  const [imageUrl, setImageUrl] = useState<string | undefined>(bet?.imageUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (isEditMode && bet) return;
    if (preSelectedUserId) {
      setSelectedUserId(preSelectedUserId);
    } else if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [preSelectedUserId, users, selectedUserId, isEditMode, bet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !winAmount) return;

    const winNum = parseFloat(winAmount);
    if (!Number.isFinite(winNum) || winNum < 0) {
      setSubmitError('请输入有效的中奖金额');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (isEditMode && bet) {
        updateBet(bet.id, {
          userId: selectedUserId,
          date,
          winAmount: winNum,
          note: note || undefined,
          imageUrl: imageUrl || undefined,
        });
        onClose?.();
        return;
      }

      const newBet = await createBet({
        userId: selectedUserId,
        date,
        winAmount: winNum,
        note: note || undefined,
        imageUrl: imageUrl || undefined,
      });

      setWinAmount('');
      setNote('');
      setImageUrl(undefined);
      onClose?.();

      // AI 调用会产生外部成本，仅已登录管理员自动触发。
      if (isAdminLoggedIn && imageUrl && winNum > 0) {
        try {
          const res = await api.recognizeBetImage(imageUrl, winNum);
          if (res.success && res.result?.comment) {
            updateBet(newBet.id, { 
              aiComment: res.result.comment,
              aiRecognizing: undefined 
            });
          } else {
            // 识别失败也要清除标记
            updateBet(newBet.id, { aiRecognizing: undefined });
          }
        } catch (error) {
          console.error('AI自动识别失败:', error);
          updateBet(newBet.id, { aiRecognizing: undefined });
        }
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '新增记录失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={designVersion === 'v2' ? 'rounded-xl border border-[var(--v2-border)] bg-[var(--v2-bg-card)] p-6 max-h-[90vh] overflow-y-auto' : 'card p-6 max-h-[90vh] overflow-y-auto'}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={designVersion === 'v2' ? 'font-v2-display font-semibold text-[var(--v2-text)] text-xl' : 'font-display text-xl text-neutral-800 dark:text-neutral-200'}>
          {isEditMode ? '编辑记录' : '记录中奖'}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            aria-label="关闭记录表单"
            className={`p-2 transition-colors ${designVersion === 'v2' ? 'rounded-lg hover:bg-[var(--v2-bg-muted)] text-[var(--v2-text-muted)]' : 'rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}`}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <span id="bet-user-label" className={`block mb-3 ${designVersion === 'v2' ? 'font-v2-body text-sm font-medium text-[var(--v2-text-secondary)]' : 'text-sm font-medium text-neutral-700 dark:text-neutral-300'}`}>
            选择用户
          </span>
          <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-labelledby="bet-user-label">
            {users.map((user) => {
              const isSelected = selectedUserId === user.id;
              return (
                <button
                  key={user.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 transition-all ${
                    isSelected
                      ? designVersion === 'v2'
                        ? 'bg-v2-primary-500/10 border-2 border-v2-primary-500 rounded-lg'
                        : 'bg-primary-500/10 border-2 border-primary-500 rounded-xl'
                      : designVersion === 'v2'
                        ? 'bg-[var(--v2-bg)] border-2 border-transparent hover:border-v2-primary-500/30 rounded-lg'
                        : 'bg-white dark:bg-neutral-800 border-2 border-transparent hover:border-primary-500/30 rounded-xl'
                  }`}
                >
                  <Avatar src={user.avatar} alt={user.nickname} size="sm" />
                  <span className={`text-[11px] truncate w-full text-center leading-tight ${
                    isSelected
                      ? 'text-primary-600 dark:text-primary-400 font-medium'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {user.nickname}
                  </span>
                </button>
              );
            })}
          </div>
          {!selectedUserId && (
            <p className="text-xs text-red-500 mt-2">请选择用户</p>
          )}
        </div>

        <div>
          <label htmlFor="bet-date" className={`block mb-2 ${designVersion === 'v2' ? 'font-v2-body text-sm font-medium text-[var(--v2-text-secondary)]' : 'text-sm font-medium text-neutral-700 dark:text-neutral-300'}`}>
            日期
          </label>
          <div className="relative">
            <Calendar size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${designVersion === 'v2' ? 'text-[var(--v2-text-muted)]' : 'text-neutral-400'}`} />
            <input
              type="date"
              id="bet-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={designVersion === 'v2' ? 'w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--v2-border)] bg-[var(--v2-bg)] text-[var(--v2-text)] text-sm font-v2-body focus:border-v2-primary-500 focus:outline-none transition-colors' : 'w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors'}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="bet-win-amount" className={`block mb-2 ${designVersion === 'v2' ? 'font-v2-body text-sm font-medium text-[var(--v2-text-secondary)]' : 'text-sm font-medium text-neutral-700 dark:text-neutral-300'}`}>
            中奖金额 (元)
          </label>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-medium ${designVersion === 'v2' ? 'text-[var(--v2-text-muted)]' : 'text-neutral-400'}`}>
              ¥
            </span>
            <input
              type="number"
              id="bet-win-amount"
              value={winAmount}
              onChange={(e) => setWinAmount(e.target.value)}
              placeholder="请输入中奖金额，没中填0"
              min="0"
              step="0.01"
              className={designVersion === 'v2' ? 'w-full pl-8 pr-4 py-2.5 rounded-lg border border-[var(--v2-border)] bg-[var(--v2-bg)] text-[var(--v2-text)] text-sm font-v2-body focus:border-v2-primary-500 focus:outline-none transition-colors' : 'w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors'}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="bet-note" className={`block mb-2 ${designVersion === 'v2' ? 'font-v2-body text-sm font-medium text-[var(--v2-text-secondary)]' : 'text-sm font-medium text-neutral-700 dark:text-neutral-300'}`}>
            备注 {designVersion === 'v2' ? <span className="text-[var(--v2-text-muted)] font-normal">(可选)</span> : <span className="text-neutral-400 font-normal">(可选)</span>}
          </label>
          <input
            type="text"
            id="bet-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：3串1命中"
            maxLength={500}
            className={designVersion === 'v2' ? 'w-full px-4 py-2.5 rounded-lg border border-[var(--v2-border)] bg-[var(--v2-bg)] text-[var(--v2-text)] text-sm font-v2-body focus:border-v2-primary-500 focus:outline-none transition-colors' : 'w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors'}
          />
        </div>

        <div>
          <label className={`block mb-2 ${designVersion === 'v2' ? 'font-v2-body text-sm font-medium text-[var(--v2-text-secondary)]' : 'text-sm font-medium text-neutral-700 dark:text-neutral-300'}`}>
            上传图片 {designVersion === 'v2' ? <span className="text-[var(--v2-text-muted)] font-normal">(可选)</span> : <span className="text-neutral-400 font-normal">(可选)</span>}
          </label>
          <ImageUploader value={imageUrl} onChange={setImageUrl} />
        </div>

        {submitError && (
          <p role="alert" className="text-sm text-red-500">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={!selectedUserId || !winAmount || isSubmitting}
          className={`w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed ${designVersion === 'v2' ? 'rounded-lg bg-v2-primary-500 text-white font-v2-body font-semibold hover:bg-v2-primary-600 transition-colors' : 'btn-gold'}`}
        >
          {isSubmitting ? '提交中…' : isEditMode ? '保存修改' : '确认记录'}
        </button>
      </form>
    </div>
  );
};

export default BetForm;
