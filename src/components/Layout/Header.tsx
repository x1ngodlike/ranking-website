import { Link, useLocation } from 'react-router-dom';
import { Trophy, Ticket, Calendar, Users, Settings } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';

const navItems = [
  { path: '/', label: '排行榜', icon: Trophy },
  { path: '/bets', label: '投注记录', icon: Ticket },
  { path: '/matches', label: '比赛赛程', icon: Calendar },
  { path: '/users', label: '成员管理', icon: Users },
];

const Header = () => {
  const location = useLocation();
  const environment = useAppStore((state) => state.environment);
  const isAdminLoggedIn = useAppStore((state) => state.isAdminLoggedIn);
  const openSettings = useAppStore((state) => state.openSettings);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl animate-float">
              🏆
            </div>
            <div>
              <h1 className="font-display text-2xl text-gradient-gold leading-none">
                WORLD CUP
              </h1>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">世界杯中奖排行榜</p>
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-primary-500/20 text-primary-500'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:bg-primary-500/10'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {environment === 'test' && (
              <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium">
                🧪 测试环境
              </span>
            )}
            {isAdminLoggedIn && (
              <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-primary-500/20 text-primary-500 text-xs font-medium">
                👑 管理员
              </span>
            )}
            <ThemeToggle />
            <button
              onClick={openSettings}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 transition-colors"
              title="设置"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
