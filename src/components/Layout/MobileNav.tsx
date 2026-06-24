import { useLocation, Link } from 'react-router-dom';
import { Trophy, Ticket, Calendar, Users } from 'lucide-react';

const navItems = [
  { path: '/', label: '排行榜', icon: Trophy },
  { path: '/bets', label: '中奖', icon: Ticket },
  { path: '/matches', label: '赛程', icon: Calendar },
  { path: '/users', label: '成员', icon: Users },
];

const MobileNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                isActive ? 'text-primary-500' : 'text-neutral-500 dark:text-neutral-500'
              }`}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
