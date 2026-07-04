import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X, Settings, Lock, LogOut, RefreshCw, Check, Eye, EyeOff, Trash2, Database, Brain, Newspaper, Users, Plus, Edit2, ExternalLink, Globe, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackupModal from '../BackupModal/BackupModal';
import AIConfigModal from '../AIConfigModal/AIConfigModal';
import EditUserModal from '../EditUserModal/EditUserModal';
import Avatar from '../Avatar';
import { AvatarPicker } from '../AvatarPicker/AvatarPicker';
import type { User } from '@/types';

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
  const changeAdminPassword = useAppStore((state) => state.changeAdminPassword);
  const clearEnvironmentData = useAppStore((state) => state.clearEnvironmentData);
  const users = useAppStore((state) => state.users);
  const bets = useAppStore((state) => state.bets);
  const addUserWithUpload = useAppStore((state) => state.addUserWithUpload);
  const updateUser = useAppStore((state) => state.updateUser);
  const removeUser = useAppStore((state) => state.removeUser);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSwitchingEnv, setIsSwitchingEnv] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showAIConfigModal, setShowAIConfigModal] = useState(false);
  const [newsCount, setNewsCount] = useState(0);
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);

  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserNickname, setNewUserNickname] = useState('');
  const [newUserAvatar, setNewUserAvatar] = useState('⚽️');
  const [newUserCustomImage, setNewUserCustomImage] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const getUserStats = (userId: string) => {
    const userBets = bets.filter((b) => b.userId === userId);
    const totalWinAmount = userBets.reduce((sum, b) => sum + (b.winAmount ?? 0), 0);
    return { totalBets: userBets.length, totalWinAmount };
  };

  const fetchNewsCount = async () => {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.success) {
        setNewsCount(data.count || 0);
      }
    } catch (e) {
      console.error('获取新闻数量失败:', e);
    }
  };

  const handleRefreshNews = async () => {
    if (isRefreshingNews) return;
    setIsRefreshingNews(true);
    try {
      const res = await fetch('/api/news/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNewsCount(data.count || 0);
      }
    } catch (e) {
      console.error('刷新新闻失败:', e);
    }
    setIsRefreshingNews(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserNickname.trim()) return;

    let imageBlob: Blob | null = null;
    if (newUserCustomImage && newUserCustomImage.startsWith('data:')) {
      const response = await fetch(newUserCustomImage);
      imageBlob = await response.blob();
    }

    await addUserWithUpload(newUserNickname.trim(), newUserAvatar, imageBlob);
    setNewUserNickname('');
    setNewUserAvatar('⚽️');
    setNewUserCustomImage(null);
    setShowAddUserForm(false);
  };

  useEffect(() => {
    if (isOpen && isAdminLoggedIn) {
      fetchNewsCount();
    }
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
    setShowPasswordForm(false);
  };

  const handleSwitchEnv = async (env: 'production' | 'test') => {
    if (!isAdminLoggedIn || isSwitchingEnv) return;
    setIsSwitchingEnv(true);
    await switchEnvironment(env);
    setIsSwitchingEnv(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordChangeMsg('两次输入的新密码不一致');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordChangeMsg('新密码至少4位');
      return;
    }
    setIsChangingPassword(true);
    setPasswordChangeMsg('');
    const success = await changeAdminPassword(oldPassword, newPassword);
    setIsChangingPassword(false);
    if (success) {
      setPasswordChangeMsg('密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordChangeMsg(''), 2000);
    } else {
      setPasswordChangeMsg('旧密码错误或修改失败');
    }
  };

  const handleClearData = async () => {
    if (!confirm(`确定要清除${environment === 'production' ? '正式' : '测试'}环境的所有数据吗？此操作不可恢复！`)) {
      return;
    }
    setIsClearingData(true);
    const success = await clearEnvironmentData(environment);
    setIsClearingData(false);
    if (success) {
      alert('数据已清除');
    } else {
      alert('清除失败，请重试');
    }
  };

  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: typeof Settings; title: string; subtitle?: string }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-xl bg-primary-500/10 flex items-center justify-center">
        <Icon className="text-primary-500" size={18} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
        {subtitle && <p className="text-xs text-neutral-500 dark:text-neutral-500">{subtitle}</p>}
      </div>
    </div>
  );

  const SettingsButton = ({ icon: Icon, label, description, onClick, variant = 'default', disabled, badge }: { icon: typeof Settings; label: string; description?: string; onClick: () => void; variant?: 'default' | 'danger'; disabled?: boolean; badge?: string }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
        variant === 'danger'
          ? 'hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-900/30'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/60'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
        }`}>
          <Icon size={18} />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
          {description && <p className="text-xs text-neutral-500 dark:text-neutral-500">{description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            {badge}
          </span>
        )}
        <ChevronRight size={16} className="text-neutral-400" />
      </div>
    </button>
  );

  const ActionButton = ({ children, variant = 'primary', onClick, disabled, className = '' }: { children: React.ReactNode; variant?: 'primary' | 'outline' | 'danger'; onClick?: () => void; disabled?: boolean; className?: string }) => {
    const baseStyles = 'px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200';
    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 disabled:bg-primary-400',
      outline: 'border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:border-neutral-300 dark:disabled:border-neutral-600',
      danger: 'border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:text-red-400 dark:disabled:text-red-500',
    };
    return (
      <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}>
        {children}
      </button>
    );
  };

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
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Settings className="text-white" size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">设置</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500">管理系统配置和账户</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!isAdminLoggedIn ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4"
                >
                  <SectionHeader icon={Lock} title="管理员登录" subtitle="输入密码以访问高级功能" />
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setLoginError('');
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoggingIn && handleLogin()}
                        placeholder="请输入管理员密码"
                        disabled={isLoggingIn}
                        className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/10 transition-all text-sm"
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
                        <AlertTriangle size={14} />
                        {loginError}
                      </p>
                    )}
                    
                    <ActionButton onClick={handleLogin} disabled={isLoggingIn || !password.trim()} className="w-full py-3">
                      {isLoggingIn ? '登录中...' : '登录'}
                    </ActionButton>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-primary-50 to-primary-500/5 dark:from-primary-900/10 dark:to-primary-500/5 rounded-xl p-5 border border-primary-100 dark:border-primary-900/30"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                        <Users className="text-white" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">管理员已登录</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">拥有完整系统管理权限</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-primary-100 dark:border-primary-900/30">
                      <div className="text-center">
                        <p className="text-xl font-semibold text-primary-600 dark:text-primary-400">{users.length}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">成员总数</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-semibold text-amber-600 dark:text-amber-400">{bets.length}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">投注记录</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-semibold text-profit">¥{bets.reduce((sum, b) => sum + (b.winAmount ?? 0), 0).toFixed(0)}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">中奖总额</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-3"
                  >
                    <SectionHeader icon={RefreshCw} title="环境管理" subtitle="切换数据环境" />
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleSwitchEnv('production')}
                        disabled={isSwitchingEnv}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                          environment === 'production'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-neutral-100 dark:border-neutral-700 hover:border-primary-500/50'
                        } ${isSwitchingEnv ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-2xl mb-2 text-center">🌍</div>
                        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-center">正式环境</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-500 text-center mt-1">真实数据</div>
                        {environment === 'production' && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSwitchEnv('test')}
                        disabled={isSwitchingEnv}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                          environment === 'test'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-neutral-100 dark:border-neutral-700 hover:border-primary-500/50'
                        } ${isSwitchingEnv ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-2xl mb-2 text-center">🧪</div>
                        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-center">测试环境</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-500 text-center mt-1">测试数据</div>
                        {environment === 'test' && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-500" />
                        )}
                      </button>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <SectionHeader icon={Users} title="成员管理" subtitle={`共 ${users.length} 位成员`} />
                      <button
                        onClick={() => setShowAddUserForm(true)}
                        className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        <Plus size={14} />
                        添加
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                      {users.map((user, index) => {
                        const stats = getUserStats(user.id);
                        return (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-700/50"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar src={user.avatar} alt={user.nickname} size="sm" />
                              <div>
                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                  {user.nickname}
                                  {user.isAdmin && (
                                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-600 dark:text-primary-400">
                                      管理员
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                                  {stats.totalBets}条记录 · ¥{stats.totalWinAmount.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            {!user.isAdmin && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingUser(user)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                                  title="编辑"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`确定要移除 ${user.nickname} 吗？`)) {
                                      removeUser(user.id);
                                    }
                                  }}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                  title="删除"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-3"
                  >
                    <SectionHeader icon={Brain} title="AI 配置" subtitle="管理 AI 识别相关设置" />
                    <div className="space-y-2">
                      <SettingsButton
                        icon={Globe}
                        label="AI 识别配置"
                        description="配置 API 地址、密钥和模型"
                        onClick={() => setShowAIConfigModal(true)}
                      />
                      <SettingsButton
                        icon={Newspaper}
                        label="热点新闻"
                        description="AI评价灵感来源，每30分钟自动更新"
                        onClick={handleRefreshNews}
                        disabled={isRefreshingNews}
                        badge={`${newsCount}条`}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                  >
                    <SectionHeader icon={Database} title="数据管理" subtitle="备份、还原和清理数据" />
                    <div className="space-y-2">
                      <SettingsButton
                        icon={RefreshCw}
                        label="备份与还原"
                        description="管理系统数据备份"
                        onClick={() => setShowBackupModal(true)}
                      />
                      <SettingsButton
                        icon={Trash2}
                        label="清除当前环境数据"
                        description="清除所有用户、投注和比赛数据"
                        onClick={handleClearData}
                        disabled={isClearingData}
                        variant="danger"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="space-y-3"
                  >
                    <SectionHeader icon={Lock} title="账户安全" subtitle="管理管理员密码" />
                    {!showPasswordForm ? (
                      <SettingsButton
                        icon={Eye}
                        label="修改管理员密码"
                        description="定期更换密码保障安全"
                        onClick={() => setShowPasswordForm(true)}
                      />
                    ) : (
                      <div className="space-y-3 p-4 rounded-xl border border-neutral-100 dark:border-neutral-700/60 bg-neutral-50 dark:bg-neutral-800/40">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">修改密码</p>
                          <button
                            onClick={() => {
                              setShowPasswordForm(false);
                              setOldPassword('');
                              setNewPassword('');
                              setConfirmPassword('');
                              setPasswordChangeMsg('');
                            }}
                            className="text-xs text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                          >
                            取消
                          </button>
                        </div>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="旧密码"
                          disabled={isChangingPassword}
                          className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500/50 transition-colors text-sm"
                        />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="新密码"
                          disabled={isChangingPassword}
                          className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500/50 transition-colors text-sm"
                        />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="确认新密码"
                          disabled={isChangingPassword}
                          className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500/50 transition-colors text-sm"
                        />
                        {passwordChangeMsg && (
                          <p className={`text-xs flex items-center gap-1 ${passwordChangeMsg.includes('成功') ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                            <AlertTriangle size={12} />
                            {passwordChangeMsg}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <ActionButton onClick={handleChangePassword} disabled={isChangingPassword} className="flex-1">
                            {isChangingPassword ? '修改中...' : '确认修改'}
                          </ActionButton>
                          <ActionButton variant="outline" onClick={() => {
                            setShowPasswordForm(false);
                            setOldPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            setPasswordChangeMsg('');
                          }} disabled={isChangingPassword} className="flex-1">
                            取消
                          </ActionButton>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <ActionButton
                      variant="danger"
                      onClick={handleLogout}
                      className="w-full py-3 flex items-center justify-center gap-2"
                    >
                      <LogOut size={18} />
                      退出管理员
                    </ActionButton>
                  </motion.div>
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {showAddUserForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[101] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setShowAddUserForm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-md shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                          <Plus className="text-primary-500" size={18} />
                        </div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">添加新成员</h3>
                      </div>
                      <button
                        onClick={() => setShowAddUserForm(false)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="p-6 space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          昵称
                        </label>
                        <input
                          type="text"
                          value={newUserNickname}
                          onChange={(e) => setNewUserNickname(e.target.value)}
                          placeholder="输入昵称"
                          className="w-full px-4 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/10 transition-all text-sm"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          头像
                        </label>
                        <AvatarPicker
                          value={newUserAvatar}
                          onChange={setNewUserAvatar}
                          customImage={newUserCustomImage}
                          onCustomImageChange={setNewUserCustomImage}
                        />
                      </div>
                      <ActionButton
                        onClick={() => {
                          handleAddUser({ preventDefault: () => {} } as React.FormEvent);
                        }}
                        disabled={!newUserNickname.trim()}
                        className="w-full py-3"
                      >
                        <Plus size={18} className="inline mr-2" />
                        添加成员
                      </ActionButton>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AIConfigModal isOpen={showAIConfigModal} onClose={() => setShowAIConfigModal(false)} />
            <BackupModal isOpen={showBackupModal} onClose={() => setShowBackupModal(false)} />
            <EditUserModal
              isOpen={editingUser !== null}
              user={editingUser}
              onClose={() => setEditingUser(null)}
              onSave={(userId, nickname, avatar) => updateUser(userId, nickname, avatar)}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;