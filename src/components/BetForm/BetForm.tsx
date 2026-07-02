import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { generateId } from '@/utils/helpers';
import { X, Calendar, Image as ImageIcon, Plus } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ImageUploader from '@/components/ImageUploader/ImageUploader';
import type { Bet, User } from '@/types';

interface BetFormProps {
  onClose?: () => void;
  preSelectedUserId?: string;
  bet?: Bet;
}

const BetForm = ({ onClose, preSelectedUserId, bet }: BetFormProps) => {
  const users = useAppStore((state) => state.users);
  const addBet = useAppStore((state) => state.addBet);
  const updateBet = useAppStore((state) => state.updateBet);

  const isEditMode = !!bet;

  const [selectedUserId, setSelectedUserId] = useState<string>(bet?.userId || '');
  const [date, setDate] = useState(bet?.date || new Date().toISOString().split('T')[0]);
  const [winAmount, setWinAmount] = useState(bet?.winAmount?.toString() || '');
  const [note, setNote] = useState(bet?.note || '');
  const [imageUrl, setImageUrl] = useState<string | undefined>(bet?.imageUrl);

  useEffect(() => {
    if (isEditMode && bet) return;
    if (preSelectedUserId) {
      setSelectedUserId(preSelectedUserId);
    } else if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [preSelectedUserId, users, selectedUserId, isEditMode, bet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !winAmount) return;

    const winNum = parseFloat(winAmount);

    if (isEditMode && bet) {
      updateBet(bet.id, {
        userId: selectedUserId,
        date,
        winAmount: winNum,
        note: note || undefined,
        imageUrl: imageUrl || undefined,
      });
    } else {
      const newBet: Bet = {
        id: generateId(),
        userId: selectedUserId,
        date,
        winAmount: winNum,
        note: note || undefined,
        imageUrl: imageUrl || undefined,
        createdAt: new Date().toISOString(),
      };
      addBet(newBet);
    }

    setWinAmount('');
    setNote('');
    setImageUrl(undefined);
    onClose?.();
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="card p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl text-neutral-800 dark:text-neutral-200">
          {isEditMode ? '编辑记录' : '记录中奖'}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            选择用户
          </label>
          <div className="grid grid-cols-5 gap-2">
            {users.map((user) => {
              const isSelected = selectedUserId === user.id;
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-primary-500/10 border-2 border-primary-500'
                      : 'bg-white dark:bg-neutral-800 border-2 border-transparent hover:border-primary-500/30'
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
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            日期
          </label>
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            中奖金额 (元)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
              ¥
            </span>
            <input
              type="number"
              value={winAmount}
              onChange={(e) => setWinAmount(e.target.value)}
              placeholder="请输入中奖金额，没中填0"
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            备注 <span className="text-neutral-400 font-normal">(可选)</span>
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：3串1命中"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            上传图片 <span className="text-neutral-400 font-normal">(可选)</span>
          </label>
          <ImageUploader value={imageUrl} onChange={setImageUrl} />
        </div>

        <button
          type="submit"
          disabled={!selectedUserId || !winAmount}
          className="w-full btn-gold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEditMode ? '保存修改' : '确认记录'}
        </button>
      </form>
    </div>
  );
};

export default BetForm;
