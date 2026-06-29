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
  homeScore: number | null;
  awayScore: number | null;
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
}

export interface UserBadge {
  id: string;
  name: string;
  rarity: number;
  icon: string;
  emoji: string;
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
  topBadges?: UserBadge[];
}

export type RankingSortType = 'totalWin' | 'winDays' | 'totalBets';

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
