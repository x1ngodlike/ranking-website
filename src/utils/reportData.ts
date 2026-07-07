import type { User, Bet, RankingItem, UserBadge } from '../types';
import { calculateRankings } from './calculations';
import {
  calculateTeamStats,
  calculatePlayTypeStats,
  getBestAIComment,
  getTotalWinMatches,
  parseAIComment,
  type TeamStats,
  type PlayTypeStats,
} from './aiParser';

export interface DailyTrendPoint {
  date: string;
  winAmount: number;
  cumulative: number;
}

export interface StageStats {
  stage: 'group' | 'knockout';
  label: string;
  winCount: number;
  winAmount: number;
}

export interface PlayTypeAmountStats {
  type: string;
  winCount: number;
  winAmount: number;
}

export interface ReportData {
  user: User;
  nickname: string;
  avatar: string;

  totalBets: number;
  totalWinAmount: number;
  winDays: number;
  totalWinMatches: number;

  firstWin: {
    date: string;
    amount: number;
  } | null;

  bestDay: {
    date: string;
    winCount: number;
    profit: number;
  } | null;

  biggestWin: {
    date: string;
    amount: number;
    note?: string;
    imageUrl?: string;
  } | null;

  maxStreak: number;
  streakStartDate?: string;
  streakEndDate?: string;

  bestCP?: {
    userId: string;
    nickname: string;
    avatar: string;
    commonWinDays: number;
  };

  topBadges: UserBadge[];

  teamStats: TeamStats[];
  favoriteTeam?: TeamStats;

  playTypeStats: PlayTypeStats[];
  favoritePlayType?: PlayTypeStats;
  playTypeAmountStats: PlayTypeAmountStats[];
  mvpPlayType?: PlayTypeAmountStats;

  bestAIComment: string | null;

  dailyTrend: DailyTrendPoint[];
  stageStats: StageStats[];
  betterStage?: StageStats;

  rank: number;
  totalUsers: number;

  topUsers: Array<{
    userId: string;
    nickname: string;
    avatar: string;
    totalWinAmount: number;
  }>;

  groupStats: {
    avgWinAmount: number;
    maxSingleWin: number;
    avgWinMatches: number;
    beatCount: number;
    lostCount: number;
  };

  socialTitle: string;
  socialTitleEmoji: string;

  title: string;
  titleEmoji: string;
  titleDesc: string;
}

