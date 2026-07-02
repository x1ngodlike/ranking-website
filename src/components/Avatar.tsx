import { useEffect, useRef, useState } from 'react';
import { avatarOptions } from './AvatarPicker/AvatarPicker';

interface AvatarProps {
  src: string;
  alt: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'w-5 h-5 text-sm',
  sm: 'w-8 h-8 text-lg',
  md: 'w-10 h-10 text-xl',
  lg: 'w-14 h-14 text-3xl',
  xl: 'w-24 h-24 text-5xl',
};

export const isEmojiAvatar = (avatar: string): boolean => {
  return avatarOptions.includes(avatar);
};

export const isImageAvatar = (avatar: string): boolean => {
  return avatar.startsWith('data:') || avatar.startsWith('http') || avatar.startsWith('/');
};

// 全局懒加载观察器
const lazyImageCache = new WeakMap<HTMLImageElement, boolean>();
let sharedObserver: IntersectionObserver | null = null;

const getObserver = (): IntersectionObserver | null => {
  if (typeof window === 'undefined') return null;
  if (sharedObserver) return sharedObserver;
  if (typeof IntersectionObserver === 'undefined') return null;

  sharedObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const realSrc = img.dataset.src;
          if (realSrc) {
            img.src = realSrc;
            img.removeAttribute('data-src');
          }
          sharedObserver?.unobserve(img);
        }
      });
    },
    { rootMargin: '100px', threshold: 0.01 }
  );
  return sharedObserver;
};

const Avatar = ({ src, alt, className = '', size = 'md' }: AvatarProps) => {
  const sizeClass = sizeClasses[size];
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // 懒加载图片
  useEffect(() => {
    if (!isImageAvatar(src)) return;
    const img = imgRef.current;
    if (!img) return;

    // 已经是完整URL（包括data:）则直接加载，不做懒加载
    if (src.startsWith('data:') || src.startsWith('http')) {
      return;
    }

    const observer = getObserver();
    if (observer) {
      img.dataset.src = src;
      // 设置占位空白src避免一开始就请求
      if (!img.src) {
        img.src =
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>';
      }
      observer.observe(img);
    } else {
      // 不支持IntersectionObserver时直接加载
      img.src = src;
    }

    return () => {
      observer?.unobserve(img);
    };
  }, [src]);

  if (isImageAvatar(src)) {
    const isEager = src.startsWith('data:') || src.startsWith('http');
    return (
      <img
        ref={imgRef}
        src={isEager ? src : undefined}
        data-src={isEager ? undefined : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`${sizeClass} rounded-full object-cover transition-opacity duration-300 ${
          loaded || isEager ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-neutral-100 dark:from-neutral-700 to-white dark:to-neutral-800 flex items-center justify-center border border-primary/20 ${className}`}
    >
      {src}
    </div>
  );
};

export default Avatar;
