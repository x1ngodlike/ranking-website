import { useLocation, Link } from 'react-router-dom';
import { Trophy, Ticket, Calendar, Calculator, Newspaper } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  { path: '/', label: '排行榜', icon: Trophy },
  { path: '/bets', label: '中奖', icon: Ticket },
  { path: '/matches', label: '赛程', icon: Calendar },
  { path: '/news', label: '新闻', icon: Newspaper },
  { path: '/calculator', label: '计算', icon: Calculator },
];

const MobileNav = () => {
  const location = useLocation();
  const designVersion = useAppStore((state) => state.designVersion);

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 md:hidden backdrop-blur-md border-t ${
      designVersion === 'v2'
        ? 'bg-[var(--v2-bg-card)]/95 border-[var(--v2-border)]'
        : 'bg-white/95 dark:bg-neutral-900/95 border-neutral-200 dark:border-neutral-700'
    }`}>
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={designVersion === 'v2'
                ? `flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all ${isActive ? 'text-v2-primary-500' : 'text-[var(--v2-text-secondary)]'}`
                : `flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all ${isActive ? 'text-primary-500' : 'text-neutral-500 dark:text-neutral-500'}`
              }
            >
              <Icon size={20} />
              <span className={`text-[10px] font-medium ${designVersion === 'v2' ? 'font-v2-body' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