const TITLES = [
  { key: 'profit', title: '金库霸主', emoji: '🏆', desc: '这个夏天，你是真正的赢家' },
  { key: 'wins', title: '精准射手', emoji: '🎯', desc: '你的眼光，比裁判还准' },
  { key: 'streak', title: '连胜达人', emoji: '🔥', desc: '好运来了，挡都挡不住' },
  { key: 'days', title: '常青树', emoji: '🌲', desc: '每一天都有新的惊喜' },
  { key: 'cp', title: '最佳搭档', emoji: '🤝', desc: '两个人的运气，双倍的快乐' },
  { key: 'burst', title: '闪电猎手', emoji: '⚡', desc: '一击制胜，说的就是你' },
  { key: 'allround', title: '全能选手', emoji: '🎲', desc: '每种玩法都难不倒你' },
  { key: 'comback', title: '后程发力', emoji: '📈', desc: '越到后面，越精彩' },
  { key: 'knockout', title: '淘汰赛之王', emoji: '⚔️', desc: '硬仗越硬，你越稳' },
  { key: 'explorer', title: '足球探险家', emoji: '🧭', desc: '每一支球队都有你的足迹' },
  { key: 'rookie', title: '幸运新星', emoji: '⭐', desc: '初出茅庐，未来可期' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}月${day}日`;
}

const KNOCKOUT_START_DATE = '2026-07-02';

function calculatePlayTypeAmountStats(bets: Bet[]): PlayTypeAmountStats[] {
  const typeMap = new Map<string, { winCount: number; winAmount: number }>();

  bets.forEach((bet) => {
    if (!bet.aiComment || (bet.winAmount ?? 0) <= 0) return;
    const parsed = parseAIComment(bet.aiComment);
    if (!parsed || parsed.matches.length === 0) return;

    const playType = parsed.matches[0].playType || '其他';
    const existing = typeMap.get(playType) || { winCount: 0, winAmount: 0 };
    existing.winCount++;
    existing.winAmount += bet.winAmount ?? 0;
    typeMap.set(playType, existing);
  });

  return Array.from(typeMap.entries())
    .map(([type, stats]) => ({ type, ...stats }))
    .sort((a, b) => b.winAmount - a.winAmount);
}

function calculateDailyTrend(bets: Bet[]): DailyTrendPoint[] {
  const winBets = bets.filter((b) => (b.winAmount ?? 0) > 0);
  const dailyMap = new Map<string, number>();

  winBets.forEach((bet) => {
    const current = dailyMap.get(bet.date) || 0;
    dailyMap.set(bet.date, current + (bet.winAmount ?? 0));
  });

  const sortedDates = Array.from(dailyMap.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  let cumulative = 0;
  return sortedDates.map((date) => {
    const amount = dailyMap.get(date) || 0;
    cumulative += amount;
    return { date, winAmount: amount, cumulative };
  });
}

function calculateStageStats(bets: Bet[]): StageStats[] {
  const winBets = bets.filter((b) => (b.winAmount ?? 0) > 0);
  const cutoff = new Date(KNOCKOUT_START_DATE).getTime();

  const groupStats = { winCount: 0, winAmount: 0 };
  const knockoutStats = { winCount: 0, winAmount: 0 };

  winBets.forEach((bet) => {
    const betTime = new Date(bet.date).getTime();
    if (betTime < cutoff) {
      groupStats.winCount++;
      groupStats.winAmount += bet.winAmount ?? 0;
    } else {
      knockoutStats.winCount++;
      knockoutStats.winAmount += bet.winAmount ?? 0;
    }
  });

  return [
    { stage: 'group', label: '小组赛', ...groupStats },
    { stage: 'knockout', label: '淘汰赛', ...knockoutStats },
  ];
}

function determineTitle(
  ranking: RankingItem,
  teamStats: TeamStats[],
  playTypeStats: PlayTypeStats[],
  stageStats: StageStats[],
  allRankings: RankingItem[]
): { title: string; emoji: string; desc: string } {
  const profitRank = allRankings.findIndex((r) => r.userId === ranking.userId) + 1;

  if (profitRank === 1) {
    return TITLES[0];
  }

  if (ranking.totalBets >= 20) {
    return TITLES[1];
  }

  if (ranking.maxStreak >= 3) {
    return TITLES[2];
  }

  if (ranking.winDays >= 7) {
    return TITLES[3];
  }

  if (ranking.bestCP && ranking.bestCP.commonWinDays >= 3) {
    return TITLES[4];
  }

  if (ranking.biggestWin >= 1000) {
    return TITLES[5];
  }

  const mainPlayTypes = playTypeStats.filter(
    (p) => p.type !== '其他' && p.winCount > 0
  );
  if (mainPlayTypes.length >= 4) {
    return TITLES[6];
  }

  const knockout = stageStats.find((s) => s.stage === 'knockout');
  const group = stageStats.find((s) => s.stage === 'group');
  if (knockout && group && knockout.winAmount > group.winAmount && knockout.winCount > 0) {
    return TITLES[7];
  }

  if (knockout && knockout.winAmount >= 1000) {
    return TITLES[8];
  }

  if (teamStats.length >= 6) {
    return TITLES[9];
  }

  return TITLES[10];
}

function determineSocialTitle(
  rank: number,
  totalUsers: number,
  userRanking: RankingItem,
  playTypeStats: PlayTypeStats[]
): { title: string; emoji: string } {
  if (totalUsers === 0) {
    return { title: '独行侠', emoji: '🦸' };
  }

  const rankPercent = ((totalUsers - rank + 1) / totalUsers) * 100;

  if (rank === 1) {
    return { title: '群内财神', emoji: '👑' };
  }

  if (rankPercent >= 90) {
    return { title: '万中无一', emoji: '💎' };
  }

  if (rankPercent >= 70) {
    return { title: '胜率王者', emoji: '🏆' };
  }

  if (userRanking.maxStreak >= 5) {
    return { title: '连胜狂魔', emoji: '🔥' };
  }

  const totalGoalsType = playTypeStats.find(p => p.type === '总进球数');
  if (totalGoalsType && totalGoalsType.totalCount >= 10) {
    return { title: '进球数专家', emoji: '⚽' };
  }

  if (rankPercent >= 50) {
    return { title: '实力玩家', emoji: '🎯' };
  }

  if (rankPercent >= 30) {
    return { title: '潜力新星', emoji: '⭐' };
  }

  return { title: '重在参与', emoji: '🌱' };
}

export function generateReportData(
  user: User,
  users: User[],
  bets: Bet[]
): ReportData {
  const userBets = bets.filter((b) => b.userId === user.id);
  const winBets = userBets.filter((b) => (b.winAmount ?? 0) > 0);
  const rankings = calculateRankings(users, bets, 'totalWin');
  const userRanking = rankings.find((r) => r.userId === user.id);

  const rank = rankings.findIndex((r) => r.userId === user.id) + 1;

  const sortedWinBets = [...winBets].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const firstWin = sortedWinBets.length > 0
    ? {
        date: sortedWinBets[0].date,
        amount: sortedWinBets[0].winAmount ?? 0,
      }
    : null;

  const dailyStats: Record<string, { wins: number; profit: number }> = {};
  userBets.forEach((bet) => {
    const date = bet.date;
    if (!dailyStats[date]) {
      dailyStats[date] = { wins: 0, profit: 0 };
    }
    if ((bet.winAmount ?? 0) > 0) {
      dailyStats[date].wins += 1;
      dailyStats[date].profit += bet.winAmount ?? 0;
    }
  });

  let bestDay: ReportData['bestDay'] = null;
  let maxDayProfit = 0;
  Object.entries(dailyStats).forEach(([date, stats]) => {
    if (stats.profit > maxDayProfit) {
      maxDayProfit = stats.profit;
      bestDay = {
        date,
        winCount: stats.wins,
        profit: stats.profit,
      };
    }
  });

  let biggestWin: ReportData['biggestWin'] = null;
  if (winBets.length > 0) {
    const biggest = winBets.reduce((max, bet) =>
      (bet.winAmount ?? 0) > (max.winAmount ?? 0) ? bet : max
    );
    biggestWin = {
      date: biggest.date,
      amount: biggest.winAmount ?? 0,
      note: biggest.note,
      imageUrl: biggest.imageUrl,
    };
  }

  const winDates = Object.keys(dailyStats)
    .filter((d) => dailyStats[d].wins > 0)
    .sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let streakStartIdx = 0;
  let bestStreakStart = 0;
  let bestStreakEnd = 0;

  for (let i = 0; i < winDates.length; i++) {
    if (i === 0) {
      currentStreak = 1;
      streakStartIdx = 0;
    } else {
      const prev = new Date(winDates[i - 1]);
      const curr = new Date(winDates[i]);
      const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
        streakStartIdx = i;
      }
    }
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
      bestStreakStart = streakStartIdx;
      bestStreakEnd = i;
    }
  }

  const teamStats = calculateTeamStats(userBets);
  const favoriteTeam = teamStats.length > 0 ? teamStats[0] : undefined;

  const playTypeStats = calculatePlayTypeStats(userBets);
  const favoritePlayType = playTypeStats.length > 0 ? playTypeStats[0] : undefined;
  const playTypeAmountStats = calculatePlayTypeAmountStats(userBets);
  const mvpPlayType = playTypeAmountStats.length > 0 ? playTypeAmountStats[0] : undefined;

  const bestAIComment = getBestAIComment(userBets);

  const totalWinMatches = getTotalWinMatches(userBets);

  const dailyTrend = calculateDailyTrend(userBets);
  const stageStats = calculateStageStats(userBets);
  const betterStage = [...stageStats]
    .filter((s) => s.winAmount > 0)
    .sort((a, b) => b.winAmount - a.winAmount)[0];

  const titleInfo = determineTitle(
    userRanking!,
    teamStats,
    playTypeStats,
    stageStats,
    rankings
  );

  const topUsers = rankings.slice(0, 3).map(r => ({
    userId: r.userId,
    nickname: r.nickname,
    avatar: r.avatar,
    totalWinAmount: r.totalWinAmount,
  }));

  const totalWinAmounts = rankings.map(r => r.totalWinAmount);
  const avgWinAmount = totalWinAmounts.length > 0
    ? totalWinAmounts.reduce((sum, a) => sum + a, 0) / totalWinAmounts.length
    : 0;
  const maxSingleWin = rankings.reduce((max, r) => Math.max(max, r.biggestWin), 0);

  const totalWinMatchesPerUser = rankings.map(r => {
    const rb = bets.filter(b => b.userId === r.userId);
    return getTotalWinMatches(rb);
  });
  const avgWinMatches = totalWinMatchesPerUser.length > 0
    ? totalWinMatchesPerUser.reduce((sum, a) => sum + a, 0) / totalWinMatchesPerUser.length
    : 0;

  const beatCount = users.length - rank;
  const lostCount = rank - 1;

  const groupStats = {
    avgWinAmount,
    maxSingleWin,
    avgWinMatches,
    beatCount,
    lostCount,
  };

  const socialTitleInfo = determineSocialTitle(rank, users.length, userRanking!, playTypeStats);

  return {
    user,
    nickname: user.nickname,
    avatar: user.avatar,
    totalBets: userBets.length,
    totalWinAmount: userRanking?.totalWinAmount ?? 0,
    winDays: userRanking?.winDays ?? 0,
    totalWinMatches,
    firstWin,
    bestDay,
    biggestWin,
    maxStreak,
    streakStartDate: winDates[bestStreakStart],
    streakEndDate: winDates[bestStreakEnd],
    bestCP: userRanking?.bestCP,
    topBadges: userRanking?.topBadges ?? [],
    teamStats,
    favoriteTeam,
    playTypeStats,
    favoritePlayType,
    playTypeAmountStats,
    mvpPlayType,
    bestAIComment,
    dailyTrend,
    stageStats,
    betterStage,
    rank,
    totalUsers: users.length,
    topUsers,
    groupStats,
    socialTitle: socialTitleInfo.title,
    socialTitleEmoji: socialTitleInfo.emoji,
    title: titleInfo.title,
    titleEmoji: titleInfo.emoji,
    titleDesc: titleInfo.desc,
  };
}

export function formatDateCN(dateStr: string): string {
  return formatDate(dateStr);
}

export function formatMoney(amount: number): string {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万';
  }
  return amount.toFixed(0);
}
