import type { User, Bet, Match, RankingItem, RankingSortType, Environment, UserBadge, DailyTrendItem } from '../types';
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
  matches: Match[];
  bets: Bet[];
  currentUserId: string | null;
}

type LegacyBet = Partial<Bet> & { amount?: number; profitLoss?: number };
type StoredData = Omit<Partial<AppData>, 'bets'> & { bets?: LegacyBet[] };

const migrateBetData = (parsed: StoredData): void => {
  if (!parsed.bets || parsed.bets.length === 0) return;

  const firstBet = parsed.bets[0];
  if ('amount' in firstBet && !('winAmount' in firstBet)) {
    parsed.bets = parsed.bets.map((bet) => ({
      id: bet.id,
      userId: bet.userId,
      date: bet.date || new Date(bet.createdAt).toISOString().split('T')[0],
      winAmount: bet.profitLoss !== undefined ? bet.amount + bet.profitLoss : undefined,
      note: bet.note,
      imageUrl: bet.imageUrl || undefined,
      createdAt: bet.createdAt,
    }));
  }
  parsed.bets = parsed.bets.map((bet) => ({
    ...bet,
    winAmount: bet.winAmount ?? undefined,
  }));
};

export const loadFromStorage = (env: Environment = 'production'): AppData | null => {
  try {
    const data = localStorage.getItem(getStorageKey(env));
    if (data) {
      const parsed = JSON.parse(data) as StoredData;
      migrateBetData(parsed);
      return parsed as AppData;
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

  // 计算最大连续中奖天数（连续有中奖的日期的最大连续天数）
  const winDates = Array.from(new Set(winBets.map((b) => b.date).filter(Boolean))).sort();
  let maxStreak = 0;
  let currentStreak = 0;
  for (let i = 0; i < winDates.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prev = new Date(winDates[i - 1]).getTime();
      const curr = new Date(winDates[i]).getTime();
      const diffDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
      currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
  }

  const milestoneDates: Record<string, boolean> = {
    '2026-07-19': (dailyStats['2026-07-19']?.wins ?? 0) > 0,
    '2026-07-20': (dailyStats['2026-07-20']?.wins ?? 0) > 0,
  };

  const earnedBadges = BADGES.filter((badge) => {
    const type = badge.checkFunction;
    const valueMatch = badge.condition.match(/\d+/);
    const value = valueMatch ? parseInt(valueMatch[0], 10) : 0;

    switch (type) {
      case 'checkDailyWins':
        return maxDailyWins >= value;
      case 'checkStreak':
        return maxStreak >= value;
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

  // 按类型分组，每个类型取星级最高的徽章
  const categoryMap = new Map<string, typeof earnedBadges[0]>();
  earnedBadges.forEach((badge) => {
    const existing = categoryMap.get(badge.category);
    if (!existing || badge.rarity > existing.rarity) {
      categoryMap.set(badge.category, badge);
    }
  });

  // 转换为数组并按稀有度降序排列
  const topBadges = Array.from(categoryMap.values())
    .sort((a, b) => b.rarity - a.rarity)
    .map((badge) => ({
      id: badge.id,
      name: badge.name,
      rarity: badge.rarity,
      emoji: badge.emoji,
    }));

  return topBadges;
};

export const calculateRankings = (
  users: User[],
  bets: Bet[],
  sortBy: RankingSortType = 'totalWin'
): RankingItem[] => {
  const userWinDaysMap = new Map<string, Set<string>>();
  users.forEach((user) => {
    const userBets = bets.filter((b) => b.userId === user.id);
    const winBets = userBets.filter((b) => (b.winAmount ?? 0) > 0);
    const winDaysSet = new Set(winBets.map((b) => b.date));
    userWinDaysMap.set(user.id, winDaysSet);
  });

  const rankings: RankingItem[] = users.map((user) => {
    const userBets = bets.filter((b) => b.userId === user.id);
    const settledBets = userBets.filter((b) => b.winAmount !== undefined);
    const winBets = settledBets.filter((b) => (b.winAmount ?? 0) > 0);
    
    const totalWinAmount = winBets.reduce((sum, b) => sum + (b.winAmount ?? 0), 0);
    const winDaysSet = userWinDaysMap.get(user.id)!;
    const winDays = winDaysSet.size;
    const biggestWin = winBets.length > 0
      ? Math.max(...winBets.map((b) => b.winAmount ?? 0))
      : 0;
    const avgWin = settledBets.length > 0 ? totalWinAmount / settledBets.length : 0;
    const topBadges = calculateUserTopBadges(user.id, bets);

    // 计算连胜记录：最长连续中奖天数
    const winDates = Array.from(winDaysSet).sort();
    let maxStreak = 0;
    let currentStreak = 0;
    for (let i = 0; i < winDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(winDates[i - 1]);
        const currDate = new Date(winDates[i]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    }

    // 计算最佳CP：同时中奖天数最多的用户
    let bestCP: RankingItem['bestCP'] = undefined;
    let maxCommonDays = 0;
    users.forEach((otherUser) => {
      if (otherUser.id === user.id) return;
      const otherWinDaysSet = userWinDaysMap.get(otherUser.id)!;
      let commonDays = 0;
      winDaysSet.forEach((date) => {
        if (otherWinDaysSet.has(date)) {
          commonDays++;
        }
      });
      if (commonDays > maxCommonDays) {
        maxCommonDays = commonDays;
        bestCP = {
          userId: otherUser.id,
          nickname: otherUser.nickname,
          avatar: otherUser.avatar,
          commonWinDays: commonDays,
        };
      }
    });

    return {
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      totalWinAmount,
      totalBets: userBets.length,
      winDays,
      biggestWin,
      avgWin,
      maxStreak,
      bestCP,
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

export const calculateDailyTrend = (
  users: User[],
  bets: Bet[]
): DailyTrendItem[] => {
  const winBets = bets.filter((b) => (b.winAmount ?? 0) > 0);

  const dailyMap = new Map<string, {
    winAmount: number;
    userMap: Map<string, { amount: number; count: number }>;
  }>();

  winBets.forEach((bet) => {
    const date = bet.date;
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { winAmount: 0, userMap: new Map() });
    }
    const day = dailyMap.get(date)!;
    day.winAmount += bet.winAmount ?? 0;

    const userEntry = day.userMap.get(bet.userId);
    if (userEntry) {
      userEntry.amount += bet.winAmount ?? 0;
      userEntry.count += 1;
    } else {
      day.userMap.set(bet.userId, { amount: bet.winAmount ?? 0, count: 1 });
    }
  });

  const sortedDates = Array.from(dailyMap.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const userMap = new Map(users.map((u) => [u.id, u]));
  let cumulative = 0;

  return sortedDates.map((date) => {
    const dayData = dailyMap.get(date)!;
    cumulative += dayData.winAmount;

    const contributors = Array.from(dayData.userMap.entries())
      .map(([userId, data]) => {
        const user = userMap.get(userId);
        return {
          userId,
          nickname: user?.nickname || '未知用户',
          avatar: user?.avatar || '👤',
          amount: data.amount,
          count: data.count,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      date,
      winAmount: dayData.winAmount,
      cumulative,
      contributors,
    };
  });
};

export const getTodayStr = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getDailyStarUserId = (bets: Bet[], date?: string): string | null => {
  const targetDate = date || getTodayStr();
  const winBets = bets.filter((b) => b.date === targetDate && (b.winAmount ?? 0) > 0);
  if (winBets.length === 0) return null;

  const userAmounts = new Map<string, number>();
  winBets.forEach((b) => {
    userAmounts.set(b.userId, (userAmounts.get(b.userId) || 0) + (b.winAmount ?? 0));
  });

  let maxUserId: string | null = null;
  let maxAmount = 0;
  userAmounts.forEach((amount, userId) => {
    if (amount > maxAmount) {
      maxAmount = amount;
      maxUserId = userId;
    }
  });
  return maxUserId;
};
