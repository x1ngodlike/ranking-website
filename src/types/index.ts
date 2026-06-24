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
  amount: number;
  profitLoss?: number;
  note?: string;
  createdAt: string;
}

export interface RankingItem {
  userId: string;
  nickname: string;
  avatar: string;
  totalProfitLoss: number;
  totalBets: number;
  totalAmount: number;
  winDays: number;
  lossDays: number;
  biggestWin: number;
  biggestLoss: number;
  avgReturn: number;
}

export type RankingSortType = 'profit' | 'totalBets' | 'avgReturn';

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
