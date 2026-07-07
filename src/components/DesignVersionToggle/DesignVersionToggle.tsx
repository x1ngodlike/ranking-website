import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ChevronDown } from 'lucide-react';
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
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
          designVersion === 'v2'
            ? 'bg-v2-primary-500/15 text-v2-primary-600 dark:text-v2-primary-400 border border-v2-primary-500/20'
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700'
        }`}
      >
        <span>{designVersion === 'v2' ? '新' : '旧'}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={`absolute right-0 top-full mt-1 rounded-lg border shadow-lg overflow-hidden z-50 min-w-[80px] ${
          designVersion === 'v2'
            ? 'border-[var(--v2-border)] bg-[var(--v2-bg-card)]'
            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
        }`}>
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
        </div>
      )}
    </div>
  );
};

export default DesignVersionToggle;
