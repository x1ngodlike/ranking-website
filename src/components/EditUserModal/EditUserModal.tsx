import { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User as UserType } from '@/types';
import { api } from '@/utils/api';
import { AvatarPicker, avatarOptions } from '../AvatarPicker/AvatarPicker';

interface EditUserModalProps {
  isOpen: boolean;
  user: UserType | null;
  onClose: () => void;
  onSave: (userId: string, nickname: string, avatar: string) => void;
}

const EditUserModal = ({ isOpen, user, onClose, onSave }: EditUserModalProps) => {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(avatarOptions[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPickerDropdown, setShowPickerDropdown] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setNickname(user.nickname);
      if (avatarOptions.includes(user.avatar)) {
        setAvatar(user.avatar);
        setCustomImage(null);
      } else {
        setAvatar('');
        setCustomImage(user.avatar);
      }
      setShowPickerDropdown(false);
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    if (!user || !nickname.trim()) return;
    const finalAvatarSource = customImage || avatar;
    if (!finalAvatarSource) return;

    setIsUploading(true);
    try {
      let finalAvatar = finalAvatarSource;

      if (customImage && customImage.startsWith('data:')) {
        const response = await fetch(customImage);
        const blob = await response.blob();
        const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
        const filename = `avatar-${user.id}-${Date.now()}.${ext}`;
        finalAvatar = await api.uploadAvatar(blob, filename);
      }

      onSave(user.id, nickname.trim(), finalAvatar);
      onClose();
    } catch (e) {
      console.error('Upload avatar failed:', e);
      alert('头像上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-primary-500/50 transition-all text-sm';

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
            className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-sm max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <User className="text-primary-500" size={20} />
                </div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">编辑成员</h2>
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
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="输入昵称"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <AvatarPicker
                value={avatar}
                onChange={setAvatar}
                customImage={customImage}
                onCustomImageChange={setCustomImage}
                showPicker={false}
                onTogglePicker={() => setShowPickerDropdown(!showPickerDropdown)}
              />

              <button
                onClick={handleSave}
                disabled={!nickname.trim() || (!avatar && !customImage) || isUploading}
                className="w-full py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? '上传中...' : '保存修改'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditUserModal;