import { Outlet } from 'react-router-dom';
import Header from './Header';
import MobileNav from './MobileNav';
import SettingsModal from '@/components/SettingsModal/SettingsModal';
import { useAppStore } from '@/store/useAppStore';
import { AlertTriangle, CloudOff, Loader2 } from 'lucide-react';

const Layout = () => {
  const showSettingsModal = useAppStore((state) => state.showSettingsModal);
  const closeSettings = useAppStore((state) => state.closeSettings);
  const designVersion = useAppStore((state) => state.designVersion);
  const isLoading = useAppStore((state) => state.isLoading);
  const dataError = useAppStore((state) => state.dataError);
  const saveStatus = useAppStore((state) => state.saveStatus);
  const saveError = useAppStore((state) => state.saveError);
  const refreshData = useAppStore((state) => state.refreshData);

  return (
    <div className={designVersion === 'v2' ? 'min-h-screen font-v2-body' : 'min-h-screen bg-white dark:bg-neutral-950 bg-grid-pattern bg-[size:40px_40px]'}>
      {designVersion === 'v1' && (
        <div className="fixed inset-0 bg-gradient-to-b from-neutral-50/50 dark:from-neutral-950/50 via-transparent to-white dark:to-neutral-950 pointer-events-none" />
      )}
      <Header />
      <main className={designVersion === 'v2' ? 'pt-20 pb-24 md:pb-12' : 'pt-20 pb-24 md:pb-12 relative'}>
        <div className="container mx-auto px-4">
          {dataError && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200" role="alert">
              <div className="flex items-start gap-3">
                <CloudOff className="mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="font-medium">暂时无法连接数据服务</p>
                  <p className="mt-1 text-sm opacity-80">当前不会使用演示数据，也不会修改线上记录。{dataError}</p>
                </div>
              </div>
              <button className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30" onClick={() => void refreshData()}>
                重试
              </button>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300" role="alert">
              <AlertTriangle size={20} />
              <p className="text-sm">更改尚未保存：{saveError || '请检查登录状态和网络连接。'}</p>
            </div>
          )}
          <div className="sr-only" role="status" aria-live="polite">
            {saveStatus === 'saving' ? '正在保存更改' : saveStatus === 'saved' ? '更改已保存' : ''}
          </div>
          {isLoading && !dataError ? (
            <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="正在加载数据">
              <Loader2 className="animate-spin text-primary-500" size={32} />
            </div>
          ) : <Outlet />}
        </div>
      </main>
      <MobileNav />
      <SettingsModal isOpen={showSettingsModal} onClose={closeSettings} />
    </div>
  );
};

export default Layout;
