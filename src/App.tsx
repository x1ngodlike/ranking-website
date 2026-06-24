import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import RankingPage from './pages/RankingPage';
import BetsPage from './pages/BetsPage';
import ProfilePage from './pages/ProfilePage';
import MatchesPage from './pages/MatchesPage';
import UsersPage from './pages/UsersPage';
import { useAppStore } from './store/useAppStore';
import { applyTheme, initThemeListener } from './utils/theme';

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
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<RankingPage />} />
          <Route path="/bets" element={<BetsPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
