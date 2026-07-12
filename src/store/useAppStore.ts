import { create } from 'zustand';
import type { User, Match, Bet, RankingSortType, Environment } from '../types';
import { mockUsers, mockMatches, mockBets } from '../utils/mockData';
import { calculateRankings } from '../utils/calculations';
import { generateId } from '@/utils/helpers';
import { loadApiConfig, saveApiConfig as saveApiConfigToStorage, type ApiConfig } from '@/utils/apiConfig';
import {
  loadTheme,
  saveTheme as saveThemeToStorage,
  applyTheme,
  loadDesignVersion,
  saveDesignVersion as saveDesignVersionToStorage,
  applyDesignVersion,
  type ThemeMode,
  type DesignVersion,
} from '@/utils/theme';
import { api, getAdminToken, type BackupInfo } from '@/utils/api';

const DEFAULT_AVATAR = '⚽️';
const DEFAULT_USER_ID = 'user1';

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
  designVersion: DesignVersion;
  environment: Environment;
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  isDataLoaded: boolean;
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
  syncMatchesFromApi: () => Promise<{ added: number; updated: number }>;
  setRefreshError: (error: string | null) => void;

  setTheme: (theme: ThemeMode) => void;

  setDesignVersion: (version: DesignVersion) => void;

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
  refreshData: () => Promise<void>;
}

// 保存防抖：前端每次操作都会触发 saveToServer，但整份 state 全量上传开销不小，
// 且快速连续操作会产生大量并发写。这里做 600ms 尾部防抖，始终以最新 state 落盘，
// 既减少写入频次，也降低服务端并发写压力。调用点（saveToServer(get())）无需改动。
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSaveState: AppState | null = null;
const SAVE_DEBOUNCE_MS = 600;

const flushSave = async () => {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const state = pendingSaveState;
  pendingSaveState = null;
  if (!state || !state.isDataLoaded) return;
  try {
    await api.saveData({
      environment: state.environment,
      users: state.users,
      bets: state.bets,
      matches: state.matches,
      apiKey: state.apiConfig.apiKey,
      competition: state.apiConfig.competition,
      currentUserId: state.currentUserId,
    });
  } catch (e) {
    console.warn('Failed to save data to server:', e);
  }
};

const saveToServer = (state: AppState): void => {
  pendingSaveState = state;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void flushSave();
  }, SAVE_DEBOUNCE_MS);
};

// 标签页关闭前，尽量把挂起的保存刷盘，避免最后 600ms 内的改动丢失。
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    void flushSave();
  });
}

const getInitialState = (): Omit<AppState, keyof ReturnType<typeof createStoreActions>> => {
  const apiConfig = loadApiConfig();
  const theme = loadTheme();

  return {
    users: mockUsers,
    matches: mockMatches,
    bets: mockBets,
    currentUserId: DEFAULT_USER_ID,
    sortType: 'totalWin' as RankingSortType,
    apiConfig,
    isRefreshing: false,
    lastRefreshTime: null,
    refreshError: null,
    theme,
    designVersion: loadDesignVersion(),
    environment: import.meta.env.PROD ? 'production' as Environment : 'test' as Environment,
    isAdminLoggedIn: false,
    isLoading: true,
    isDataLoaded: false,
    showSettingsModal: false,
  };
};

const buildDataState = (data: any) => ({
  users: (data.users && data.users.length > 0) ? data.users : mockUsers,
  matches: (data.matches && data.matches.length > 0) ? data.matches : mockMatches,
  bets: (data.bets && data.bets.length > 0) ? data.bets : mockBets,
  currentUserId: data.currentUserId ?? DEFAULT_USER_ID,
});

const updateApiConfigFromData = (set: any, data: any) => {
  if (data.apiKey) {
    set((s: AppState) => ({ apiConfig: { ...s.apiConfig, apiKey: data.apiKey } }));
  }
  if (data.competition) {
    set((s: AppState) => ({ apiConfig: { ...s.apiConfig, competition: data.competition } }));
  }
};

const handleRefreshError = (set: any, error: unknown, defaultMessage: string) => {
  const message = error instanceof Error ? error.message : defaultMessage;
  set({ isRefreshing: false, refreshError: message });
};

