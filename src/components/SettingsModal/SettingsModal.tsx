import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X, Settings, Lock, LogOut, RefreshCw, Eye, EyeOff, Trash2, Database, Brain, Newspaper, Users, AlertTriangle, ChevronRight, Shield, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminToken } from '@/utils/api';
import { applyDesignVersion } from '@/utils/theme';
import BackupModal from '../BackupModal/BackupModal';
import AIConfigModal from '../AIConfigModal/AIConfigModal';
import UsersModal from '../UsersModal/UsersModal';
import PasswordModal from '../PasswordModal/PasswordModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const environment = useAppStore((state) => state.environment);
  const isAdminLoggedIn = useAppStore((state) => state.isAdminLoggedIn);
  const adminLogin = useAppStore((state) => state.adminLogin);
  const adminLogout = useAppStore((state) => state.adminLogout);
  const switchEnvironment = useAppStore((state) => state.switchEnvironment);
  const clearEnvironmentData = useAppStore((state) => state.clearEnvironmentData);
  const designVersion = useAppStore((s) => s.designVersion);
  const setDesignVersion = useAppStore((s) => s.setDesignVersion);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSwitchingEnv, setIsSwitchingEnv] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showAIConfigModal, setShowAIConfigModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newsCount, setNewsCount] = useState(0);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [newsMessage, setNewsMessage] = useState('');

  const fetchNewsCount = async () => {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.success) setNewsCount(data.count || 0);
    } catch (e) {
      console.error('获取新闻数量失败:', e);
    }
  };

  const handleRefreshNews = async () => {
    if (isRefreshingNews) return;
    setIsRefreshingNews(true);
    setNewsMessage('');
    try {
      const token = getAdminToken();
      const res = await fetch('/api/news/refresh', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setNewsCount(data.count || 0);
        setNewsMessage(`刷新成功，共${data.count || 0}条新闻`);
      } else {
        setNewsMessage(data.message || '刷新失败');
      }
    } catch (e) {
      console.error('刷新新闻失败:', e);
      setNewsMessage('刷新失败，请重试');
    }
    setIsRefreshingNews(false);
    setTimeout(() => setNewsMessage(''), 2000);
  };

  useEffect(() => {
    if (isOpen && isAdminLoggedIn) fetchNewsCount();
  }, [isOpen, isAdminLoggedIn]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError('');
    const success = await adminLogin(password);
    setIsLoggingIn(false);
    if (success) {
      setPassword('');
      setLoginError('');
    } else {
      setLoginError('密码错误');
    }
  };

  const handleLogout = () => {
    adminLogout();
  };

  const handleSwitchEnv = async (env: 'production' | 'test') => {
    if (!isAdminLoggedIn || isSwitchingEnv) return;
    setIsSwitchingEnv(true);
    await switchEnvironment(env);
    setIsSwitchingEnv(false);
  };

  const handleClearData = async () => {
    if (!confirm(`确定要清除${environment === 'production' ? '正式' : '测试'}环境的所有数据吗？此操作不可恢复！`)) return;
    setIsClearingData(true);
    const success = await clearEnvironmentData(environment);
    setIsClearingData(false);
    if (success) alert('数据已清除');
    else alert('清除失败，请重试');
  };

  const inputClass = `w-full px-3 py-2.5 ${designVersion === 'v2' ? 'rounded-lg border border-[var(--v2-border)] bg-[var(--v2-bg)] text-[var(--v2-text)]' : 'rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'} placeholder:text-neutral-400 focus:outline-none focus:border-primary-500/50 transition-all text-sm`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            className={`${designVersion === 'v2' ? 'bg-[var(--v2-bg-card)] border border-[var(--v2-border)] rounded-xl' : 'bg-white dark:bg-neutral-900 rounded-2xl'} w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <Settings className="text-primary-500" size={20} />
                </div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-lg font-semibold ${designVersion === 'v2' ? 'font-v2-display text-[var(--v2-text)]' : 'text-neutral-900 dark:text-neutral-100'}`}>设置</h2>
                  {isAdminLoggedIn && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/40">
                      <Shield size={10} />
                      已登录
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {!isAdminLoggedIn ? (
                /* Login Form */
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && !isLoggingIn && handleLogin()}
                      placeholder="请输入管理员密码"
                      disabled={isLoggingIn}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {loginError && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle size={14} /> {loginError}
                    </p>
                  )}
                  <button
                    onClick={handleLogin}
                    disabled={isLoggingIn || !password.trim()}
                    className={`w-full py-2.5 ${designVersion === 'v2' ? 'rounded-lg' : 'rounded-xl'} bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoggingIn ? '登录中...' : '登录'}
                  </button>
                </div>
              ) : (
                /* Settings List */
                <div className="space-y-2">
                  {/* 环境切换 */}
                  <div className={`flex items-center justify-between p-3.5 ${designVersion === 'v2' ? 'rounded-xl border border-[var(--v2-border)] hover:bg-[var(--v2-bg-muted)]' : 'rounded-xl border border-neutral-100 dark:border-neutral-700/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'} transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${designVersion === 'v2' ? 'bg-[var(--v2-bg-muted)] text-[var(--v2-text)]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                        <RefreshCw size={16} />
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">运行环境</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(['production', 'test'] as const).map((env) => (
                        <button
                          key={env}
                          onClick={() => handleSwitchEnv(env)}
                          disabled={isSwitchingEnv}
                          className={`px-3 py-1.5 ${designVersion === 'v2' ? 'rounded-lg' : 'rounded-lg'} text-xs font-medium transition-all ${
                            environment === env
                              ? 'bg-primary-500 text-white'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                          } disabled:opacity-50`}
                        >
                          {env === 'production' ? '正式' : '测试'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 界面风格 */}
                  <div className={`flex items-center justify-between p-3.5 ${designVersion === 'v2' ? 'rounded-xl border border-[var(--v2-border)] hover:bg-[var(--v2-bg-muted)]' : 'rounded-xl border border-neutral-100 dark:border-neutral-700/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'} transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${designVersion === 'v2' ? 'bg-[var(--v2-bg-muted)] text-[var(--v2-text)]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                        <Layers size={16} />
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">界面风格</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(['v2', 'v1'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => {
                            setDesignVersion(v);
                            applyDesignVersion(v);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            designVersion === v
                              ? 'bg-primary-500 text-white'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {v === 'v2' ? '新版' : '旧版'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 成员管理 */}
                  <button
                    onClick={() => setShowUsersModal(true)}
                    className={`w-full flex items-center justify-between p-3.5 ${designVersion === 'v2' ? 'rounded-xl border border-[var(--v2-border)] hover:bg-[var(--v2-bg-muted)]' : 'rounded-xl border border-neutral-100 dark:border-neutral-700/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'} transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${designVersion === 'v2' ? 'bg-[var(--v2-bg-muted)] text-[var(--v2-text)]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                        <Users size={16} />
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">成员管理</span>
                    </div>
                    <ChevronRight size={16} className="text-neutral-400" />
                  </button>

                  {/* AI 识别配置 */}
                  <button
                    onClick={() => setShowAIConfigModal(true)}
                    className={`w-full flex items-center justify-between p-3.5 ${designVersion === 'v2' ? 'rounded-xl border border-[var(--v2-border)] hover:bg-[var(--v2-bg-muted)]' : 'rounded-xl border border-neutral-100 dark:border-neutral-700/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'} transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${designVersion === 'v2' ? 'bg-[var(--v2-bg-muted)] text-[var(--v2-text)]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                        <Brain size={16} />
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">AI 识别配置</span>
                    </div>
                    <ChevronRight size={16} className="text-neutral-400" />
                  </button>

                  {/* 热点新闻 */}
                  <button
                    onClick={handleRefreshNews}
                    disabled={isRefreshingNews}
                    className={`w-full flex items-center justify-between p-3.5 ${designVersion === 'v2' ? 'rounded-xl border border-[var(--v2-border)] hover:bg-[var(--v2-bg-muted)]' : 'rounded-xl border border-neutral-100 dark:border-neutral-700/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'} transition-colors disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${designVersion === 'v2' ? 'bg-[var(--v2-bg-muted)] text-[var(--v2-text)]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                        <Newspaper size={16} />
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">热点新闻</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                        {newsCount}条
                      </span>
                      <RefreshCw size={14} className={`text-neutral-400 ${isRefreshingNews ? 'animate-spin' : ''}`} />
                    </div>
                  </button>

                  {newsMessage && (
                    <div className={`text-xs text-center py-2 rounded-lg ${newsMessage.includes('成功') ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                      {newsMessage}
                    </div>
                  )}

                  {/* 备份与还原 */}
                  <button
                    onClick={() => setShowBackupModal(true)}
                    className={`w-full flex items-center justify-between p-3.5 ${designVersion === 'v2' ? 'rounded-xl border border-[var(--v2-border)] hover:bg-[var(--v2-bg-muted)]' : 'rounded-xl border border-neutral-100 dark:border-neutral-700/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'} transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${designVersion === 'v2' ? 'bg-[var(--v2-bg-muted)] text-[var(--v2-text)]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                        <Database size={16} />
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">备份与还原</span>
                    </div>
                    <ChevronRight size={16} className="text-neutral-400" />
                  </button>

                  {/* 修改密码 */}
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className={`w-full flex items-center justify-between p-3.5 ${designVersion === 'v2' ? 'rounded-xl border border-[var(--v2-border)] hover:bg-[var(--v2-bg-muted)]' : 'rounded-xl border border-neutral-100 dark:border-neutral-700/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'} transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${designVersion === 'v2' ? 'bg-[var(--v2-bg-muted)] text-[var(--v2-text)]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                        <Lock size={16} />
                      </div>
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">修改密码</span>
                    </div>
                    <ChevronRight size={16} className="text-neutral-400" />
                  </button>

                  {/* 清除数据 */}
                  <button
                    onClick={handleClearData}
                    disabled={isClearingData}
                    className={`w-full flex items-center justify-between p-3.5 ${designVersion === 'v2' ? 'rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10' : 'rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10'} transition-colors disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                        <Trash2 size={16} />
                      </div>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">清除数据</span>
                    </div>
                    <ChevronRight size={16} className="text-red-300 dark:text-red-700" />
                  </button>

                  {/* 退出登录 */}
                  <div className="pt-3">
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 ${designVersion === 'v2' ? 'rounded-lg border border-[var(--v2-border)] text-[var(--v2-text)] hover:bg-[var(--v2-bg-muted)]' : 'rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'} text-sm font-medium transition-colors`}
                    >
                      <LogOut size={16} />
                      退出管理员
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <BackupModal isOpen={showBackupModal} onClose={() => setShowBackupModal(false)} />
          <AIConfigModal isOpen={showAIConfigModal} onClose={() => setShowAIConfigModal(false)} />
          <UsersModal isOpen={showUsersModal} onClose={() => setShowUsersModal(false)} />
          <PasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;