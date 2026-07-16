export const avatarOptions = [
  '⚽️', '🏆', '🎯', '🔥', '💎', '👑', '🚀', '⭐️',
  '🎮', '🎸', '🎵', '🐐', '😈', '🤸', '👾', '🦊',
  '🐯', '🦁', '🐻', '🦅',
];

export const isEmojiAvatar = (avatar: string): boolean => avatarOptions.includes(avatar);

export const isImageAvatar = (avatar: string): boolean => (
  avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('/')
);
