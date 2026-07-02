import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatDateShort } from '@/utils/helpers';
import { Trash2, Calendar, Edit2, AlertTriangle, Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/utils/api';
import type { Bet, User, Match } from '@/types';
import type { AIRecognitionResult } from '@/utils/api';
import Avatar from '@/components/Avatar';
import ImageViewer from '@/components/ImageViewer/ImageViewer';
import BetForm from '@/components/BetForm/BetForm';

interface BetListProps {
  bets: (Bet & { user?: User })[];
  showUser?: boolean;
  canDelete?: boolean;
}

const TEAM_ALIASES: Record<string, string[]> = {
  '中国': ['中国', '中国队', '中国男足'],
  '韩国': ['韩国', '韩国队', '南韩'],
  '日本': ['日本', '日本队', '东瀛'],
  '巴西': ['巴西', '巴西队'],
  '阿根廷': ['阿根廷', '阿根廷队'],
  '德国': ['德国', '德国队', '日耳曼'],
  '法国': ['法国', '法国队', '高卢雄鸡'],
  '西班牙': ['西班牙', '西班牙队'],
  '英格兰': ['英格兰', '英格兰队', '三狮军团'],
  '葡萄牙': ['葡萄牙', '葡萄牙队'],
  '意大利': ['意大利', '意大利队', '蓝衣军团'],
  '荷兰': ['荷兰', '荷兰队', '橙衣军团'],
  '比利时': ['比利时', '比利时队'],
  '瑞士': ['瑞士', '瑞士队'],
  '墨西哥': ['墨西哥', '墨西哥队'],
  '喀麦隆': ['喀麦隆', '喀麦隆队'],
  '美国': ['美国', '美国队', '美利坚'],
  '加拿大': ['加拿大', '加拿大队'],
  '澳大利亚': ['澳大利亚', '澳大利亚队', '澳洲'],
  '克罗地亚': ['克罗地亚', '克罗地亚队'],
  '摩洛哥': ['摩洛哥', '摩洛哥队'],
  '沙特': ['沙特', '沙特阿拉伯', '沙特队'],
  '卡塔尔': ['卡塔尔', '卡塔尔队'],
  '厄瓜多尔': ['厄瓜多尔', '厄瓜多尔队'],
  '塞内加尔': ['塞内加尔', '塞内加尔队'],
  '波兰': ['波兰', '波兰队'],
  '突尼斯': ['突尼斯', '突尼斯队'],
  '丹麦': ['丹麦', '丹麦队'],
  '乌拉圭': ['乌拉圭', '乌拉圭队'],
  '加纳': ['加纳', '加纳队'],
  '哥斯达黎加': ['哥斯达黎加', '哥斯达黎加队'],
  '塞尔维亚': ['塞尔维亚', '塞尔维亚队'],
  '威尔士': ['威尔士', '威尔士队'],
  '伊朗': ['伊朗', '伊朗队'],
  '伊拉克': ['伊拉克', '伊拉克队'],
  '阿联酋': ['阿联酋', '阿联酋队'],
  '科威特': ['科威特', '科威特队'],
};

const safeIncludes = (str: string | null | undefined, search: string | null | undefined): boolean => {
  if (!str || !search) return false;
  try {
    return str.includes(search);
  } catch {
    return false;
  }
};

const normalizeTeamName = (name: string | null | undefined): string => {
  try {
    if (!name) return '';
    const strName = String(name).trim();
    if (!strName) return '';
    const normalized = strName.replace(/[\s\-_队国]/g, '');
    for (const [standard, aliases] of Object.entries(TEAM_ALIASES)) {
      if (!aliases || !Array.isArray(aliases)) continue;
      for (const alias of aliases) {
        if (!alias) continue;
        if (safeIncludes(strName, alias) || safeIncludes(alias, strName)) {
          return standard;
        }
      }
    }
    return normalized;
  } catch (e) {
    console.warn('normalizeTeamName error:', e);
    return '';
  }
};

const findBestMatch = (matches: Match[] | null | undefined, homeTeam: string | null | undefined, awayTeam: string | null | undefined): Match | undefined => {
  try {
    if (!homeTeam || !awayTeam) return undefined;
    if (!matches || !Array.isArray(matches) || matches.length === 0) return undefined;
    
    const normalizedHome = normalizeTeamName(homeTeam);
    const normalizedAway = normalizeTeamName(awayTeam);

    if (!normalizedHome || !normalizedAway) return undefined;

    const strHomeTeam = String(homeTeam || '');
    const strAwayTeam = String(awayTeam || '');

    const scoredMatches = matches.map(match => {
      try {
        const matchHome = normalizeTeamName(match.homeTeam);
        const matchAway = normalizeTeamName(match.awayTeam);
        const strMatchHome = String(match.homeTeam || '');
        const strMatchAway = String(match.awayTeam || '');

        let score = 0;

        if (safeIncludes(matchHome, normalizedHome) || safeIncludes(normalizedHome, matchHome)) score += 2;
        if (safeIncludes(matchAway, normalizedAway) || safeIncludes(normalizedAway, matchAway)) score += 2;

        if (safeIncludes(strMatchHome, strHomeTeam) || safeIncludes(strHomeTeam, strMatchHome)) score += 1;
        if (safeIncludes(strMatchAway, strAwayTeam) || safeIncludes(strAwayTeam, strMatchAway)) score += 1;

        return { match, score };
      } catch (e) {
        console.warn('match scoring error:', e);
        return { match, score: 0 };
      }
    }).filter(m => m.score > 0);

    scoredMatches.sort((a, b) => b.score - a.score);

    return scoredMatches.length > 0 ? scoredMatches[0].match : undefined;
  } catch (e) {
    console.error('findBestMatch error:', e);
    return undefined;
  }
};

const BetList = ({ bets, showUser = false, canDelete = false }: BetListProps) => {
  const users = useAppStore((state) => state.users);
  const matches = useAppStore((state) => state.matches);
  const removeBet = useAppStore((state) => state.removeBet);
  const updateBet = useAppStore((state) => state.updateBet);
  const isAdminLoggedIn = useAppStore((state) => state.isAdminLoggedIn);

  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const [recognizingId, setRecognizingId] = useState<string | null>(null);
  const [recognitionStatus, setRecognitionStatus] = useState<string>('');
  const [recognitionResult, setRecognitionResult] = useState<{ betId: string; result: AIRecognitionResult; matched?: Match } | null>(null);
  const [recognitionError, setRecognitionError] = useState<string>('');

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
    setRecognitionError('');
    setRecognitionResult(null);
    setRecognitionStatus('正在检查AI配置...');

    try {
      setRecognitionStatus('正在调用服务器AI识别接口...');
      
      const res = await api.recognizeBetImage(bet.imageUrl);

      if (res.success && res.result) {
        setRecognitionStatus('识别成功！正在匹配比赛数据...');
        
        const homeTeam = res.result.homeTeam || '';
        const awayTeam = res.result.awayTeam || '';
        
        if (!homeTeam || !awayTeam) {
          setRecognitionError('识别结果缺少球队信息');
          setRecognitionStatus('');
          return;
        }
        
        let matched: Match | undefined;
        try {
          matched = findBestMatch(matches, homeTeam, awayTeam);
        } catch (e) {
          console.error('匹配比赛时出错:', e);
        }

        if (matched) {
          setRecognitionStatus('已匹配到比赛，正在更新记录...');
          try {
            await updateBet(bet.id, {
              matchId: matched.id,
              predictedHomeScore: res.result.predictedHomeScore ?? 0,
              predictedAwayScore: res.result.predictedAwayScore ?? 0,
            });
          } catch (e) {
            console.error('更新记录时出错:', e);
          }
        }

        setRecognitionResult({ betId: bet.id, result: res.result, matched });
        setRecognitionStatus('');
      } else {
        setRecognitionError(res.message || '未能识别出比赛信息');
        setRecognitionStatus('');
      }
    } catch (error) {
      console.error('AI识别失败:', error);
      setRecognitionError(error instanceof Error ? error.message : 'AI识别失败');
      setRecognitionStatus('');
    } finally {
      setTimeout(() => setRecognizingId(null), 500);
    }
  };

  if (bets.length === 0) {
    return (
      <div className="card p-12 text-center">
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
        const hasResult = recognitionResult?.betId === bet.id;

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
                      alt="记录图片"
                      className="w-20 h-20 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700 group-hover:opacity-80 transition-opacity"
                      loading="lazy"
                    />
                  </div>
                )}

                {isRecognizing && (
                  <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-blue-500" />
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      {recognitionStatus || 'AI识别中...'}
                    </span>
                  </div>
                )}

                {hasResult && recognitionResult && (
                  <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Check size={14} className="text-green-500" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">
                        AI识别成功
                      </span>
                    </div>
                    <div className="text-xs text-neutral-700 dark:text-neutral-300">
                      <p>
                        {recognitionResult.result.homeTeam || '未知'} vs {recognitionResult.result.awayTeam || '未知'}
                        <span className="font-display font-medium ml-1">
                          {recognitionResult.result.predictedHomeScore ?? 0}-{recognitionResult.result.predictedAwayScore ?? 0}
                        </span>
                      </p>
                      {recognitionResult.matched && (
                        <p className="text-green-600 dark:text-green-400 text-[11px]">✓ 已匹配比赛并更新记录</p>
                      )}
                      {!recognitionResult.matched && (
                        <p className="text-amber-600 dark:text-amber-400 text-[11px]">⚠️ 未匹配到赛程数据，请手动选择</p>
                      )}
                    </div>
                  </div>
                )}

                {recognitionError && (
                  <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-1.5">
                    <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {recognitionError}
                    </p>
                  </div>
                )}
              </div>

              <div className="text-right flex-shrink-0 min-w-[80px]">
                <div className="font-display text-xl text-amber-600 dark:text-gold-400">
                  ¥{(bet.winAmount ?? 0).toFixed(2)}
                </div>

                {canManage && (
                  <div className="flex items-center justify-end gap-1 mt-2">
                    {bet.imageUrl && (
                      <button
                        onClick={() => handleAIRecognize(bet)}
                        disabled={isRecognizing}
                        className={`p-1.5 rounded-lg transition-all ${
                          isRecognizing
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-500'
                            : 'hover:bg-primary-50 dark:hover:bg-primary-900/20 text-neutral-400 hover:text-primary-500'
                        } disabled:cursor-not-allowed`}
                        title="AI识别比赛"
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
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                      title="删除记录"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
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
