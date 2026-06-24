import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import RankingPage from './pages/RankingPage';
import { useAppStore } from './store/useAppStore';
import { applyTheme, initThemeListener } from './utils/theme';

const BetsPage = lazy(() => import('./pages/BetsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MatchesPage = lazy(() => import('./pages/MatchesPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
  </div>
);

export default function App() {
  const theme = useAppStore((state) => state.theme);
  const init = useAppStore((state) => state.init);

  useEffect(() => {
    init();
    applyTheme(theme);

    if (theme === 'system') {
      const cleanup = initThemeListener(() => {
        applyTheme('system');
      });
      return cleanup;
    }
  }, [theme, init]);

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<RankingPage />} />
            <Route path="/bets" element={<BetsPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}
