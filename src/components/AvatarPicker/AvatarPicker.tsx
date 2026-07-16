import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { avatarOptions } from '@/utils/avatar';

interface AvatarPickerProps {
  value: string;
  onChange: (avatar: string) => void;
  customImage?: string | null;
  onCustomImageChange?: (image: string | null) => void;
  label?: string;
}

export const AvatarPicker = ({
  value,
  onChange,
  customImage,
  onCustomImageChange,
  label = '头像',
}: AvatarPickerProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [showPickerDropdown, setShowPickerDropdown] = useState(false);

  const isEmoji = avatarOptions.includes(value);
  const displayImage = customImage || (!isEmoji ? value : null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onCustomImageChange?.(result);
      onChange(result);
    };
    reader.readAsDataURL(file);
  }, [onCustomImageChange, onChange]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleFileSelect(file);
        break;
      }
    }
  }, [handleFileSelect]);

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer?.files[0];
      if (file) handleFileSelect(file);
    };
    const handlePasteEvent = (e: ClipboardEvent) => {
      if (showPickerDropdown) handlePaste(e);
    };

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    document.addEventListener('paste', handlePasteEvent);

    return () => {
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('drop', handleDrop);
      document.removeEventListener('paste', handlePasteEvent);
    };
  }, [handleFileSelect, handlePaste, showPickerDropdown]);

  const handleClearCustomImage = () => {
    onCustomImageChange?.(null);
    onChange(avatarOptions[0]);
  };

  const handleUseEmoji = (emoji: string) => {
    onCustomImageChange?.(null);
    onChange(emoji);
    setShowPickerDropdown(false);
  };

  return (
    <div>
      <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-2">
        {label}
      </label>

      {displayImage ? (
        <div className="relative mb-4">
          <div className="relative w-24 h-24 mx-auto">
            <img
              src={displayImage}
              alt="头像预览"
              className="w-24 h-24 rounded-full object-cover border-2 border-primary-500/30"
            />
            <button
              onClick={handleClearCustomImage}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
              title="清除自定义头像"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={dropZoneRef}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-primary-500 bg-primary-500/5'
              : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-500/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <Upload
            className={`mx-auto mb-2 ${isDragging ? 'text-primary-500' : 'text-neutral-400'}`}
            size={32}
          />
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
            点击上传或拖拽图片
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            支持粘贴图片 (Ctrl/Cmd + V)
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <ImageIcon size={16} className="text-neutral-400" />
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          选择表情头像
        </span>
        <button
          onClick={() => setShowPickerDropdown(!showPickerDropdown)}
          className="ml-auto text-xs text-primary-500 hover:text-primary-600"
        >
          {showPickerDropdown ? '收起' : '展开'}
        </button>
      </div>

      {showPickerDropdown && (
        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
          {avatarOptions.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleUseEmoji(emoji)}
              className={`w-11 h-11 rounded-lg text-xl flex items-center justify-center transition-all hover:scale-110 ${
                value === emoji && !displayImage
                  ? 'bg-primary-500/20 border-2 border-primary-500 shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-700 border-2 border-transparent hover:bg-neutral-200 dark:hover:bg-neutral-600'
              }`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvatarPicker;
