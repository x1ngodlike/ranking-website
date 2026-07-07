import { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { compressImage, fileToDataUrl } from '@/utils/imageCompress';
import { api } from '@/utils/api';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  maxSizeMB?: number;
}

const ImageUploader = ({ value, onChange, maxSizeMB = 5 }: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    setPreviewUrl(value || '');
  }, [value]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`图片大小不能超过 ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const compressedBlob = await compressImage(file, 1280, 0.8);
      const compressedFile = new File([compressedBlob], `bet_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      const preview = await fileToDataUrl(compressedBlob);
      setPreviewUrl(preview);

      const url = await api.uploadBetImage(compressedFile);
      onChange(url);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('图片上传失败，请重试');
      setPreviewUrl('');
    } finally {
      setIsUploading(false);
    }
  }, [maxSizeMB, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          handleFile(file);
          break;
        }
      }
    }
  }, [handleFile]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl('');
    onChange(undefined);
  };

  if (previewUrl) {
    return (
      <div className="relative inline-block">
        <img
          src={previewUrl}
          alt="预览"
          className="w-full max-h-64 object-contain rounded-lg border border-neutral-200 dark:border-neutral-700"
        />
        <button
          onClick={handleClear}
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
        >
          <X size={16} />
        </button>
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <Loader2 className="animate-spin text-white" size={32} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        isDragging
          ? 'border-primary-500 bg-primary-500/10'
          : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <div className="flex flex-col items-center gap-2 text-neutral-500 dark:text-neutral-400">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <Upload size={24} />
        </div>
        <p className="font-medium text-neutral-700 dark:text-neutral-300">
          点击上传或拖拽图片到此处
        </p>
        <p className="text-sm">
          支持粘贴图片（Ctrl/Cmd + V）
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          最大 {maxSizeMB}MB，支持 JPG/PNG/GIF
        </p>
      </div>
      {isUploading && (
        <div className="flex items-center justify-center gap-2 mt-4 text-primary-500">
          <Loader2 className="animate-spin" size={18} />
          <span className="text-sm">上传中...</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
