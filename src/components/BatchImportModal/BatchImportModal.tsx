import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User as UserType } from '@/types';

interface RecognizedBet {
  originalText: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  playType: string;
  option: string;
  odds: number;
  betAmount: number;
  winAmount: number;
  comment: string;
  recognized: boolean;
  error?: string;
}

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const currentYear = new Date().getFullYear();

const parseBetLine = (line: string): Partial<RecognizedBet> | null => {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 尝试多种正则模式
  const patterns = [
    // 6.12，加拿大 vs 波黑，胜平负：平，赔率 3.4，投注金额 13，盈利金额 31.2
    /(\d{1,2})[\.\/月](\d{1,2})日?[，,\s]+(.+?)\s*(?:vs|VS|对)\s*(.+?)[，,\s]+(.+?)[：:]\s*(.+?)[，,\s]+赔率\s*([\d.]+)[，,\s]+投注金额\s*([\d.]+)[，,\s]+盈利金额\s*([\d.]+)/i,
    // 6.12 加拿大vs波黑 平 3.4倍 投13中31.2
    /(\d{1,2})[\.\/月](\d{1,2})日?\s+(.+?)\s*(?:vs|VS|对)\s*(.+?)\s+(.+?)\s+([\d.]+)(?:倍|赔率)?\s+(?:投|投注)?\s*([\d.]+)\s*(?:中|盈利)?\s*([\d.]+)/i,
    // 6.12，加拿大 vs 波黑，平，3.4，13，31.2
    /(\d{1,2})[\.\/月](\d{1,2})日?[，,\s]+(.+?)\s*(?:vs|VS|对)\s*(.+?)[，,\s]+(.+?)[，,\s]+([\d.]+)[，,\s]+([\d.]+)[，,\s]+([\d.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const [, month, day, home, away, playOrOption, optionOrOdds, oddsOrBet, betOrWin, winOrExtra] = match;

      let playType = '胜平负';
      let option = '';
      let odds = 0;
      let betAmount = 0;
      let winAmount = 0;

      // 判断第5个分组是玩法还是选项
      if (/胜平负|让球|比分|进球数|半全场/i.test(playOrOption)) {
        playType = playOrOption.trim();
        option = optionOrOdds.trim();
        odds = parseFloat(oddsOrBet) || 0;
        betAmount = parseFloat(betOrWin) || 0;
        winAmount = parseFloat(winOrExtra) || 0;
      } else {
        option = playOrOption.trim();
        odds = parseFloat(optionOrOdds) || 0;
        betAmount = parseFloat(oddsOrBet) || 0;
        winAmount = parseFloat(betOrWin) || 0;
      }

      const date = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      return {
        originalText: trimmed,
        date,
        homeTeam: home.trim(),
        awayTeam: away.trim(),
        playType,
        option,
        odds,
        betAmount,
        winAmount,
      };
    }
  }

  return null;
};

const generateComment = (bet: Partial<RecognizedBet>): string => {
  const { homeTeam, awayTeam, playType, option, odds, betAmount, winAmount } = bet;
  const h = homeTeam || '?';
  const a = awayTeam || '?';
  const p = playType || '?';
  const o = option || '?';
  const odd = odds || 0;
  const ba = betAmount || 0;
  const wa = winAmount || 0;

  let emoji = '🎯';
  if (odd >= 5) emoji = '🚀';
  else if (odd >= 3) emoji = '⚡';
  else if (odd <= 1.5) emoji = '🛡️';

  const comments = [
    `${emoji} 搏一搏，单车变摩托！`,
    `${emoji} 这眼光，不去当球探可惜了！`,
    `${emoji} 买彩票的最高境界：随便买都能中！`,
    `${emoji} 这波操作，体彩中心都哭了！`,
    `${emoji} 稳如老狗，恭喜收米！`,
  ];
  const randomComment = comments[Math.floor(Math.random() * comments.length)];

  return `📋 票面解析
${h} vs ${a} | ${p}：${o} | 赔率${odd} → ✅中
🔗 过关：1场1关 | 投注1注
💰 本金：¥${ba}元 | 中奖：¥${wa}元

💬 点评
${randomComment}`;
};

const BatchImportModal = ({ isOpen, onClose }: BatchImportModalProps) => {
  const users = useAppStore((state) => state.users);
  const addBet = useAppStore((state) => state.addBet);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [recognizedBets, setRecognizedBets] = useState<RecognizedBet[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const recognizeText = useCallback((text: string): RecognizedBet[] => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    if (lines.length === 0) return [];

    return lines.map((line) => {
      const parsed = parseBetLine(line);

      if (parsed && parsed.homeTeam && parsed.winAmount) {
        return {
          originalText: line,
          date: parsed.date || '',
          homeTeam: parsed.homeTeam,
          awayTeam: parsed.awayTeam || '',
          playType: parsed.playType || '胜平负',
          option: parsed.option || '',
          odds: parsed.odds || 0,
          betAmount: parsed.betAmount || 0,
          winAmount: parsed.winAmount,
          comment: generateComment(parsed),
          recognized: true,
        };
      }

      return {
        originalText: line,
        date: '',
        homeTeam: '',
        awayTeam: '',
        playType: '',
        option: '',
        odds: 0,
        betAmount: 0,
        winAmount: 0,
        comment: '',
        recognized: false,
        error: '格式无法识别',
      };
    });
  }, []);

  const handleRecognize = async () => {
    if (!inputText.trim()) return;

    setIsRecognizing(true);
    setGlobalError(null);
    setRecognizedBets([]);
    setImportProgress(0);

    // 模拟异步，让UI有响应
    await new Promise((r) => setTimeout(r, 300));

    const results = recognizeText(inputText);
    setRecognizedBets(results);
    setIsRecognizing(false);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!selectedUserId || recognizedBets.filter((b) => b.recognized).length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    const validBets = recognizedBets.filter((b) => b.recognized);
    let success = 0;
    let failed = 0;

    for (let i = 0; i < validBets.length; i++) {
      const bet = validBets[i];
      try {
        addBet({
          id: `bet-${Date.now()}-${i}`,
          userId: selectedUserId,
          date: bet.date || new Date().toISOString().split('T')[0],
          winAmount: bet.winAmount,
          note: bet.originalText,
          aiComment: bet.comment,
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

  const recognizedCount = recognizedBets.filter((b) => b.recognized).length;
  const unrecognizedCount = recognizedBets.filter((b) => !b.recognized).length;

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
                  <p className="text-xs text-neutral-500">智能识别文本格式投注记录</p>
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
                  <span className="text-neutral-400 font-normal ml-2">（每行一条，任意格式）</span>
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="6.12 加拿大vs波黑 平 3.4倍 投13中31.2"
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500/50 transition-all text-sm h-32 resize-none"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  将自动识别日期、对阵、玩法、赔率、金额等信息
                </p>
              </div>

              <button
                onClick={handleRecognize}
                disabled={!inputText.trim() || isRecognizing}
                className="w-full py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRecognizing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    识别中...
                  </>
                ) : (
                  <>
                    <Loader2 size={16} />
                    智能识别
                  </>
                )}
              </button>

              {globalError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" />
                    <span className="text-sm text-red-700 dark:text-red-400">{globalError}</span>
                  </div>
                </div>
              )}

              {recognizedBets.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-500">识别结果</span>
                    <span className="text-xs">
                      <span className="text-green-500">{recognizedCount}条成功</span>
                      {unrecognizedCount > 0 && (
                        <span className="text-red-500 ml-2">{unrecognizedCount}条失败</span>
                      )}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {recognizedBets.map((bet, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border ${
                          bet.recognized
                            ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30'
                            : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {bet.recognized ? (
                            <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-neutral-500 mb-1 truncate">{bet.originalText}</p>
                            {bet.recognized ? (
                              <div className="text-sm">
                                <span className="text-neutral-900 dark:text-neutral-100">
                                  {bet.date} {bet.homeTeam} vs {bet.awayTeam}
                                </span>
                                <span className="text-neutral-600 dark:text-neutral-400 ml-2">
                                  {bet.playType}:{bet.option}
                                </span>
                                <span className="text-green-600 dark:text-green-400 ml-2">
                                  ¥{bet.winAmount}
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-red-600 dark:text-red-400">{bet.error}</p>
                            )}
                          </div>
                        </div>
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
                      setRecognizedBets([]);
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
                disabled={!selectedUserId || recognizedCount === 0 || isImporting}
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
                    导入 {recognizedCount} 条记录
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
