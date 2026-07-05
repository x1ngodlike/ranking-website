import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Sparkles, Calculator, Star, RefreshCw, AlertCircle, History, ChevronLeft, Check, X } from 'lucide-react';

const CALCULATOR_URL = 'https://m.sporttery.cn/mjc/jsq/zqspf/';

interface Prediction {
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  result: string;
  analysis: string;
  confidence: number;
  actualHomeScore?: number | null;
  actualAwayScore?: number | null;
  actualResult?: string | null;
  isCorrect?: boolean | null;
  matchTime?: string | null;
}

interface PredictionRecord {
  date: string;
  createdAt: string;
  predictions: Prediction[];
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};

const CalculatorPage = () => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'prediction'>('calculator');
  const [view, setView] = useState<'current' | 'history'>('current');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<PredictionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLatestPrediction();
    fetchHistory();
  }, []);

  const fetchLatestPrediction = async () => {
    try {
      const res = await fetch('/api/ai/predict/latest');
      const data = await res.json();
      if (data.success && data.prediction) {
        setPredictions(data.prediction.predictions || []);
      }
    } catch (e) {
      // 静默失败
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/predict/history');
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (e) {
      // 静默失败
    }
  };

  const fetchPredictions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/predict');
      const data = await res.json();
      if (data.success) {
        setPredictions(data.predictions || []);
        fetchHistory();
      } else {
        setError(data.message || '预测失败');
      }
    } catch (e) {
      setError('预测失败，请稍后重试');
    }
    setIsLoading(false);
  };

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < count ? 'text-amber-500 fill-amber-500' : 'text-neutral-300 dark:text-neutral-600'}
      />
    ));
  };

  const renderPredictionCard = (pred: Prediction, index: number) => {
    const hasResult = pred.isCorrect !== null && pred.isCorrect !== undefined;
    const isCorrect = pred.isCorrect === true;
    const isWrong = pred.isCorrect === false;

    return (
      <motion.div
        key={`${pred.matchNumber}-${index}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="card p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
            第{pred.matchNumber}场
          </span>
          <div className="flex items-center gap-2">
            {hasResult && (
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                isCorrect
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              }`}>
                {isCorrect ? <Check size={10} /> : <X size={10} />}
                {isCorrect ? '预测正确' : '预测错误'}
              </span>
            )}
            <div className="flex items-center gap-0.5">
              {renderStars(pred.confidence)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 text-center">
            <p className="font-medium text-sm sm:text-base">{pred.homeTeam}</p>
          </div>
          <div className="px-4 py-2 mx-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
            <span className="font-display text-xl sm:text-2xl font-bold text-primary-500">
              {pred.homeScore} - {pred.awayScore}
            </span>
            {hasResult && (
              <p className="text-xs text-neutral-400 mt-1 text-center">
                实际: {pred.actualHomeScore}-{pred.actualAwayScore}
              </p>
            )}
          </div>
          <div className="flex-1 text-center">
            <p className="font-medium text-sm sm:text-base">{pred.awayTeam}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            pred.result === '胜'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : pred.result === '负'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
          }`}>
            主{pred.result}
          </span>
          {hasResult && pred.actualResult && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              pred.actualResult === '胜'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-500 dark:text-green-500/80'
                : pred.actualResult === '负'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-500/80'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-500/80'
            }`}>
              实际: 主{pred.actualResult}
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          {pred.analysis}
        </p>
      </motion.div>
    );
  };

  const currentPredictions = selectedHistory ? selectedHistory.predictions : predictions;
  const currentTitle = selectedHistory
    ? `${formatDate(selectedHistory.date)} 预测记录`
    : '今日AI预测';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between gap-3 mb-4"
      >
        <div>
          <h1 className="font-display text-2xl sm:text-4xl text-gradient-gold mb-1">奖金计算器</h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-500">竞彩足球胜平负奖金计算</p>
        </div>
        <a
          href={CALCULATOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline flex items-center gap-1.5 text-xs sm:text-sm flex-shrink-0 px-3 py-2"
        >
          <ExternalLink size={14} />
          <span className="sm:inline">新窗口打开</span>
          <span className="sm:hidden">打开</span>
        </a>
      </motion.div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'calculator'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <Calculator size={16} />
          奖金计算
        </button>
        <button
          onClick={() => setActiveTab('prediction')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'prediction'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <Sparkles size={16} />
          AI预测
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'calculator' && (
          <motion.div
            key="calculator"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="flex justify-center"
          >
            <div
              className="w-full max-w-md border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden shadow-lg"
              style={{ height: 'calc(100vh - 260px)', maxHeight: '600px' }}
            >
              <iframe
                src={CALCULATOR_URL}
                title="竞彩足球胜平负奖金计算器"
                className="w-full h-full"
                style={{ border: 'none', width: 'calc(100% + 17px)' }}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'prediction' && (
          <motion.div
            key="prediction"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
            style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}
          >
            {error && (
              <div className="card p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
              </div>
            )}

            {view === 'current' && !selectedHistory && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">
                    {currentPredictions.length > 0 ? `${currentTitle} · ${currentPredictions.length}场` : 'AI智能比分预测'}
                  </p>
                  <div className="flex items-center gap-3">
                    {history.length > 0 && (
                      <button
                        onClick={() => setView('history')}
                        className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-primary-500"
                      >
                        <History size={14} />
                        历史
                      </button>
                    )}
                    <button
                      onClick={fetchPredictions}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                      刷新
                    </button>
                  </div>
                </div>

                {isLoading && currentPredictions.length === 0 && (
                  <div className="card p-8 text-center">
                    <Sparkles size={32} className="mx-auto mb-3 text-primary-500 animate-pulse" />
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">AI正在分析比赛数据...</p>
                  </div>
                )}

                {!isLoading && currentPredictions.length === 0 && !error && (
                  <div className="card p-8 text-center">
                    <Sparkles size={32} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">暂无预测数据</p>
                    <button onClick={fetchPredictions} className="btn-primary text-sm px-4 py-2">
                      开始预测
                    </button>
                  </div>
                )}

                {currentPredictions.map((pred, index) => renderPredictionCard(pred, index))}

                {currentPredictions.length > 0 && (
                  <p className="text-xs text-center text-neutral-400 dark:text-neutral-500 pt-2 pb-4">
                    ⚠️ 预测仅供娱乐参考，不构成投注建议。足球是圆的，一切皆有可能！
                  </p>
                )}
              </>
            )}

            {view === 'history' && !selectedHistory && (
              <>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setView('current')}
                    className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600"
                  >
                    <ChevronLeft size={16} />
                    返回
                  </button>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">预测历史 · {history.length}条</p>
                </div>

                {history.length === 0 && (
                  <div className="card p-8 text-center">
                    <History size={32} className="mx-auto mb-3 text-neutral-300 dark:text-neutral-600" />
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">暂无历史记录</p>
                  </div>
                )}

                {history.map((record, index) => {
                  const total = record.predictions.length;
                  const correct = record.predictions.filter(p => p.isCorrect === true).length;
                  const wrong = record.predictions.filter(p => p.isCorrect === false).length;
                  const pending = total - correct - wrong;
                  const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

                  return (
                    <motion.button
                      key={record.date}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedHistory(record)}
                      className="card p-4 w-full text-left hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{formatDate(record.date)} 预测</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            共{total}场 · 正确{correct} · 错误{wrong} · 待定{pending}
                          </p>
                        </div>
                        {correct + wrong > 0 && (
                          <div className="text-right">
                            <p className={`text-lg font-bold ${accuracy >= 60 ? 'text-green-500' : accuracy >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                              {accuracy}%
                            </p>
                            <p className="text-xs text-neutral-400">命中率</p>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </>
            )}

            {selectedHistory && (
              <>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedHistory(null)}
                    className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600"
                  >
                    <ChevronLeft size={16} />
                    返回历史
                  </button>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">
                    {currentTitle} · {currentPredictions.length}场
                  </p>
                </div>

                {currentPredictions.map((pred, index) => renderPredictionCard(pred, index))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalculatorPage;
