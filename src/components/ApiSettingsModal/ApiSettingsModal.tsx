import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X, Settings, RefreshCw, Key, Globe, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/utils/api';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiSettingsModal = ({ isOpen, onClose }: ApiSettingsModalProps) => {
  const setApiConfig = useAppStore((state) => state.setApiConfig);
  const syncMatchesFromApi = useAppStore((state) => state.syncMatchesFromApi);
  const isRefreshing = useAppStore((state) => state.isRefreshing);
  const lastRefreshTime = useAppStore((state) => state.lastRefreshTime);
  const refreshError = useAppStore((state) => state.refreshError);
  const isAdminLoggedIn = useAppStore((state) => state.isAdminLoggedIn);
  const environment = useAppStore((state) => state.environment);

  const [apiKey, setApiKey] = useState('');
  const [competitionId, setCompetitionId] = useState('2000');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !isAdminLoggedIn) return;
    let active = true;
    setApiKey('');
    setSyncMessage(null);
    setIsLoadingConfig(true);
    api.getFootballConfig(environment)
      .then((result) => {
        if (!active) return;
        setCompetitionId(result.config.competition || '2000');
        setApiKeyConfigured(result.config.apiKeyConfigured);
      })
      .catch((error) => {
        if (active) setSyncMessage(error instanceof Error ? error.message : '加载配置失败');
      })
      .finally(() => {
        if (active) setIsLoadingConfig(false);
      });
    return () => { active = false; };
  }, [environment, isAdminLoggedIn, isOpen]);

  const saveCurrentSettings = async () => {
    const nextKey = apiKey.trim();
    const result = await api.saveFootballConfig(environment, {
      competition: competitionId,
      ...(nextKey ? { apiKey: nextKey } : {}),
    });
    setApiKeyConfigured(result.config.apiKeyConfigured);
    setApiConfig({
      ...(nextKey ? { apiKey: nextKey } : {}),
      competition: result.config.competition,
      autoRefresh: true,
    });
    setApiKey('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSyncMessage(null);
    try {
      await saveCurrentSettings();
      setSyncMessage('设置已保存');
      setTimeout(() => setSyncMessage(null), 2000);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    if (!apiKeyConfigured && !apiKey.trim()) {
      setSyncMessage('请先输入 API Key');
      setTimeout(() => setSyncMessage(null), 2000);
      return;
    }

    try {
      setSyncMessage(null);
      setIsSaving(true);
      await saveCurrentSettings();

      const result = await syncMatchesFromApi();
      setSyncMessage(`同步成功！共 ${result.added} 场比赛`);
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : '同步失败');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !isAdminLoggedIn) return null;

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
          role="dialog"
          aria-modal="true"
          aria-labelledby="football-api-settings-title"
        >
          <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                <Settings size={20} className="text-primary-400" />
              </div>
              <div>
                <h2 id="football-api-settings-title" className="font-display text-xl text-gradient-gold">
                  API 设置
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">配置足球数据 API 实现实时比分</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="关闭赛程 API 设置"
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-500 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <div>
              <label htmlFor="football-api-key" className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                <Key size={16} className="text-primary-400" />
                API Key
              </label>
              <input
                id="football-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={apiKeyConfigured ? '已配置；留空表示保持不变' : '输入你的 football-data.org API Key'}
                disabled={isLoadingConfig || isSaving}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-primary/20 text-neutral-800 dark:text-neutral-200 text-sm focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
              <label htmlFor="football-competition" className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                <Globe size={16} className="text-primary-400" />
                赛事选择
              </label>
              <select
                id="football-competition"
                value={competitionId}
                onChange={(e) => setCompetitionId(e.target.value)}
                disabled={isLoadingConfig || isSaving}
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-primary/20 text-neutral-800 dark:text-neutral-200 text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-primary-400" />
                <span className="text-sm text-neutral-500 dark:text-neutral-400">自动刷新策略</span>
              </div>
              <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-primary-400 mt-0.5 flex-shrink-0" />
                  <span>比赛进行中：每 <span className="font-medium text-neutral-800 dark:text-neutral-200">1 分钟</span> 刷新一次</span>
                </div>
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-primary-400 mt-0.5 flex-shrink-0" />
                  <span>无比赛进行时：每 <span className="font-medium text-neutral-800 dark:text-neutral-200">4 小时</span> 刷新一次</span>
                </div>
              </div>
            </div>

            {lastRefreshTime && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                上次更新: {new Date(lastRefreshTime).toLocaleString('zh-CN')}
              </p>
            )}

            {syncMessage && (
              <div role="status" className="p-3 rounded-xl bg-profit-500/20 border border-profit-500/30 text-profit-400 text-sm text-center">
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
              disabled={(!apiKeyConfigured && !apiKey.trim()) || isRefreshing || isSaving || isLoadingConfig}
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
              disabled={isSaving || isLoadingConfig}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中…' : '保存设置'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ApiSettingsModal;
