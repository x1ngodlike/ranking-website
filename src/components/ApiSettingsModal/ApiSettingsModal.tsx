import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X, Settings, RefreshCw, Key, Globe, Clock, Lock, Eye, EyeOff, Info } from 'lucide-react';
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
  const isAdminLoggedIn = useAppStore((state) => state.isAdminLoggedIn);
  const adminLogin = useAppStore((state) => state.adminLogin);

  const [apiKey, setApiKey] = useState('');
  const [competitionId, setCompetitionId] = useState('2000');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(apiConfig.apiKey);
      setCompetitionId('2000');
      setSyncMessage(null);
      setPassword('');
      setLoginError('');
    }
  }, [isOpen, apiConfig.apiKey]);

  const handleLogin = async () => {
    if (!password.trim()) return;
    setIsLoggingIn(true);
    setLoginError('');
    const success = await adminLogin(password);
    setIsLoggingIn(false);
    if (!success) {
      setLoginError('密码错误');
    }
    setPassword('');
  };

  const saveCurrentSettings = () => {
    setApiConfig({
      apiKey: apiKey.trim(),
      autoRefresh: true,
    });
  };

  const handleSave = async () => {
    setApiConfig({
      apiKey: apiKey.trim(),
      autoRefresh: true,
    });
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

      const result = await syncMatchesFromApi();
      setSyncMessage(`同步成功！共 ${result.added} 场比赛`);
      setTimeout(() => setSyncMessage(null), 4000);
    } catch {
      // 静默失败
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
            {!isAdminLoggedIn && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                  <Lock size={18} />
                  <span className="font-medium">管理员专享</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  API 设置仅限管理员修改，请先登录
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setLoginError('');
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && !isLoggingIn && handleLogin()}
                      placeholder="管理员密码"
                      disabled={isLoggingIn}
                      className="w-full px-4 py-2.5 pr-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-sm focus:outline-none focus:border-primary-500/50 transition-colors disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    onClick={handleLogin}
                    disabled={isLoggingIn || !password.trim()}
                    className="px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoggingIn ? '登录中...' : '登录'}
                  </button>
                </div>
                {loginError && (
                  <p className="text-sm text-red-500 mt-2">{loginError}</p>
                )}
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                <Key size={16} className="text-primary-400" />
                API Key {!isAdminLoggedIn && <span className="text-xs text-neutral-400">(仅查看)</span>}
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入你的 football-data.org API Key"
                disabled={!isAdminLoggedIn}
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
              <label className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                <Globe size={16} className="text-primary-400" />
                赛事选择 {!isAdminLoggedIn && <span className="text-xs text-neutral-400">(仅查看)</span>}
              </label>
              <select
                value={competitionId}
                onChange={(e) => setCompetitionId(e.target.value)}
                disabled={!isAdminLoggedIn}
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
              disabled={!apiKey.trim() || isRefreshing || !isAdminLoggedIn}
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
              disabled={!isAdminLoggedIn}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
