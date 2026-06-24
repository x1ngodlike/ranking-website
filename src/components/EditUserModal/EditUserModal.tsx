import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '@/types';
import { api } from '@/utils/api';
import { AvatarPicker, avatarOptions } from '../AvatarPicker/AvatarPicker';

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (userId: string, nickname: string, avatar: string) => void;
}

const EditUserModal = ({ isOpen, user, onClose, onSave }: EditUserModalProps) => {
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState(avatarOptions[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPickerDropdown, setShowPickerDropdown] = useState(false);

  const handleOpen = () => {
    if (user) {
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
  };

  if (isOpen && user) {
    handleOpen();
  }

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
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
              <h2 className="font-display text-xl text-neutral-800 dark:text-neutral-200">
                编辑成员
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  昵称
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="输入昵称"
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-primary-500/50 transition-colors"
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
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
