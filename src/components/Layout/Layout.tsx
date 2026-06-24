import { Outlet } from 'react-router-dom';
import Header from './Header';
import MobileNav from './MobileNav';

const Layout = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 bg-grid-pattern bg-[size:40px_40px]">
      <div className="fixed inset-0 bg-gradient-to-b from-neutral-50/50 dark:from-neutral-950/50 via-transparent to-white dark:to-neutral-950 pointer-events-none" />
      <Header />
      <main className="pt-20 pb-24 md:pb-12 relative">
        <div className="container mx-auto px-4">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default Layout;
