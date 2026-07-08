import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X, Upload, CheckCircle, AlertCircle, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../Avatar';
import { api } from '@/utils/api';
import type { User as UserType, Match } from '@/types';

interface ParsedBet {
  date: string;
  homeTeam: string;
  awayTeam: string;
  playType: string;
  option: string;
  odds: number;
  betAmount: number;
  winAmount: number;
  valid: boolean;
  error?: string;
}

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BatchImportModal = ({ isOpen, onClose }: BatchImportModalProps) => {
  const users = useAppStore((state) => state.users);
  const matches = useAppStore((state) => state.matches);
  const addBet = useAppStore((state) => state.addBet);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [parsedBets, setParsedBets] = useState<ParsedBet[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const parseInput = useCallback((text: string): ParsedBet[] => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const currentYear = new Date().getFullYear();

    return lines.map((line) => {
      try {
        const parts = line.split('，');
        if (parts.length < 7) {
          return {
            date: '',
            homeTeam: '',
            awayTeam: '',
            playType: '',
            option: '',
            odds: 0,
            betAmount: 0,
            winAmount: 0,
            valid: false,
            error: '格式不正确',
          };
        }

        const datePart = parts[0].trim();
        const dateMatch = datePart.match(/(\d+)\.(\d+)/);
        if (!dateMatch) {
          return {
            date: '',
            homeTeam: '',
            awayTeam: '',
            playType: '',
            option: '',
            odds: 0,
            betAmount: 0,
            winAmount: 0,
            valid: false,
            error: '日期格式错误',
          };
        }

        const month = parseInt(dateMatch[1], 10);
        const day = parseInt(dateMatch[2], 10);
        const date = `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        const vsPart = parts[1].trim();
        const vsMatch = vsPart.match(/(.+?)\s*vs\s*(.+)/);
        if (!vsMatch) {
          return {
            date: '',
            homeTeam: '',
            awayTeam: '',
            playType: '',
            option: '',
            odds: 0,
            betAmount: 0,
            winAmount: 0,
            valid: false,
            error: '对阵格式错误',
          };
        }

        const homeTeam = vsMatch[1].trim();
        const awayTeam = vsMatch[2].trim();

        const playPart = parts[2].trim();
        const playMatch = playPart.match(/(.+?)[:：]\s*(.+)/);
        const playType = playMatch ? playMatch[1].trim() : '胜平负';
        const option = playMatch ? playMatch[2].trim() : parts[2].split('：')[1]?.trim() || '';

        const odds = parseFloat(parts[3]?.replace('赔率', '').trim() || '0');
        const betAmount = parseFloat(parts[4]?.replace('投注金额', '').trim() || '0');
        const winAmount = parseFloat(parts[5]?.replace('盈利金额', '').trim() || parts[6]?.replace('盈利金额', '').trim() || '0');

        if (isNaN(odds) || isNaN(betAmount) || isNaN(winAmount)) {
          return {
            date,
            homeTeam,
            awayTeam,
            playType,
            option,
            odds,
            betAmount,
            winAmount,
            valid: false,
            error: '金额格式错误',
          };
        }

        return {
          date,
          homeTeam,
          awayTeam,
          playType,
          option,
          odds,
          betAmount,
          winAmount,
          valid: true,
        };
      } catch (e) {
        return {
          date: '',
          homeTeam: '',
          awayTeam: '',
          playType: '',
          option: '',
          odds: 0,
          betAmount: 0,
          winAmount: 0,
          valid: false,
          error: '解析失败',
        };
      }
    });
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    setParsedBets(parseInput(text));
    setImportResult(null);
  };

  const findMatchResult = useCallback((homeTeam: string, awayTeam: string): { homeScore: number; awayScore: number; result: string } | null => {
    const match = matches.find((m: Match) => {
      const mHome = m.homeTeam;
      const mAway = m.awayTeam;
      return (
        (mHome?.includes(homeTeam) || homeTeam.includes(mHome)) &&
        (mAway?.includes(awayTeam) || awayTeam.includes(mAway))
      );
    });

    if (!match || match.status !== 'finished') return null;

    const homeScore = match.regularTimeHomeScore ?? match.homeScore ?? 0;
    const awayScore = match.regularTimeAwayScore ?? match.awayScore ?? 0;

    let result: string;
    if (homeScore > awayScore) result = '主队胜';
    else if (homeScore < awayScore) result = '客队胜';
    else result = '平局';

    return { homeScore, awayScore, result };
  }, [matches]);

  const generateAIComment = useCallback((bet: ParsedBet): string => {
    const matchResult = findMatchResult(bet.homeTeam, bet.awayTeam);
    const score = matchResult ? `${matchResult.homeScore}:${matchResult.awayScore}` : '未知';
    
    let isWin = false;
    if (matchResult) {
      if (bet.playType === '胜平负') {
        if (bet.option === '胜' && matchResult.result === '主队胜') isWin = true;
        if (bet.option === '平' && matchResult.result === '平局') isWin = true;
        if (bet.option === '负' && matchResult.result === '客队胜') isWin = true;
      }
    }

    return `📋 票面解析\n${bet.homeTeam} vs ${bet.awayTeam} | ${bet.playType}：${bet.option}@${bet.odds}元 | 比分${score} → ${isWin ? '✅中' : '❌错'}\n🔗 过关：1场1关 | 投注1注\n💰 本金：¥${bet.betAmount}元 | 中奖：¥${bet.winAmount}元\n\n💬 买${bet.option}搏一搏，单车变摩托！`;
  }, [findMatchResult]);

  const handleImport = async () => {
    if (!selectedUserId || parsedBets.filter((b) => b.valid).length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    const validBets = parsedBets.filter((b) => b.valid);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < validBets.length; i++) {
      const bet = validBets[i];
      try {
        const aiComment = generateAIComment(bet);
        
        addBet({
          id: `bet-${Date.now()}-${i}`,
          userId: selectedUserId,
          date: bet.date,
          winAmount: bet.winAmount,
          note: `${bet.homeTeam} vs ${bet.awayTeam} ${bet.playType}: ${bet.option}`,
          aiComment,
          createdAt: new Date().toISOString(),
        });
        
        success++;
      } catch (e) {
        failed++;
      }
      
      setImportProgress(((i + 1) / validBets.length) * 100);
      await new Promise((r) => setTimeout(r, 100));
    }

    setIsImporting(false);
    setImportResult({ success, failed });
  };

  const validCount = parsedBets.filter((b) => b.valid).length;
  const invalidCount = parsedBets.filter((b) => !b.valid).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <Upload className="text-primary-500" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">批量导入投注</h2>
                  <p className="text-xs text-neutral-500">导入纯文本格式的投注记录</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">选择用户</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-primary-500/50 transition-all text-sm"
                >
                  <option value="">请选择用户</option>
                  {users.map((user: UserType) => (
                    <option key={user.id} value={user.id}>
                      {user.nickname}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  粘贴投注数据
                  <span className="text-neutral-400 font-normal ml-2">（每行一条）</span>
                </label>
                <textarea
                  value={inputText}
                  onChange={handleTextChange}
                  placeholder="6.12，加拿大 vs 波黑，胜平负：平，赔率 3.4，投注金额 13，盈利金额 31.2"
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500/50 transition-all text-sm h-32 resize-none"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  格式：日期，主队 vs 客队，玩法：选项，赔率 X，投注金额 X，盈利金额 X
                </p>
              </div>

              {parsedBets.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-500">解析结果</span>
                    <span className="text-xs">
                      <span className="text-green-500">{validCount}条有效</span>
                      {invalidCount > 0 && (
                        <span className="text-red-500 ml-2">{invalidCount}条无效</span>
                      )}
                    </span>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {parsedBets.map((bet, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                          bet.valid
                            ? 'bg-green-50 dark:bg-green-500/10 text-green-800 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-400'
                        }`}
                      >
                        {bet.valid ? (
                          <>
                            <CheckCircle size={14} />
                            <span>{bet.date} {bet.homeTeam} vs {bet.awayTeam} {bet.playType}:{bet.option} ¥{bet.winAmount}</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} />
                            <span>第{i + 1}行：{bet.error}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isImporting && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-neutral-500">导入中...</span>
                    <span className="text-primary-600">{Math.round(importProgress)}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                      animate={{ width: `${importProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
              )}

              {importResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="text-green-500" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">导入完成</p>
                      <p className="text-xs text-neutral-500">
                        成功 {importResult.success} 条，失败 {importResult.failed} 条
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setInputText('');
                      setParsedBets([]);
                      setImportResult(null);
                      setSelectedUserId('');
                    }}
                    className="w-full py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                  >
                    继续导入
                  </button>
                </motion.div>
              )}
            </div>

            <div className="p-5 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={handleImport}
                disabled={!selectedUserId || validCount === 0 || isImporting}
                className="w-full py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    导入 {validCount} 条记录
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BatchImportModal;
