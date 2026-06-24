import { create } from 'zustand';
import type { User, Match, Bet, RankingSortType, Environment } from '../types';
import { mockUsers, mockMatches, mockBets } from '../utils/mockData';
import { calculateRankings } from '../utils/calculations';
import { generateId } from '../utils/helpers';
import { loadApiConfig, saveApiConfig as saveApiConfigToStorage, type ApiConfig } from '../utils/apiConfig';
import { fetchMatchesFromApi } from '../services/footballApi';
import {
  loadTheme,
  saveTheme as saveThemeToStorage,
  applyTheme,
  type ThemeMode,
} from '../utils/theme';
import { api, getAdminToken, type BackupInfo } from '../utils/api';

const DEFAULT_AVATAR = '⚽️';
const ADMIN_STORAGE_KEY = 'ranking_website_admin_logged_in';

interface AppState {
  users: User[];
  matches: Match[];
  bets: Bet[];
  currentUserId: string | null;
  sortType: RankingSortType;
  apiConfig: ApiConfig;
  isRefreshing: boolean;
  lastRefreshTime: string | null;
  refreshError: string | null;
  theme: ThemeMode;
  environment: Environment;
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  showSettingsModal: boolean;

  init: () => Promise<void>;
  setCurrentUser: (userId: string | null) => void;
  setSortType: (sortType: RankingSortType) => void;

  addUser: (nickname: string, avatar: string) => void;
  addUserWithUpload: (nickname: string, avatar: string, customImage?: Blob | null) => Promise<void>;
  updateUser: (userId: string, nickname: string, avatar: string) => void;
  removeUser: (userId: string) => void;

  addBet: (bet: Bet) => void;
  removeBet: (betId: string) => void;
  updateBet: (betId: string, updates: Partial<Bet>) => void;

  updateMatchScore: (matchId: string, homeScore: number, awayScore: number) => void;

  getRankings: () => ReturnType<typeof calculateRankings>;
  getCurrentUser: () => User | null;

  exportData: () => string;
  importData: (json: string) => boolean;
  resetData: () => void;

  setApiConfig: (config: Partial<ApiConfig>) => void;
  syncMatchesFromApi: (competitionId?: string) => Promise<{ added: number; updated: number }>;
  refreshLiveMatches: () => Promise<number>;
  setRefreshError: (error: string | null) => void;

  setTheme: (theme: ThemeMode) => void;

  adminLogin: (password: string) => Promise<boolean>;
  adminLogout: () => void;
  changeAdminPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  switchEnvironment: (env: Environment) => Promise<void>;
  clearEnvironmentData: (environment: Environment) => Promise<boolean>;
  listBackups: (environment: Environment) => Promise<BackupInfo[]>;
  createBackup: (environment: Environment, label?: string) => Promise<boolean>;
  restoreBackup: (environment: Environment, filename: string) => Promise<boolean>;
  deleteBackup: (environment: Environment, filename: string) => Promise<boolean>;

  openSettings: () => void;
  closeSettings: () => void;
}

const saveToServer = async (state: AppState) => {
  try {
    await api.saveData({
      environment: state.environment,
      users: state.users,
      bets: state.bets,
      matches: state.matches,
      apiKey: state.apiConfig.apiKey,
      competition: state.apiConfig.competition,
      theme: state.theme,
      currentUserId: state.currentUserId,
    });
  } catch (e) {
    console.warn('Failed to save data to server:', e);
  }
};

const getInitialState = (): Omit<
  AppState,
  | 'init'
  | 'setCurrentUser'
  | 'setSortType'
  | 'addUser'
  | 'addUserWithUpload'
  | 'updateUser'
  | 'removeUser'
  | 'addBet'
  | 'removeBet'
  | 'updateBet'
  | 'updateMatchScore'
  | 'getRankings'
  | 'getCurrentUser'
  | 'exportData'
  | 'importData'
  | 'resetData'
  | 'setApiConfig'
  | 'syncMatchesFromApi'
  | 'refreshLiveMatches'
  | 'setRefreshError'
  | 'setTheme'
  | 'adminLogin'
  | 'adminLogout'
  | 'changeAdminPassword'
  | 'switchEnvironment'
  | 'clearEnvironmentData'
  | 'listBackups'
  | 'createBackup'
  | 'restoreBackup'
  | 'deleteBackup'
  | 'openSettings'
  | 'closeSettings'
> => {
  const apiConfig = loadApiConfig();
  const theme = loadTheme();

  return {
    users: mockUsers,
    matches: mockMatches,
    bets: mockBets,
    currentUserId: 'user1',
    sortType: 'totalWin' as RankingSortType,
    apiConfig,
    isRefreshing: false,
    lastRefreshTime: null,
    refreshError: null,
    theme,
    environment: 'production' as Environment,
    isAdminLoggedIn: false,
    isLoading: true,
    showSettingsModal: false,
  };
};

