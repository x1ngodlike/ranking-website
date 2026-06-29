import type { User, Bet, RankingItem, RankingSortType, Environment, UserBadge } from '../types';
import { BADGES } from './badges';

const STORAGE_KEY = 'world_cup_betting_app';
const ADMIN_KEY = 'world_cup_betting_admin';
const ENV_KEY = 'world_cup_betting_env';
const DEFAULT_ADMIN_PASSWORD = '159357';

const safeLocalStorageGet = <T>(key: string, defaultValue: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const safeLocalStorageSet = (key: string, value: unknown, errorMsg: string): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(errorMsg, e);
  }
};

export const getStorageKey = (env: Environment): string =>
  env === 'test' ? `${STORAGE_KEY}_test` : STORAGE_KEY;

export const loadEnvironment = (): Environment => {
  try {
    const env = localStorage.getItem(ENV_KEY);
    return (env as Environment) || 'production';
  } catch {
    return 'production';
  }
};

export const saveEnvironment = (env: Environment): void => {
  try {
    localStorage.setItem(ENV_KEY, env);
  } catch (e) {
    console.error('Failed to save environment:', e);
  }
};

export const loadAdminConfig = (): { password: string; isLoggedIn: boolean } =>
  safeLocalStorageGet(ADMIN_KEY, { password: DEFAULT_ADMIN_PASSWORD, isLoggedIn: false });

export const saveAdminConfig = (config: { password: string; isLoggedIn: boolean }): void =>
  safeLocalStorageSet(ADMIN_KEY, config, 'Failed to save admin config:');

export interface AppData {
  users: User[];
  matches: any[];
  bets: Bet[];
  currentUserId: string | null;
}

const migrateBetData = (parsed: any): void => {
  if (!parsed.bets || parsed.bets.length === 0) return;

  const firstBet = parsed.bets[0];
  if ('amount' in firstBet && !('winAmount' in firstBet)) {
    parsed.bets = parsed.bets.map((bet: any) => ({
      id: bet.id,
      userId: bet.userId,
      date: bet.date || new Date(bet.createdAt).toISOString().split('T')[0],
      winAmount: bet.profitLoss !== undefined ? bet.amount + bet.profitLoss : undefined,
      note: bet.note,
      imageUrl: bet.imageUrl || undefined,
      createdAt: bet.createdAt,
    }));
  }
  parsed.bets = parsed.bets.map((bet: any) => ({
    ...bet,
    winAmount: bet.winAmount ?? undefined,
  }));
};

export const loadFromStorage = (env: Environment = 'production'): AppData | null => {
  try {
    const data = localStorage.getItem(getStorageKey(env));
    if (data) {
      const parsed = JSON.parse(data);
      migrateBetData(parsed);
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return null;
};

export const saveToStorage = (data: AppData, env: Environment = 'production'): void =>
  safeLocalStorageSet(getStorageKey(env), data, 'Failed to save to localStorage:');

export const clearStorage = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

const calculateUserTopBadges = (userId: string, bets: Bet[]): UserBadge[] => {
  const userBets = bets.filter((b) => b.userId === userId);
  const winBets = userBets.filter((b) => (b.winAmount ?? 0) > 0);
  const totalProfit = winBets.reduce((sum, b) => sum + (b.winAmount ?? 0), 0);
  const totalWins = winBets.length;

  const dailyStats: Record<string, { wins: number; profit: number }> = {};
  userBets.forEach((bet) => {
    const date = bet.date || 'unknown';
    if (!dailyStats[date]) {
      dailyStats[date] = { wins: 0, profit: 0 };
    }
    if ((bet.winAmount ?? 0) > 0) {
      dailyStats[date].wins += 1;
      dailyStats[date].profit += bet.winAmount ?? 0;
    }
  });

  const maxDailyWins = Math.max(0, ...Object.values(dailyStats).map((d) => d.wins));
  const maxDailyProfit = Math.max(0, ...Object.values(dailyStats).map((d) => d.profit));

  const milestoneDates: Record<string, boolean> = {
    '2026-06-15': (dailyStats['2026-06-15']?.wins ?? 0) > 0,
    '2026-07-19': (dailyStats['2026-07-19']?.wins ?? 0) > 0,
  };

  const earnedBadges = BADGES.filter((badge) => {
    const type = badge.checkFunction;
    const valueMatch = badge.condition.match(/\d+/);
    const value = valueMatch ? parseInt(valueMatch[0], 10) : 0;

    switch (type) {
      case 'checkDailyWins':
        return maxDailyWins >= value;
      case 'checkTotalProfit':
        return totalProfit >= value;
      case 'checkTotalWins':
        return totalWins >= value;
      case 'checkMilestoneDate': {
        const dateMatch = badge.condition.match(/\d{4}-\d{2}-\d{2}/);
        const date = dateMatch ? dateMatch[0] : '';
        return milestoneDates[date] === true;
      }
      case 'checkDailyProfit':
        return maxDailyProfit >= value;
      default:
        return false;
    }
  });

  if (earnedBadges.length === 0) return [];

  // 按稀有度降序，最多返回3个
  earnedBadges.sort((a, b) => b.rarity - a.rarity);
  return earnedBadges.slice(0, 3).map((badge) => ({
    id: badge.id,
    name: badge.name,
    rarity: badge.rarity,
    icon: badge.icon,
    emoji: badge.emoji,
  }));
};

export const calculateRankings = (
  users: User[],
  bets: Bet[],
  sortBy: RankingSortType = 'totalWin'
): RankingItem[] => {
  const rankings: RankingItem[] = users.map((user) => {
    const userBets = bets.filter((b) => b.userId === user.id);
    const settledBets = userBets.filter((b) => b.winAmount !== undefined);
    const winBets = settledBets.filter((b) => (b.winAmount ?? 0) > 0);
    
    const totalWinAmount = winBets.reduce((sum, b) => sum + (b.winAmount ?? 0), 0);
    const winDaysSet = new Set(winBets.map((b) => b.date));
    const winDays = winDaysSet.size;
    const biggestWin = winBets.length > 0
      ? Math.max(...winBets.map((b) => b.winAmount ?? 0))
      : 0;
    const avgWin = settledBets.length > 0 ? totalWinAmount / settledBets.length : 0;
    const topBadges = calculateUserTopBadges(user.id, bets);

    return {
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      totalWinAmount,
      totalBets: userBets.length,
      winDays,
      biggestWin,
      avgWin,
      topBadges,
    };
  });

  rankings.sort((a, b) => {
    if (sortBy === 'totalWin') {
      return b.totalWinAmount - a.totalWinAmount;
    } else if (sortBy === 'winDays') {
      return b.winDays - a.winDays;
    } else {
      return b.totalBets - a.totalBets;
    }
  });

  return rankings;
};

export const getDailyWinAmount = (
  userId: string,
  bets: Bet[]
): Array<{ date: string; winAmount: number; cumulative: number }> => {
  const userBets = bets.filter((b) => b.userId === userId);

  const dailyMap = new Map<string, { winAmount: number }>();

  userBets.forEach((bet) => {
    const date = bet.date;
    const current = dailyMap.get(date) || { winAmount: 0 };
    dailyMap.set(date, {
      winAmount: current.winAmount + (bet.winAmount ?? 0),
    });
  });

  const sortedDates = Array.from(dailyMap.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  let cumulative = 0;
  return sortedDates.map((date) => {
    const dayData = dailyMap.get(date) || { winAmount: 0 };
    cumulative += dayData.winAmount;
    return {
      date,
      winAmount: dayData.winAmount,
      cumulative,
    };
  });
};
