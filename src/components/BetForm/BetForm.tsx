import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { generateId } from '@/utils/helpers';
import { X } from 'lucide-react';

interface BetFormProps {
  onClose?: () => void;
}

const BetForm = ({ onClose }: BetFormProps) => {
  const users = useAppStore((state) => state.users);
  const addBet = useAppStore((state) => state.addBet);

  const [userId, setUserId] = useState(users[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [winAmount, setWinAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !amount) return;

    const amountNum = parseFloat(amount);
    const winNum = winAmount ? parseFloat(winAmount) : undefined;
    const profitLoss = winNum !== undefined ? winNum - amountNum : undefined;

    const bet = {
      id: generateId(),
      userId,
      date,
      amount: amountNum,
      profitLoss,
      note: note || undefined,
      createdAt: new Date().toISOString(),
    };

    addBet(bet);
    setAmount('');
    setWinAmount('');
    setNote('');
    onClose?.();
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl text-neutral-800 dark:text-neutral-200">
          记录投注
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
            用户
          </label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors"
            required
          >
            <option value="">选择用户</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nickname}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
            日期
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              投注金额 (元)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
              中奖金额 <span className="text-xs text-neutral-400">(选填，可后补)</span>
            </label>
            <input
              type="number"
              value={winAmount}
              onChange={(e) => setWinAmount(e.target.value)}
              placeholder="没中填0"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
            备注 (可选)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例如：今天买了3场"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors"
          />
        </div>

        {amount && winAmount && (
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-500 dark:text-neutral-400">投注金额</span>
              <span className="text-neutral-700 dark:text-neutral-300">¥{parseFloat(amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-500 dark:text-neutral-400">中奖金额</span>
              <span className="text-amber-600 dark:text-gold-400">¥{parseFloat(winAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-neutral-500 dark:text-neutral-400">实际盈亏</span>
              <span className={parseFloat(winAmount) - parseFloat(amount) >= 0 ? 'text-profit-500' : 'text-loss-500'}>
                {parseFloat(winAmount) - parseFloat(amount) >= 0 ? '+' : ''}¥{(parseFloat(winAmount) - parseFloat(amount)).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!userId || !amount}
          className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          确认记录
        </button>
      </form>
    </div>
  );
};

export default BetForm;
