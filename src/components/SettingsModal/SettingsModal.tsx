import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X, Settings, Lock, LogOut, RefreshCw, Check, Eye, EyeOff, Trash2, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackupModal from '../BackupModal/BackupModal';

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="card w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <Settings className="text-primary-500" size={24} />
                <h2 className="font-display text-xl text-neutral-800 dark:text-neutral-200">
                  设置
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!isAdminLoggedIn ? (
                <div>
                  <h3 className="font-medium text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
                    <Lock size={18} />
                    管理员登录
                  </h3>
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
                        placeholder="请输入管理员密码"
                        disabled={isLoggingIn}
                        className="w-full px-4 py-2.5 pr-10 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <button
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className="px-4 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoggingIn ? '登录中...' : '登录'}
                    </button>
                  </div>
                  {loginError && (
                    <p className="text-sm text-red-500 mt-2">{loginError}</p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="font-medium text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
                      <RefreshCw size={18} />
                      环境切换
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleSwitchEnv('production')}
                        disabled={isSwitchingEnv}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          environment === 'production'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-500/50'
                        } ${isSwitchingEnv ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-lg mb-1">🌍</div>
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">正式环境</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          真实数据
                        </div>
                        {environment === 'production' && (
                          <div className="mt-2 flex items-center justify-center gap-1 text-primary-500 text-sm">
                            <Check size={14} />
                            当前
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => handleSwitchEnv('test')}
                        disabled={isSwitchingEnv}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          environment === 'test'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-500/50'
                        } ${isSwitchingEnv ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-lg mb-1">🧪</div>
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">测试环境</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          测试数据
                        </div>
                        {environment === 'test' && (
                          <div className="mt-2 flex items-center justify-center gap-1 text-primary-500 text-sm">
                            <Check size={14} />
                            当前
                          </div>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">
                      两个环境数据完全独立，互不影响
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          备份与还原
                        </span>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                          自动备份每小时执行一次，最多保留30份
                        </p>
                      </div>
                      <button
                        onClick={() => setShowBackupModal(true)}
                        className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                      >
                        <Database size={16} />
                        管理
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        清除当前环境数据
                      </span>
                      <button
                        onClick={handleClearData}
                        disabled={isClearingData}
                        className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        {isClearingData ? '清除中...' : '清除数据'}
                      </button>
                    </div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
                      警告：此操作将清除当前环境的所有用户、投注和比赛数据
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    {!showPasswordForm ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          修改管理员密码
                        </span>
                        <button
                          onClick={() => setShowPasswordForm(true)}
                          className="text-sm text-primary-500 hover:text-primary-600"
                        >
                          修改
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="font-medium text-neutral-800 dark:text-neutral-200">修改密码</h4>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="旧密码"
                          disabled={isChangingPassword}
                          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors disabled:opacity-50"
                        />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="新密码"
                          disabled={isChangingPassword}
                          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors disabled:opacity-50"
                        />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="确认新密码"
                          disabled={isChangingPassword}
                          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors disabled:opacity-50"
                        />
                        {passwordChangeMsg && (
                          <p className={`text-sm ${passwordChangeMsg.includes('成功') ? 'text-profit-500' : 'text-red-500'}`}>
                            {passwordChangeMsg}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={handleChangePassword}
                            disabled={isChangingPassword}
                            className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isChangingPassword ? '修改中...' : '确认修改'}
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordForm(false);
                              setOldPassword('');
                              setNewPassword('');
                              setConfirmPassword('');
                              setPasswordChangeMsg('');
                            }}
                            disabled={isChangingPassword}
                            className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={18} />
                      退出管理员
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      <BackupModal isOpen={showBackupModal} onClose={() => setShowBackupModal(false)} />
    </AnimatePresence>
  );
};

export default SettingsModal;
