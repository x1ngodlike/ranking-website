import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X, Settings, RefreshCw, Key, Globe, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiSettingsModal = ({ isOpen, onClose }: ApiSettingsModalProps) => {
  const apiConfig = useAppStore((state) => state.apiConfig);
  const setApiConfig = useAppStore((state) => state.setApiConfig);
  const syncMatchesFromApi = useAppStore((state) => state.syncMatchesFromApi);
  const isRefreshing = useAppStore((state) => state.isRefreshing);
  const lastRefreshTime = useAppStore((state) => state.lastRefreshTime);
  const refreshError = useAppStore((state) => state.refreshError);

  const [apiKey, setApiKey] = useState('');
  const [competitionId, setCompetitionId] = useState('2000');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState('60');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setApiKey(apiConfig.apiKey);
      setCompetitionId('2000');
      setAutoRefresh(apiConfig.autoRefresh);
      setRefreshInterval(String(apiConfig.refreshInterval));
      setSyncMessage(null);
    }
  }, [isOpen, apiConfig.apiKey, apiConfig.autoRefresh, apiConfig.refreshInterval]);

  const saveCurrentSettings = () => {
    setApiConfig({
      apiKey: apiKey.trim(),
      autoRefresh,
      refreshInterval: parseInt(refreshInterval) || 60,
    });
  };

  const handleSave = () => {
    saveCurrentSettings();
    setSyncMessage('设置已保存');
    setTimeout(() => setSyncMessage(null), 2000);
  };

  const handleSync = async () => {
    if (!apiKey.trim()) {
      setSyncMessage('请先输入 API Key');
      setTimeout(() => setSyncMessage(null), 2000);
      return;
    }

    try {
      setSyncMessage(null);
      saveCurrentSettings();

      const result = await syncMatchesFromApi(competitionId);
      setSyncMessage(`同步成功！新增 ${result.added} 场，更新 ${result.updated} 场比赛结果`);
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (error) {
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg bg-white dark:bg-neutral-800 border border-primary/20 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                <Settings size={20} className="text-primary-400" />
              </div>
              <div>
                <h2 className="font-display text-xl text-gradient-gold">
                  API 设置
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">配置足球数据 API 实现实时比分</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-500 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                <Key size={16} className="text-primary-400" />
                API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入你的 football-data.org API Key"
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-primary/20 text-neutral-800 dark:text-neutral-200 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
                免费注册获取:{' '}
                <a
                  href="https://www.football-data.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:underline"
                >
                  football-data.org
                </a>
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                <Globe size={16} className="text-primary-400" />
                赛事选择
              </label>
              <select
                value={competitionId}
                onChange={(e) => setCompetitionId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-primary/20 text-neutral-800 dark:text-neutral-200 text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="2000">国际足联世界杯 (FIFA World Cup)</option>
                <option value="2001">欧洲冠军杯 (UEFA Champions League)</option>
                <option value="2021">英超联赛 (Premier League)</option>
                <option value="2014">西甲联赛 (La Liga)</option>
                <option value="2002">德甲联赛 (Bundesliga)</option>
                <option value="2019">意甲联赛 (Serie A)</option>
                <option value="2015">法甲联赛 (Ligue 1)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <Clock size={16} className="text-primary-400" />
                    自动刷新
                  </label>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      autoRefresh ? 'bg-primary-500' : 'bg-neutral-100 dark:bg-neutral-700'
                    }`}
                  >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      autoRefresh ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {autoRefresh && (
                <div>
                  <label className="text-xs text-neutral-500 dark:text-neutral-500 mb-1 block">
                    刷新间隔（秒）
                  </label>
                  <input
                    type="number"
                    min="30"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-primary/20 text-neutral-800 dark:text-neutral-200 text-sm focus:outline-none focus:border-primary/50"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    免费版建议间隔 ≥ 60 秒（每分钟10次请求限制）
                  </p>
                </div>
              )}
            </div>

            {lastRefreshTime && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                上次更新: {new Date(lastRefreshTime).toLocaleString('zh-CN')}
              </p>
            )}

            {syncMessage && (
              <div className="p-3 rounded-xl bg-profit-500/20 border border-profit-500/30 text-profit-400 text-sm text-center">
                {syncMessage}
              </div>
            )}

            {refreshError && (
              <div className="p-3 rounded-xl bg-loss-500/20 border border-loss-500/30 text-loss-400 text-sm text-center">
                {refreshError}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 p-5 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={handleSync}
              disabled={!apiKey.trim() || isRefreshing}
              className="flex-1 btn-outline flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                size={18}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              {isRefreshing ? '同步中...' : '立即同步比赛'}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              保存设置
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ApiSettingsModal;
