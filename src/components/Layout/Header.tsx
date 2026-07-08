import { Link, useLocation } from 'react-router-dom';
import { Trophy, Ticket, Calendar, Settings, Calculator, Newspaper } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';

const navItems = [
  { path: '/', label: '排行榜', icon: Trophy },
  { path: '/bets', label: '中奖记录', icon: Ticket },
  { path: '/matches', label: '比赛赛程', icon: Calendar },
  { path: '/news', label: '热点新闻', icon: Newspaper },
  { path: '/calculator', label: '投注计算', icon: Calculator },
];

const Header = () => {
  const location = useLocation();
  const environment = useAppStore((state) => state.environment);
  const isAdminLoggedIn = useAppStore((state) => state.isAdminLoggedIn);
  const openSettings = useAppStore((state) => state.openSettings);
  const designVersion = useAppStore((state) => state.designVersion);

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-md border-b ${
      designVersion === 'v2'
        ? 'bg-[var(--v2-bg-card)]/95 border-[var(--v2-border)]'
        : 'bg-white/95 dark:bg-neutral-900/95 border-neutral-200 dark:border-neutral-700'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
            <div>
              <h1 className={designVersion === 'v2' ? 'font-v2-display text-xl font-bold text-[var(--v2-text)] leading-none' : 'font-display text-2xl text-gradient-gold leading-none'}>
                WORLD CUP
              </h1>
              <p className={`text-xs mt-0.5 ${designVersion === 'v2' ? 'font-v2-body text-[var(--v2-text-secondary)]' : 'text-neutral-600 dark:text-neutral-400'}`}>
                世界杯中奖排行榜
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={designVersion === 'v2'
                    ? `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-v2-body font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-v2-primary-500/15 text-v2-primary-600 dark:bg-v2-primary-500/20 dark:text-v2-primary-400'
                          : 'text-[var(--v2-text-secondary)] hover:text-v2-primary-500 hover:bg-v2-primary-500/8'
                      }`
                    : `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-primary-500/20 text-primary-600 dark:text-white'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-white hover:bg-primary-500/10'
                      }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={openSettings}
              className={`p-2 rounded-full transition-colors ${
                designVersion === 'v2'
                  ? 'hover:bg-[var(--v2-border)] text-[var(--v2-text-secondary)] hover:text-v2-primary-500'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary-500'
              }`}
              title="设置"
            >
              <Settings size={20} />
            </button>
            {environment === 'test' ? (
              <span className={`hidden sm:flex items-center px-2 py-1 text-xs font-medium ${
                designVersion === 'v2'
                  ? 'rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  : 'rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              }`}>
                测试
              </span>
            ) : (
              <span className={`hidden sm:flex items-center px-2 py-1 text-xs font-medium ${
                designVersion === 'v2'
                  ? 'rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              }`}>
                正式
              </span>
            )}
            {isAdminLoggedIn && (
              <span className={`hidden sm:flex items-center px-2 py-1 text-xs font-medium ${
                designVersion === 'v2'
                  ? 'rounded-lg bg-v2-primary-500/20 text-v2-primary-500'
                  : 'rounded-full bg-primary-500/20 text-primary-500'
              }`}>
                管理员
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
