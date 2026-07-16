import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ThemeMode } from '@/utils/theme';

const ThemeToggle = () => {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const designVersion = useAppStore((s) => s.designVersion);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
    { key: 'light', label: '浅色模式', icon: Sun },
    { key: 'dark', label: '深色模式', icon: Moon },
    { key: 'system', label: '跟随系统', icon: Monitor },
  ];

  const currentOption = options.find((o) => o.key === theme) || options[2];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`主题设置：${currentOption.label}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`flex items-center gap-2 px-3 py-2 ${designVersion === 'v2' ? 'rounded-lg' : 'rounded-full'} transition-all duration-300 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400 ${designVersion === 'v2' ? 'hover:bg-[var(--v2-bg-muted)]' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
      >
        <CurrentIcon size={18} />
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full right-0 mt-2 py-2 ${designVersion === 'v2' ? 'rounded-lg bg-[var(--v2-bg-card)] border border-[var(--v2-border)]' : 'rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'} shadow-xl min-w-[140px] z-50`}
            role="menu"
          >
            {options.map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.key;
              return (
                <button
                  key={option.key}
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => {
                    setTheme(option.key);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? designVersion === 'v2'
                        ? 'text-v2-primary-500 bg-v2-primary-500/10'
                        : 'text-primary-500 bg-primary-50 dark:bg-primary-500/10'
                      : designVersion === 'v2'
                        ? 'text-[var(--v2-text)] hover:bg-[var(--v2-bg-muted)]'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Icon size={16} />
                  {option.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggle;