export const useAppStore = create<AppState>((set, get) => ({
  ...getInitialState(),

  init: async () => {
    const state = get();
    try {
      const data = await api.getData(state.environment);
      const isAdmin = !!getAdminToken();
      set({
        users: data.users || mockUsers,
        matches: data.matches || mockMatches,
        bets: data.bets || mockBets,
        currentUserId: data.currentUserId ?? 'user1',
        isAdminLoggedIn: isAdmin,
        isLoading: false,
      });
      if (data.apiKey) {
        set((s) => ({ apiConfig: { ...s.apiConfig, apiKey: data.apiKey } }));
      }
      if (data.competition) {
        set((s) => ({ apiConfig: { ...s.apiConfig, competition: data.competition } }));
      }
      if (data.theme && (data.theme === 'light' || data.theme === 'dark' || data.theme === 'system')) {
        set({ theme: data.theme as ThemeMode });
        applyTheme(data.theme as ThemeMode);
      }
    } catch (e) {
      console.warn('Failed to load data from server, using mock data:', e);
      set({ isLoading: false });
    }
  },

  setCurrentUser: (userId) => {
    set({ currentUserId: userId });
    saveToServer(get());
  },

  setSortType: (sortType) => set({ sortType }),

  addUser: (nickname, avatar) => {
    const newUser: User = {
      id: generateId(),
      nickname,
      avatar,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ users: [...state.users, newUser] }));
    saveToServer(get());
  },

  addUserWithUpload: async (nickname: string, avatar: string, customImage?: Blob | null) => {
    let finalAvatar = avatar || DEFAULT_AVATAR;

    if (customImage) {
      try {
        const ext = customImage.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
        const tempId = `temp-${Date.now()}`;
        const filename = `avatar-${tempId}.${ext}`;
        finalAvatar = await api.uploadAvatar(customImage, filename);
      } catch (e) {
        console.warn('Failed to upload avatar, using emoji instead:', e);
        finalAvatar = DEFAULT_AVATAR;
      }
    }

    const newUser: User = {
      id: generateId(),
      nickname,
      avatar: finalAvatar,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ users: [...state.users, newUser] }));
    saveToServer(get());
  },

  updateUser: (userId, nickname, avatar) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, nickname, avatar } : u
      ),
    }));
    saveToServer(get());
  },

  removeUser: (userId) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
      bets: state.bets.filter((b) => b.userId !== userId),
      currentUserId: state.currentUserId === userId ? null : state.currentUserId,
    }));
    saveToServer(get());
  },

  addBet: (bet) => {
    set((state) => ({ bets: [bet, ...state.bets] }));
    saveToServer(get());
  },

  removeBet: (betId) => {
    set((state) => ({ bets: state.bets.filter((b) => b.id !== betId) }));
    saveToServer(get());
  },

  updateBet: (betId, updates) => {
    set((state) => ({
      bets: state.bets.map((b) =>
        b.id === betId ? { ...b, ...updates } : b
      ),
    }));
    saveToServer(get());
  },

  updateMatchScore: (matchId, homeScore, awayScore) => {
    set((state) => {
      const updatedMatches = state.matches.map((m) =>
        m.id === matchId
          ? { ...m, homeScore, awayScore, status: 'finished' as const }
          : m
      );
      return { matches: updatedMatches };
    });
    saveToServer(get());
  },

  getRankings: () => {
    const state = get();
    return calculateRankings(state.users, state.bets, state.sortType);
  },

  getCurrentUser: () => {
    const state = get();
    return state.users.find((u) => u.id === state.currentUserId) || null;
  },

  exportData: () => {
    const state = get();
    const data = {
      users: state.users,
      matches: state.matches,
      bets: state.bets,
      currentUserId: state.currentUserId,
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (json) => {
    try {
      const data = JSON.parse(json);
      if (!data.users || !data.matches || !data.bets) {
        return false;
      }
      set({
        users: data.users,
        matches: data.matches,
        bets: data.bets,
        currentUserId: data.currentUserId,
      });
      saveToServer(get());
      return true;
    } catch {
      return false;
    }
  },

  resetData: () => {
    set({
      users: mockUsers,
      matches: mockMatches,
      bets: mockBets,
      currentUserId: 'user1',
      sortType: 'totalWin',
    });
    saveToServer(get());
  },

  setApiConfig: (config) => {
    const newConfig = { ...get().apiConfig, ...config };
    set({ apiConfig: newConfig });
    saveApiConfigToStorage(config);
    saveToServer(get());
  },

  syncMatchesFromApi: async (competitionId = '2000') => {
    set({ isRefreshing: true, refreshError: null });

    try {
      const apiMatches = await fetchMatchesFromApi(competitionId);
      let added = 0;
      let updated = 0;

      set((state) => {
        const existingMap = new Map(state.matches.map((m) => [m.id, m]));
        const newMatches: Match[] = [];

        apiMatches.forEach((apiMatch) => {
          const existingById = existingMap.get(apiMatch.id);
          let matched = false;

          if (existingById) {
            newMatches.push(apiMatch);
            updated++;
            matched = true;
          } else {
            const existingByTeam = state.matches.find(
              (m) =>
                m.homeTeam === apiMatch.homeTeam &&
                m.awayTeam === apiMatch.awayTeam
            );
            if (existingByTeam) {
              newMatches.push(apiMatch);
              updated++;
              matched = true;
            }
          }

          if (!matched) {
            newMatches.push(apiMatch);
            added++;
          }
        });

        return { matches: newMatches };
      });

      saveToServer(get());
      set({ isRefreshing: false, lastRefreshTime: new Date().toISOString() });

      return { added, updated };
    } catch (error) {
      const message = error instanceof Error ? error.message : '同步失败';
      set({ isRefreshing: false, refreshError: message });
      throw error;
    }
  },

  refreshLiveMatches: async () => {
    set({ isRefreshing: true, refreshError: null });

    try {
      const competitionId = '2000';
      const apiMatches = await fetchMatchesFromApi(competitionId);
      let updatedCount = 0;

      set((state) => {
        const newMatches = [...state.matches];

        apiMatches.forEach((apiMatch) => {
          const index = newMatches.findIndex((m) => m.id === apiMatch.id);
          if (index > -1) {
            const oldMatch = newMatches[index];
            const scoreChanged =
              oldMatch.homeScore !== apiMatch.homeScore ||
              oldMatch.awayScore !== apiMatch.awayScore ||
              oldMatch.status !== apiMatch.status;

            if (scoreChanged) {
              newMatches[index] = apiMatch;
              updatedCount++;
            }
          }
        });

        return { matches: newMatches };
      });

      saveToServer(get());
      set({ isRefreshing: false, lastRefreshTime: new Date().toISOString() });

      return updatedCount;
    } catch (error) {
      const message = error instanceof Error ? error.message : '刷新失败';
      set({ isRefreshing: false, refreshError: message });
      throw error;
    }
  },

  setRefreshError: (error) => set({ refreshError: error }),

  setTheme: (theme) => {
    set({ theme });
    saveThemeToStorage(theme);
    applyTheme(theme);
    saveToServer(get());
  },

  adminLogin: async (password) => {
    try {
      const result = await api.adminLogin(password);
      if (result.success) {
        set({ isAdminLoggedIn: true });
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Admin login failed:', e);
      return false;
    }
  },

  adminLogout: () => {
    api.adminLogout().catch(() => {});
    set({ isAdminLoggedIn: false });
  },

  changeAdminPassword: async (oldPassword, newPassword) => {
    try {
      const result = await api.changeAdminPassword(oldPassword, newPassword);
      return result.success;
    } catch (e) {
      console.warn('Change password failed:', e);
      return false;
    }
  },

  switchEnvironment: async (env) => {
    const state = get();
    if (state.environment === env) return;

    set({ environment: env, isLoading: true });

    try {
      const data = await api.getData(env);
      set({
        users: data.users || mockUsers,
        matches: data.matches || mockMatches,
        bets: data.bets || mockBets,
        currentUserId: data.currentUserId ?? 'user1',
        isLoading: false,
      });
      if (data.apiKey) {
        set((s) => ({ apiConfig: { ...s.apiConfig, apiKey: data.apiKey } }));
      }
      if (data.competition) {
        set((s) => ({ apiConfig: { ...s.apiConfig, competition: data.competition } }));
      }
    } catch (e) {
      console.warn('Failed to load environment data from server, using mock data:', e);
      set({
        users: mockUsers,
        matches: mockMatches,
        bets: mockBets,
        currentUserId: 'user1',
        isLoading: false,
      });
    }
  },

  clearEnvironmentData: async (environment) => {
    try {
      const result = await api.clearEnvironmentData(environment);
      if (result.success) {
        const state = get();
        if (state.environment === environment) {
          set({
            users: mockUsers,
            matches: mockMatches,
            bets: mockBets,
            currentUserId: 'user1',
          });
        }
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Failed to clear environment data:', e);
      return false;
    }
  },

  listBackups: async (environment) => {
    try {
      const result = await api.listBackups(environment);
      return result.backups || [];
    } catch (e) {
      console.warn('Failed to list backups:', e);
      return [];
    }
  },

  createBackup: async (environment, label = 'manual') => {
    try {
      const result = await api.createBackup(environment, label);
      return result.success;
    } catch (e) {
      console.warn('Failed to create backup:', e);
      return false;
    }
  },

  restoreBackup: async (environment, filename) => {
    try {
      const result = await api.restoreBackup(environment, filename);
      if (result.success) {
        // 还原后重新加载当前环境数据
        const state = get();
        if (state.environment === environment) {
          const data = await api.getData(environment);
          set({
            users: data.users || mockUsers,
            matches: data.matches || mockMatches,
            bets: data.bets || mockBets,
            currentUserId: data.currentUserId ?? 'user1',
          });
        }
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Failed to restore backup:', e);
      return false;
    }
  },

  deleteBackup: async (environment, filename) => {
    try {
      const result = await api.deleteBackup(environment, filename);
      return result.success;
    } catch (e) {
      console.warn('Failed to delete backup:', e);
      return false;
    }
  },

  openSettings: () => set({ showSettingsModal: true }),
  closeSettings: () => set({ showSettingsModal: false }),
}));
