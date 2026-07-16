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
import { api, getAdminToken, type BackupInfo, type ServerData } from '@/utils/api';

const DEFAULT_AVATAR = '⚽️';
const DEFAULT_USER_ID = 'user1';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type StoreSet = (partial: Partial<AppState> | ((state: AppState) => Partial<AppState>)) => void;
type StoreGet = () => AppState;

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
  dataError: string | null;
  saveStatus: SaveStatus;
  saveError: string | null;
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
    useAppStore.setState({ saveStatus: 'saving', saveError: null });
    await api.saveData({
      environment: state.environment,
      users: state.users,
      bets: state.bets,
      matches: state.matches,
      apiKey: state.apiConfig.apiKey,
      competition: state.apiConfig.competition,
      currentUserId: state.currentUserId,
    });
    useAppStore.setState({ saveStatus: 'saved', saveError: null });
  } catch (e) {
    console.warn('Failed to save data to server:', e);
    useAppStore.setState({
      saveStatus: 'error',
      saveError: e instanceof Error ? e.message : '保存失败，请重试',
    });
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

const getFallbackData = () => DEMO_MODE
  ? { users: mockUsers, matches: mockMatches, bets: mockBets, currentUserId: DEFAULT_USER_ID }
  : { users: [], matches: [], bets: [], currentUserId: null };

const getInitialState = (): Omit<AppState, keyof ReturnType<typeof createStoreActions>> => {
  const apiConfig = loadApiConfig();
  const theme = loadTheme();

  return {
    ...getFallbackData(),
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
    dataError: null,
    saveStatus: 'idle',
    saveError: null,
    showSettingsModal: false,
  };
};

const buildDataState = (data: ServerData) => ({
  users: Array.isArray(data.users) ? data.users : [],
  matches: Array.isArray(data.matches) ? data.matches : [],
  bets: Array.isArray(data.bets) ? data.bets : [],
  currentUserId: data.currentUserId ?? null,
});

const updateApiConfigFromData = (set: (updater: (state: AppState) => Partial<AppState>) => void, data: ServerData) => {
  if (data.competition) {
    set((s: AppState) => ({ apiConfig: { ...s.apiConfig, competition: data.competition } }));
  }
};

const handleRefreshError = (set: StoreSet, error: unknown, defaultMessage: string) => {
  const message = error instanceof Error ? error.message : defaultMessage;
  set({ isRefreshing: false, refreshError: message });
};

const createStoreActions = (set: StoreSet, get: StoreGet) => ({
  init: async () => {
    const state = get();
    try {
      const data = await api.getData(state.environment);
      let isAdmin = false;
      if (getAdminToken()) {
        try {
          isAdmin = (await api.validateAdminSession()).success;
        } catch {
          isAdmin = false;
        }
      }
      set({
        ...buildDataState(data),
        isAdminLoggedIn: isAdmin,
        isLoading: false,
        isDataLoaded: true,
        dataError: null,
      });
      updateApiConfigFromData(set, data);
    } catch (e) {
      console.warn('Failed to load data from server:', e);
      set({
        isLoading: false,
        isDataLoaded: true,
        dataError: e instanceof Error ? e.message : '无法连接数据服务',
      });
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
      if (!Array.isArray(data.users) || !Array.isArray(data.matches) || !Array.isArray(data.bets)) {
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
      users: [],
      matches: [],
      bets: [],
      currentUserId: null,
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
        dataError: null,
      });
      updateApiConfigFromData(set, data);
    } catch (e) {
      console.warn('Failed to load environment data from server:', e);
      set({
        users: [],
        matches: [],
        bets: [],
        currentUserId: null,
        isLoading: false,
        isDataLoaded: true,
        dataError: e instanceof Error ? e.message : '无法加载环境数据',
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
            users: [],
            matches: [],
            bets: [],
            currentUserId: null,
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
        dataError: null,
      });
      updateApiConfigFromData(set, data);
    } catch (e) {
      console.warn('Failed to refresh data:', e);
      set({
        isLoading: false,
        dataError: e instanceof Error ? e.message : '刷新失败，请重试',
      });
    }
  },
});

export const useAppStore = create<AppState>((set, get) => ({
  ...getInitialState(),
  ...createStoreActions(set, get),
}));
