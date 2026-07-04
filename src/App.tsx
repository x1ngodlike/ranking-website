import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/Layout/Layout';
import RankingPage from './pages/RankingPage';
import { useAppStore } from './store/useAppStore';
import { applyTheme, initThemeListener } from './utils/theme';

const BetsPage = lazy(() => import('./pages/BetsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MatchesPage = lazy(() => import('./pages/MatchesPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'));

const PageLoader = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex items-center justify-center py-20"
  >
    <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/" element={<RankingPage />} />
          <Route
            path="/bets"
            element={
              <Suspense fallback={<PageLoader />}>
                <BetsPage />
              </Suspense>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProfilePage />
              </Suspense>
            }
          />
          <Route
            path="/matches"
            element={
              <Suspense fallback={<PageLoader />}>
                <MatchesPage />
              </Suspense>
            }
          />
          <Route
            path="/news"
            element={
              <Suspense fallback={<PageLoader />}>
                <NewsPage />
              </Suspense>
            }
          />
          <Route
            path="/calculator"
            element={
              <Suspense fallback={<PageLoader />}>
                <CalculatorPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const theme = useAppStore((state) => state.theme);
  const init = useAppStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    applyTheme(theme);

    if (theme === 'system') {
      const cleanup = initThemeListener(() => {
        applyTheme('system');
      });
      return cleanup;
    }
  }, [theme]);

  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