const createStoreActions = (set: any, get: any) => ({
  init: async () => {
    const state = get();
    try {
      const data = await api.getData(state.environment);
      const isAdmin = !!getAdminToken();
      set({
        ...buildDataState(data),
        isAdminLoggedIn: isAdmin,
        isLoading: false,
        isDataLoaded: true,
      });
      updateApiConfigFromData(set, data);
    } catch (e) {
      console.warn('Failed to load data from server, using mock data:', e);
      set({ isLoading: false, isDataLoaded: true });
    }
  },

  setCurrentUser: (userId: string | null) => {
    set({ currentUserId: userId });
    saveToServer(get());
  },

  setSortType: (sortType: RankingSortType) => set({ sortType }),

  addUser: (nickname: string, avatar: string) => {
    const newUser: User = {
      id: generateId(),
      nickname,
      avatar,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };
    set((state: AppState) => ({ users: [...state.users, newUser] }));
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
    set((state: AppState) => ({ users: [...state.users, newUser] }));
    saveToServer(get());
  },

  updateUser: (userId: string, nickname: string, avatar: string) => {
    set((state: AppState) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, nickname, avatar } : u
      ),
    }));
    saveToServer(get());
  },

  removeUser: (userId: string) => {
    set((state: AppState) => ({
      users: state.users.filter((u) => u.id !== userId),
      bets: state.bets.filter((b) => b.userId !== userId),
      currentUserId: state.currentUserId === userId ? null : state.currentUserId,
    }));
    saveToServer(get());
  },

  addBet: (bet: Bet) => {
    set((state: AppState) => ({ bets: [bet, ...state.bets] }));
    saveToServer(get());
  },

  removeBet: (betId: string) => {
    set((state: AppState) => ({ bets: state.bets.filter((b) => b.id !== betId) }));
    saveToServer(get());
  },

  updateBet: (betId: string, updates: Partial<Bet>) => {
    set((state: AppState) => ({
      bets: state.bets.map((b) =>
        b.id === betId ? { ...b, ...updates } : b
      ),
    }));
    saveToServer(get());
  },

  updateMatchScore: (matchId: string, homeScore: number, awayScore: number) => {
    set((state: AppState) => {
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

  importData: (json: string) => {
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
      currentUserId: DEFAULT_USER_ID,
      sortType: 'totalWin',
    });
    saveToServer(get());
  },

  setApiConfig: (config: Partial<ApiConfig>) => {
    const newConfig = { ...get().apiConfig, ...config };
    set({ apiConfig: newConfig });
    saveApiConfigToStorage(config);
    saveToServer(get());
  },

  syncMatchesFromApi: async () => {
    set({ isRefreshing: true, refreshError: null });

    try {
      const result = await api.syncMatches(get().environment);
      if (result.success) {
        // 同步成功后重新从服务器读取数据
        const data = await api.getData(get().environment);
        set({ matches: data.matches || [] });
        set({ isRefreshing: false, lastRefreshTime: new Date().toISOString() });
        return { added: result.count || 0, updated: 0 };
      }
      throw new Error(result.message || '同步失败');
    } catch (error) {
      handleRefreshError(set, error, '同步失败');
      throw error;
    }
  },

  setRefreshError: (error: string | null) => set({ refreshError: error }),

  setTheme: (theme: ThemeMode) => {
    set({ theme });
    saveThemeToStorage(theme);
    applyTheme(theme);
  },

  setDesignVersion: (version: DesignVersion) => {
    set({ designVersion: version });
    saveDesignVersionToStorage(version);
    applyDesignVersion(version);
  },

  adminLogin: async (password: string) => {
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

  changeAdminPassword: async (oldPassword: string, newPassword: string) => {
    try {
      const result = await api.changeAdminPassword(oldPassword, newPassword);
      return result.success;
    } catch (e) {
      console.warn('Change password failed:', e);
      return false;
    }
  },

  switchEnvironment: async (env: Environment) => {
    const state = get();
    if (state.environment === env) return;

    set({ environment: env, isLoading: true, isDataLoaded: false });

    try {
      const data = await api.getData(env);
      set({
        ...buildDataState(data),
        isLoading: false,
        isDataLoaded: true,
      });
      updateApiConfigFromData(set, data);
    } catch (e) {
      console.warn('Failed to load environment data from server, using mock data:', e);
      set({
        users: mockUsers,
        matches: mockMatches,
        bets: mockBets,
        currentUserId: DEFAULT_USER_ID,
        isLoading: false,
        isDataLoaded: true,
      });
    }
  },

  clearEnvironmentData: async (environment: Environment) => {
    try {
      const result = await api.clearEnvironmentData(environment);
      if (result.success) {
        const state = get();
        if (state.environment === environment) {
          set({
            users: mockUsers,
            matches: mockMatches,
            bets: mockBets,
            currentUserId: DEFAULT_USER_ID,
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

  listBackups: async (environment: Environment) => {
    try {
      const result = await api.listBackups(environment);
      return result.backups || [];
    } catch (e) {
      console.warn('Failed to list backups:', e);
      return [];
    }
  },

  createBackup: async (environment: Environment, label = 'manual') => {
    try {
      const result = await api.createBackup(environment, label);
      return result.success;
    } catch (e) {
      console.warn('Failed to create backup:', e);
      return false;
    }
  },

  restoreBackup: async (environment: Environment, filename: string) => {
    try {
      const result = await api.restoreBackup(environment, filename);
      if (result.success) {
        const state = get();
        if (state.environment === environment) {
          const data = await api.getData(environment);
          set(buildDataState(data));
        }
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Failed to restore backup:', e);
      return false;
    }
  },

  deleteBackup: async (environment: Environment, filename: string) => {
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

  refreshData: async () => {
    const state = get();
    if (state.isLoading) return;
    set({ isLoading: true });
    try {
      const data = await api.getData(state.environment);
      set({
        ...buildDataState(data),
        isLoading: false,
      });
      updateApiConfigFromData(set, data);
      await get().loadAutoRefreshSettings();
    } catch (e) {
      console.warn('Failed to refresh data:', e);
      set({ isLoading: false });
    }
  },
});

export const useAppStore = create<AppState>((set, get) => ({
  ...getInitialState(),
  ...createStoreActions(set, get),
}));
