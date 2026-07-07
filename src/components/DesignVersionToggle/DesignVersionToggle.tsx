import { useAppStore } from '@/store/useAppStore';
import { ArrowLeftRight } from 'lucide-react';

const DesignVersionToggle = () => {
  const designVersion = useAppStore((state) => state.designVersion);
  const setDesignVersion = useAppStore((state) => state.setDesignVersion);

  const toggle = () => {
    setDesignVersion(designVersion === 'v2' ? 'v1' : 'v2');
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className={`p-2 rounded-lg transition-all duration-300 text-neutral-500 dark:text-neutral-400 hover:text-v2-primary-500 dark:hover:text-v2-primary-400 ${
          designVersion === 'v2'
            ? 'hover:bg-v2-primary-500/8'
            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
        title={designVersion === 'v2' ? '当前：新版设计（点击切换旧版）' : '当前：旧版设计（点击切换新版）'}
      >
        <ArrowLeftRight size={18} />
      </button>
    </div>
  );
};

export default DesignVersionToggle;
