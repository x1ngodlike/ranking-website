import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { generateId } from '@/utils/helpers';
import { X, Calendar, Image as ImageIcon, Plus, Sparkles, Loader2, Check } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ImageUploader from '@/components/ImageUploader/ImageUploader';
import { api } from '@/utils/api';
import type { Bet, User, Match } from '@/types';
import type { AIRecognitionResult } from '@/utils/api';

interface BetFormProps {
  onClose?: () => void;
  preSelectedUserId?: string;
  bet?: Bet;
}

const BetForm = ({ onClose, preSelectedUserId, bet }: BetFormProps) => {
  const users = useAppStore((state) => state.users);
  const matches = useAppStore((state) => state.matches);
  const addBet = useAppStore((state) => state.addBet);
  const updateBet = useAppStore((state) => state.updateBet);

  const isEditMode = !!bet;

  const [selectedUserId, setSelectedUserId] = useState<string>(bet?.userId || '');
  const [date, setDate] = useState(bet?.date || new Date().toISOString().split('T')[0]);
  const [winAmount, setWinAmount] = useState(bet?.winAmount?.toString() || '');
  const [note, setNote] = useState(bet?.note || '');
  const [imageUrl, setImageUrl] = useState<string | undefined>(bet?.imageUrl);
  
  // AI识别相关状态
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<AIRecognitionResult | null>(null);
  const [matchedMatch, setMatchedMatch] = useState<Match | null>(null);
  const [recognitionError, setRecognitionError] = useState('');

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
        matchId: matchedMatch?.id || bet.matchId,
        predictedHomeScore: recognitionResult?.predictedHomeScore || bet.predictedHomeScore,
        predictedAwayScore: recognitionResult?.predictedAwayScore || bet.predictedAwayScore,
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
        matchId: matchedMatch?.id,
        predictedHomeScore: recognitionResult?.predictedHomeScore,
        predictedAwayScore: recognitionResult?.predictedAwayScore,
      };
      addBet(newBet);
    }

    setWinAmount('');
    setNote('');
    setImageUrl(undefined);
    setRecognitionResult(null);
    setMatchedMatch(null);
    setRecognitionError('');
    onClose?.();
  };

  const handleImageChange = (url: string | undefined) => {
    setImageUrl(url);
    setRecognitionResult(null);
    setMatchedMatch(null);
    setRecognitionError('');
  };

  const handleAIRecognize = async () => {
    if (!imageUrl) return;

    setIsRecognizing(true);
    setRecognitionError('');

    try {
      const res = await api.recognizeBetImage(imageUrl);

      if (res.success && res.result) {
        setRecognitionResult(res.result);

        const matched = matches.find((m) =>
          (m.homeTeam.includes(res.result!.homeTeam) || res.result!.homeTeam.includes(m.homeTeam)) &&
          (m.awayTeam.includes(res.result!.awayTeam) || res.result!.awayTeam.includes(m.awayTeam))
        );

        if (matched) {
          setMatchedMatch(matched);
        }
      } else {
        setRecognitionError(res.message || '未能识别出比赛信息，请手动填写');
      }
    } catch (error) {
      console.error('AI识别失败:', error);
      setRecognitionError(error instanceof Error ? error.message : 'AI识别失败，请检查配置');
    } finally {
      setIsRecognizing(false);
    }
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
          <ImageUploader value={imageUrl} onChange={handleImageChange} />
          
          {imageUrl && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleAIRecognize}
                disabled={isRecognizing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500/20 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isRecognizing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    AI识别中...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    AI识别比赛
                  </>
                )}
              </button>
            </div>
          )}

          {/* AI识别结果展示 */}
          {recognitionResult && (
            <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Check size={16} className="text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  AI识别结果
                </span>
              </div>
              <div className="text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
                <p>
                  <span className="text-neutral-500">比赛：</span>
                  {recognitionResult.homeTeam} vs {recognitionResult.awayTeam}
                </p>
                <p>
                  <span className="text-neutral-500">预测比分：</span>
                  <span className="font-display font-medium">
                    {recognitionResult.predictedHomeScore} - {recognitionResult.predictedAwayScore}
                  </span>
                </p>
                {matchedMatch && (
                  <p className="text-green-600 dark:text-green-400">
                    ✓ 已匹配到系统比赛
                  </p>
                )}
                {!matchedMatch && (
                  <p className="text-amber-600 dark:text-amber-400">
                    ⚠ 未匹配到系统比赛，请手动选择
                  </p>
                )}
              </div>
            </div>
          )}

          {recognitionError && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">
                {recognitionError}
              </p>
            </div>
          )}
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
