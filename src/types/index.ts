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
  homeScore: number | null;
  awayScore: number | null;
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
  // AI简述
  aiComment?: string;
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
