export interface User {
  id: string;
  nickname: string;
  avatar: string;
  isAdmin: boolean;
  createdAt: string;
}

export type MatchStage = 'group' | 'knockout';
export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  matchTime: string;
  stage: MatchStage;
  groupName?: string;
  roundKey?: string;
  // 显示用比分：点球赛=120分钟比分，加时赛=120分钟比分，常规=90分钟比分
  homeScore: number | null;
  awayScore: number | null;
  // 90分钟常规时间比分（体彩竞彩结算依据）
  regularTimeHomeScore?: number | null;
  regularTimeAwayScore?: number | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  status: MatchStatus;
  matchNumber?: string;
}

export interface Bet {
  id: string;
  userId: string;
  date: string;
  winAmount?: number;
  note?: string;
  imageUrl?: string;
  createdAt: string;
  // AI评价
  aiComment?: string;
  // AI识别中标记
  aiRecognizing?: boolean;
}

export interface AIConfig {
  apiEndpoint: string;
  apiKey: string;
  model: string;
  siteUrl: string;
}

export interface UserBadge {
  id: string;
  name: string;
  rarity: number;
  emoji: string;
}

export interface BestCP {
  userId: string;
  nickname: string;
  avatar: string;
  commonWinDays: number;
}

export interface RankingItem {
  userId: string;
  nickname: string;
  avatar: string;
  totalWinAmount: number;
  totalBets: number;
  winDays: number;
  biggestWin: number;
  avgWin: number;
  maxStreak: number;
  bestCP?: BestCP;
  topBadges?: UserBadge[];
}

export type RankingSortType = 'totalWin' | 'winDays' | 'totalBets';

export interface DailyTrendItem {
  date: string;
  winAmount: number;
  cumulative: number;
  contributors: Array<{
    userId: string;
    nickname: string;
    avatar: string;
    amount: number;
    count: number;
  }>;
}

export interface ApiConfig {
  apiKey: string;
  competition: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type Environment = 'production' | 'test';

export interface AdminConfig {
  password: string;
  isLoggedIn: boolean;
}
