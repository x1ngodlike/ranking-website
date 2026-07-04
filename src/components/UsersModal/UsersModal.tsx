import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X, Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../Avatar';
import { AvatarPicker } from '../AvatarPicker/AvatarPicker';
import EditUserModal from '../EditUserModal/EditUserModal';
import type { User } from '@/types';

interface UsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UsersModal = ({ isOpen, onClose }: UsersModalProps) => {
  const users = useAppStore((state) => state.users);
  const bets = useAppStore((state) => state.bets);
  const addUserWithUpload = useAppStore((state) => state.addUserWithUpload);
  const updateUser = useAppStore((state) => state.updateUser);
  const removeUser = useAppStore((state) => state.removeUser);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [newAvatar, setNewAvatar] = useState('⚽️');
  const [newCustomImage, setNewCustomImage] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const getUserStats = (userId: string) => {
    const userBets = bets.filter((b) => b.userId === userId);
    const totalWinAmount = userBets.reduce((sum, b) => sum + (b.winAmount ?? 0), 0);
    return { totalBets: userBets.length, totalWinAmount };
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNickname.trim()) return;

    let imageBlob: Blob | null = null;
    if (newCustomImage && newCustomImage.startsWith('data:')) {
      const response = await fetch(newCustomImage);
      imageBlob = await response.blob();
    }

    await addUserWithUpload(newNickname.trim(), newAvatar, imageBlob);
    setNewNickname('');
    setNewAvatar('⚽️');
    setNewCustomImage(null);
    setShowAddForm(false);
  };

  return (
    <>
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
                    <Users className="text-primary-500" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">成员管理</h2>
                    <p className="text-xs text-neutral-500">共 {users.length} 位成员</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-neutral-500">成员列表</span>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    <Plus size={16} />
                    添加成员
                  </button>
                </div>

                <div className="space-y-2">
                  {users.map((user) => {
                    const stats = getUserStats(user.id);
                    return (
                      <div
                        key={user.id}
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
                            <p className="text-xs text-neutral-500">
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
                      </div>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[111] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowAddForm(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 10 }}
                      transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                      className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-sm shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">添加成员</h3>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="p-5 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">昵称</label>
                          <input
                            type="text"
                            value={newNickname}
                            onChange={(e) => setNewNickname(e.target.value)}
                            placeholder="输入昵称"
                            className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500/50 transition-all text-sm"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">头像</label>
                          <AvatarPicker
                            value={newAvatar}
                            onChange={setNewAvatar}
                            customImage={newCustomImage}
                            onCustomImageChange={setNewCustomImage}
                          />
                        </div>
                        <button
                          onClick={() => handleAddUser({ preventDefault: () => {} } as React.FormEvent)}
                          disabled={!newNickname.trim()}
                          className="w-full py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          添加成员
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EditUserModal
        isOpen={editingUser !== null}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={(userId, nickname, avatar) => updateUser(userId, nickname, avatar)}
      />
    </>
  );
};

export default UsersModal;
