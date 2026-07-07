import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DesignVersion } from '@/utils/theme';

const DesignVersionToggle = () => {
  const designVersion = useAppStore((state) => state.designVersion);
  const setDesignVersion = useAppStore((state) => state.setDesignVersion);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (v: DesignVersion) => {
    setDesignVersion(v);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 rounded-lg transition-all duration-300 text-neutral-500 dark:text-neutral-400 hover:text-v2-primary-500 dark:hover:text-v2-primary-400 ${
          designVersion === 'v2'
            ? 'hover:bg-v2-primary-500/8'
            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title={designVersion === 'v2' ? '当前：新版设计' : '当前：旧版设计'}
      >
        <Layers size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full right-0 mt-2 py-1 rounded-lg shadow-xl min-w-[100px] z-50 border ${
              designVersion === 'v2'
                ? 'bg-[var(--v2-bg-card)] border-[var(--v2-border)]'
                : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
            }`}
          >
            <button
              onClick={() => select('v2')}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                designVersion === 'v2'
                  ? 'text-v2-primary-600 dark:text-v2-primary-400 bg-v2-primary-500/10'
                  : 'text-[var(--v2-text-secondary)] hover:bg-v2-primary-500/5'
              }`}
            >
              新版
            </button>
            <button
              onClick={() => select('v1')}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                designVersion === 'v1'
                  ? 'text-v2-primary-600 dark:text-v2-primary-400 bg-v2-primary-500/10'
                  : 'text-[var(--v2-text-secondary)] hover:bg-v2-primary-500/5'
              }`}
            >
              旧版
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesignVersionToggle;
