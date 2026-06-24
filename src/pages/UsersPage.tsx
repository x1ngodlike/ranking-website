import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Link } from 'react-router-dom';
import { Plus, Trash2, UserPlus, Download, Upload, RotateCcw, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '@/types';
import EditUserModal from '@/components/EditUserModal/EditUserModal';
import Avatar from '@/components/Avatar';
import { AvatarPicker } from '@/components/AvatarPicker/AvatarPicker';

const UsersPage = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('⚽️');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const users = useAppStore((state) => state.users);
  const bets = useAppStore((state) => state.bets);
  const addUserWithUpload = useAppStore((state) => state.addUserWithUpload);
  const updateUser = useAppStore((state) => state.updateUser);
  const removeUser = useAppStore((state) => state.removeUser);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const isAdminLoggedIn = useAppStore((state) => state.isAdminLoggedIn);
  const exportData = useAppStore((state) => state.exportData);
  const importData = useAppStore((state) => state.importData);
  const resetData = useAppStore((state) => state.resetData);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || null,
    [users, currentUserId]
  );

  const isAdmin = currentUser?.isAdmin || false;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    let imageBlob: Blob | null = null;
    if (customImage && customImage.startsWith('data:')) {
      const response = await fetch(customImage);
      imageBlob = await response.blob();
    }

    await addUserWithUpload(nickname.trim(), avatar, imageBlob);
    setNickname('');
    setAvatar('⚽️');
    setCustomImage(null);
    setShowAddForm(false);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `world-cup-betting-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const success = importData(e.target.result);
          if (success) {
            alert('数据导入成功！');
          } else {
            alert('数据格式错误，导入失败');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
      resetData();
    }
  };

  const getUserStats = (userId: string) => {
    const userBets = bets.filter((b) => b.userId === userId);
    const winDays = userBets.filter((b) => (b.winAmount ?? 0) > 0).length;
    const totalWinAmount = userBets.reduce((sum, b) => sum + (b.winAmount ?? 0), 0);
    return { totalBets: userBets.length, winDays, totalWinAmount };
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="font-display text-4xl text-gradient-gold mb-2">
            成员管理
          </h1>
          <p className="text-neutral-500 dark:text-neutral-500">
            共 {users.length} 位成员参与
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn-outline flex items-center gap-2"
          >
            <RotateCcw size={18} />
            数据管理
          </button>
          {(isAdmin || isAdminLoggedIn) && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary flex items-center gap-2"
            >
              <UserPlus size={18} />
              添加成员
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="card">
              <h3 className="font-display text-xl text-gradient-gold mb-4">
                数据管理
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-4">
                备份或恢复所有投注数据，防止数据丢失。
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExport}
                  className="btn-outline flex items-center gap-2"
                >
                  <Download size={18} />
                  导出数据
                </button>
                <button
                  onClick={handleImport}
                  className="btn-outline flex items-center gap-2"
                >
                  <Upload size={18} />
                  导入数据
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-full font-medium transition-all duration-300 border border-loss-500/50 text-loss-400 hover:bg-loss-500/10"
                >
                  <span className="flex items-center gap-2">
                    <RotateCcw size={18} />
                    重置数据
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="card">
                <h3 className="font-display text-xl text-neutral-800 dark:text-neutral-200 mb-4">
                  添加新成员
                </h3>
                <form onSubmit={handleAddUser}>
                  <div className="mb-4">
                    <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                      昵称
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="输入昵称"
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-primary/20 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary/50 transition-colors"
                      autoFocus
                    />
                  </div>
                  <div className="mb-6">
                    <AvatarPicker
                      value={avatar}
                      onChange={setAvatar}
                      customImage={customImage}
                      onCustomImageChange={setCustomImage}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!nickname.trim()}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={20} />
                    添加成员
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {users.map((user, index) => {
          const stats = getUserStats(user.id);

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <div className="card h-full">
                <div className="flex items-start justify-between mb-4">
                  <Link
                    to={`/profile/${user.id}`}
                    className="flex items-center gap-3 group"
                  >
                    <Avatar src={user.avatar} alt={user.nickname} size="lg" className="group-hover:border-primary/40 transition-colors" />
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-primary-500 transition-colors">
                        {user.nickname}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {user.isAdmin ? '管理员' : '成员'}
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1">
                    {(isAdmin || isAdminLoggedIn) && !user.isAdmin && (
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                        title="编辑成员"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    {(isAdmin || isAdminLoggedIn) && !user.isAdmin && (
                      <button
                        onClick={() => {
                          if (confirm(`确定要移除 ${user.nickname} 吗？`)) {
                            removeUser(user.id);
                          }
                        }}
                        className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-loss-400 hover:bg-loss-500/10 transition-colors"
                        title="删除成员"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <div className="text-center">
                    <p className="font-display text-lg text-neutral-800 dark:text-neutral-200">
                      {stats.totalBets}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">记录数</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-lg text-profit-500">
                      {stats.winDays}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">中奖天数</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-lg text-amber-600 dark:text-gold-400">
                      ¥{stats.totalWinAmount.toFixed(0)}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">中奖总额</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <EditUserModal
        isOpen={editingUser !== null}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={(userId, nickname, avatar) => updateUser(userId, nickname, avatar)}
      />
    </div>
  );
};

export default UsersPage;
