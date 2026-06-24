import type { User, Match, Bet, RankingItem, RankingSortType, Environment } from '../types';

const STORAGE_KEY = 'world_cup_betting_app';
const ADMIN_KEY = 'world_cup_betting_admin';
const ENV_KEY = 'world_cup_betting_env';

export const getStorageKey = (env: Environment) => {
  return env === 'test' ? `${STORAGE_KEY}_test` : STORAGE_KEY;
};

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

export const loadAdminConfig = (): { password: string; isLoggedIn: boolean } => {
  try {
    const data = localStorage.getItem(ADMIN_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load admin config:', e);
  }
  return { password: '159357', isLoggedIn: false };
};

export const saveAdminConfig = (config: { password: string; isLoggedIn: boolean }): void => {
  try {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save admin config:', e);
  }
};

export interface AppData {
  users: User[];
  matches: Match[];
  bets: Bet[];
  currentUserId: string | null;
}

export const loadFromStorage = (env: Environment = 'production'): AppData | null => {
  try {
    const data = localStorage.getItem(getStorageKey(env));
    if (data) {
      const parsed = JSON.parse(data);
      // 处理旧数据格式迁移
      if (parsed.bets && parsed.bets.length > 0) {
        const firstBet = parsed.bets[0];
        // 如果是旧格式（有 selections 字段），需要转换
        if ('selections' in firstBet) {
          parsed.bets = parsed.bets.map((bet: any) => ({
            id: bet.id,
            userId: bet.userId,
            date: bet.date || new Date(bet.createdAt).toISOString().split('T')[0],
            amount: bet.amount,
            profitLoss: bet.profitLoss,
            note: bet.note,
            createdAt: bet.createdAt,
          }));
        }
        // 清理 null 值，改为 undefined
        parsed.bets = parsed.bets.map((bet: any) => ({
          ...bet,
          profitLoss: bet.profitLoss ?? undefined,
        }));
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return null;
};

export const saveToStorage = (data: AppData, env: Environment = 'production'): void => {
  try {
    localStorage.setItem(getStorageKey(env), JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

export const clearStorage = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const calculateRankings = (
  users: User[],
  bets: Bet[],
  sortBy: RankingSortType = 'profit'
): RankingItem[] => {
  const rankings: RankingItem[] = users.map((user) => {
    const userBets = bets.filter((b) => b.userId === user.id);
    const settledBets = userBets.filter((b) => b.profitLoss !== undefined);
    const pendingBets = userBets.filter((b) => b.profitLoss === undefined);
    
    const totalProfitLoss = settledBets.reduce((sum, b) => sum + b.profitLoss!, 0);
    const totalAmount = userBets.reduce((sum, b) => sum + b.amount, 0);
    const winDays = settledBets.filter((b) => b.profitLoss! > 0).length;
    const lossDays = settledBets.filter((b) => b.profitLoss! < 0).length;
    const pendingAmount = pendingBets.reduce((sum, b) => sum + b.amount, 0);
    
    const totalWinAmount = settledBets
      .filter((b) => b.profitLoss! > 0)
      .reduce((sum, b) => sum + b.amount + b.profitLoss!, 0);

    const biggestWin = Math.max(0, ...settledBets.map((b) => b.profitLoss!));
    const biggestLoss = Math.min(0, ...settledBets.map((b) => b.profitLoss!));

    const avgReturn = totalAmount > 0 ? (totalProfitLoss / totalAmount) * 100 : 0;

    return {
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      totalProfitLoss,
      totalBets: userBets.length,
      totalAmount,
      totalWinAmount,
      pendingAmount,
      winDays,
      lossDays,
      biggestWin,
      biggestLoss,
      avgReturn,
    };
  });

  rankings.sort((a, b) => {
    if (sortBy === 'profit') {
      return b.totalProfitLoss - a.totalProfitLoss;
    } else if (sortBy === 'avgReturn') {
      return b.avgReturn - a.avgReturn;
    } else {
      return b.totalBets - a.totalBets;
    }
  });

  return rankings;
};

export const getDailyProfitLoss = (
  userId: string,
  bets: Bet[]
): Array<{ date: string; profitLoss: number; amount: number; cumulative: number; winAmount: number }> => {
  const userBets = bets.filter((b) => b.userId === userId);

  const dailyMap = new Map<string, { profitLoss: number; amount: number; winAmount: number }>();

  userBets.forEach((bet) => {
    const date = bet.date;
    const current = dailyMap.get(date) || { profitLoss: 0, amount: 0, winAmount: 0 };
    const profit = bet.profitLoss ?? 0;
    const winAmount = bet.profitLoss !== undefined && bet.profitLoss > 0 ? bet.amount + bet.profitLoss : 0;
    dailyMap.set(date, {
      profitLoss: current.profitLoss + profit,
      amount: current.amount + bet.amount,
      winAmount: current.winAmount + winAmount,
    });
  });

  const sortedDates = Array.from(dailyMap.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  let cumulative = 0;
  return sortedDates.map((date) => {
    const dayData = dailyMap.get(date) || { profitLoss: 0, amount: 0, winAmount: 0 };
    cumulative += dayData.profitLoss;
    return {
      date,
      profitLoss: dayData.profitLoss,
      amount: dayData.amount,
      cumulative,
      winAmount: dayData.winAmount,
    };
  });
};
