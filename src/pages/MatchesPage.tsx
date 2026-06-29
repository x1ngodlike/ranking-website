import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import MatchCard from '@/components/MatchCard/MatchCard';
import ApiSettingsModal from '@/components/ApiSettingsModal/ApiSettingsModal';
import {
  Calendar,
  Clock,
  Trophy,
  RefreshCw,
  Settings,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'upcoming' | 'finished' | 'all';

const BEIJING_OFFSET_MINUTES = 8 * 60;
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const DATE_SCROLL_AMOUNT = 200;

const getBeijingTime = (date: Date): Date => {
  const utcDate = new Date(date.toISOString());
  return new Date(utcDate.getTime() + BEIJING_OFFSET_MINUTES * 60 * 1000);
};

const formatDateKey = (date: Date): string => {
  const beijingTime = getBeijingTime(date);
  const year = beijingTime.getUTCFullYear();
  const month = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijingTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekdayName = (date: Date): string => {
  const beijingTime = getBeijingTime(date);
  return WEEKDAYS[beijingTime.getUTCDay()];
};

const MatchesPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(formatDateKey(new Date()));
  const dateScrollRef = useRef<HTMLDivElement>(null);
  const todayItemRef = useRef<HTMLButtonElement>(null);

  const matches = useAppStore((state) => state.matches);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const apiConfig = useAppStore((state) => state.apiConfig);
  const isRefreshing = useAppStore((state) => state.isRefreshing);
  const lastRefreshTime = useAppStore((state) => state.lastRefreshTime);
  const refreshError = useAppStore((state) => state.refreshError);
  const refreshLiveMatches = useAppStore((state) => state.refreshLiveMatches);
  const syncMatchesFromApi = useAppStore((state) => state.syncMatchesFromApi);
  const setRefreshError = useAppStore((state) => state.setRefreshError);
  const isAdminLoggedIn = useAppStore((state) => state.isAdminLoggedIn);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || null,
    [users, currentUserId]
  );

  const isAdmin = currentUser?.isAdmin || false;
  const canManageApi = isAdmin || isAdminLoggedIn;

  const matchDates = useMemo(() => {
    const dateSet = new Set<string>();
    matches.forEach((match) => {
      const date = new Date(match.matchTime);
      dateSet.add(formatDateKey(date));
    });
    return Array.from(dateSet).sort();
  }, [matches]);

  const dateRange = useMemo(() => {
    if (matchDates.length === 0) {
      const today = new Date();
      const dates: string[] = [];
      for (let i = -3; i <= 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(formatDateKey(d));
      }
      return dates;
    }

    const firstDate = new Date(matchDates[0]);
    const lastDate = new Date(matchDates[matchDates.length - 1]);
    const dates: string[] = [];
    const current = new Date(firstDate);
    while (current <= lastDate) {
      dates.push(formatDateKey(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [matchDates]);

  const today = formatDateKey(new Date());

  useEffect(() => {
    if (todayItemRef.current && dateScrollRef.current) {
      const container = dateScrollRef.current;
      const item = todayItemRef.current;
      const containerWidth = container.clientWidth;
      const itemLeft = item.offsetLeft;
      const itemWidth = item.offsetWidth;
      container.scrollLeft = itemLeft - containerWidth / 2 + itemWidth / 2;
    }
  }, [matchDates.length]);

  const scrollDates = useCallback((direction: 'left' | 'right') => {
    if (dateScrollRef.current) {
      dateScrollRef.current.scrollBy({
        left: direction === 'left' ? -DATE_SCROLL_AMOUNT : DATE_SCROLL_AMOUNT,
        behavior: 'smooth',
      });
    }
  }, []);

  const filteredMatches = useMemo(() => {
    return matches
      .filter((m) => {
        const matchDate = formatDateKey(new Date(m.matchTime));
        if (matchDate !== selectedDate) return false;
        if (activeTab === 'upcoming') return m.status === 'upcoming';
        if (activeTab === 'finished') return m.status === 'finished';
        return true;
      })
      .sort(
        (a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()
      );
  }, [matches, selectedDate, activeTab]);

  const handleFullSync = useCallback(async () => {
    if (isRefreshing) return;
    if (!apiConfig.apiKey) {
      setShowApiSettings(true);
      return;
    }
    try {
      setRefreshError(null);
      await syncMatchesFromApi();
    } catch {
    }
  }, [isRefreshing, apiConfig.apiKey, syncMatchesFromApi, setRefreshError]);

  const hasLiveMatches = matches.some((m) => m.status === 'live');

  useEffect(() => {
    if (!apiConfig.apiKey) return;

    const intervalMs = hasLiveMatches ? 60 * 1000 : 4 * 60 * 60 * 1000;
    const interval = setInterval(() => {
      refreshLiveMatches().catch(() => {});
    }, intervalMs);

    return () => clearInterval(interval);
  }, [apiConfig.apiKey, hasLiveMatches, refreshLiveMatches]);

  const tabs = [
    { key: 'all', label: '全部', icon: CalendarDays },
    { key: 'upcoming', label: '未开始', icon: Clock },
    { key: 'finished', label: '已结束', icon: Trophy },
  ];

  const liveCount = matches.filter((m) => m.status === 'live').length;
  const selectedDateMatches = matches.filter((m) =>
    formatDateKey(new Date(m.matchTime)) === selectedDate
  );
  const selectedDateLiveCount = selectedDateMatches.filter(
    (m) => m.status === 'live'
  ).length;
  const selectedDateFinishedCount = selectedDateMatches.filter(
    (m) => m.status === 'finished'
  ).length;

  const getDateMatchCount = (dateKey: string): number => {
    return matches.filter((m) => formatDateKey(new Date(m.matchTime)) === dateKey)
      .length;
  };

  const getDateHasLive = (dateKey: string): boolean => {
    return matches.some(
      (m) => formatDateKey(new Date(m.matchTime)) === dateKey && m.status === 'live'
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <h1 className="font-display text-4xl text-gradient-gold mb-2">
          比赛赛程
        </h1>
        <p className="text-neutral-500 dark:text-neutral-500">
          共 {matches.length} 场比赛 ·{' '}
          {matches.filter((m) => m.status === 'finished').length} 场已完赛
          {liveCount > 0 && (
            <span className="text-profit-500">
              {' '}
              · {liveCount} 场进行中
            </span>
          )}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-neutral-50 dark:from-neutral-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-neutral-50 dark:from-neutral-950 to-transparent z-10 pointer-events-none" />

          <button
            onClick={() => scrollDates('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-neutral-800 border border-primary/20 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:border-primary/40 transition-all"
          >
            <ChevronLeft size={18} />
          </button>

          <div
            ref={dateScrollRef}
            className="flex gap-2 overflow-x-auto py-2 px-10 scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {dateRange.map((dateKey) => {
              const date = new Date(dateKey);
              const isToday = dateKey === today;
              const isSelected = dateKey === selectedDate;
              const matchCount = getDateMatchCount(dateKey);
              const hasLive = getDateHasLive(dateKey);

              return (
                <button
                  key={dateKey}
                  ref={isToday ? todayItemRef : null}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl min-w-[72px] transition-all duration-300 relative ${
                    isSelected
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                      : isToday
                      ? 'bg-primary-500/20 text-primary-300 border border-primary/40'
                      : 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 border border-transparent'
                  }`}
                >
                  <span className={`text-xs font-medium ${isSelected ? 'text-neutral-800 dark:text-neutral-200' : ''}`}>
                    {getWeekdayName(date)}
                  </span>
                  <span className="text-2xl font-bold my-0.5">
                    {date.getDate()}
                  </span>
                  <span className={`text-xs ${isSelected ? 'text-neutral-800 dark:text-neutral-200' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    {date.getMonth() + 1}月
                  </span>
                  {matchCount > 0 && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(matchCount, 3) }).map((_, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-white/60'
                                : hasLive && i === 0
                                ? 'bg-profit-500'
                                : 'bg-primary-400/60'
                            }`}
                          />
                        ))}
                      </div>
                      {matchCount > 3 && (
                        <span className={`text-xs ${isSelected ? 'text-neutral-800 dark:text-neutral-200' : 'text-neutral-500 dark:text-neutral-400'}`}>
                          +{matchCount - 3}
                        </span>
                      )}
                    </div>
                  )}
                  {hasLive && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-profit-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-profit-500" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollDates('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white dark:bg-neutral-800 border border-primary/20 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:border-primary/40 transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {new Date(selectedDate).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
            {selectedDateMatches.length > 0 && (
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                · {selectedDateMatches.length} 场比赛
              </span>
            )}
            {selectedDateLiveCount > 0 && (
              <span className="flex items-center gap-1 text-profit-500 text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-profit-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-profit-500" />
                </span>
                {selectedDateLiveCount} 场进行中
              </span>
            )}
          </div>

          <button
            onClick={() => setSelectedDate(today)}
            className="text-sm text-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1"
          >
            回到今日
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-wrap items-center justify-center gap-3 mb-6"
      >
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-primary/20" />

        <div className="flex items-center gap-2">
          {canManageApi && (
            <button
              onClick={handleFullSync}
              disabled={isRefreshing}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              全量同步
            </button>
          )}
          {canManageApi && (
            <button
              onClick={() => setShowApiSettings(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 hover:text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">API设置</span>
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {apiConfig.apiKey && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="flex items-center justify-center gap-2 mb-6 text-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-profit-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-profit-500" />
            </span>
            <span className="text-profit-500">
              自动刷新中（{hasLiveMatches ? '比赛中，每1分钟' : '无比赛，每4小时'}）
            </span>
            {lastRefreshTime && (
              <span className="text-neutral-500 dark:text-neutral-400">
                · 上次: {new Date(lastRefreshTime).toLocaleTimeString('zh-CN')}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {refreshError && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mb-6"
          >
            <div className="p-3 rounded-xl bg-loss-500/20 border border-loss-500/30 text-loss-400 text-sm text-center flex items-center justify-center gap-2">
              <AlertCircle size={18} />
              {refreshError}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!apiConfig.apiKey && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card mb-8 border-primary/20 bg-primary-500/5"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <Settings size={24} className="text-primary-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg text-primary-500 mb-1">
                配置 API 实现实时比分
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                接入 football-data.org 免费 API，自动同步比赛赛程和实时比分。免费版每天 100 次请求，完全够用。
              </p>
            </div>
            <button
              onClick={() => setShowApiSettings(true)}
              className="btn-primary flex items-center gap-2 flex-shrink-0"
            >
              去配置
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {filteredMatches.length > 0 ? (
          <motion.div
            key="matches"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {filteredMatches.map((match) => (
              <MatchCard key={match.id} match={match} isAdmin={isAdmin} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="card text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                <Calendar size={32} className="text-neutral-600 dark:text-neutral-400" />
              </div>
              <p className="text-neutral-500 dark:text-neutral-500 mb-2">当日暂无比赛</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
              左右滑动日期栏查看其他比赛日
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <ApiSettingsModal
        isOpen={showApiSettings}
        onClose={() => setShowApiSettings(false)}
      />
    </div>
  );
};

export default MatchesPage;
