export interface ApiConfig {
  provider: 'football-data-org' | 'custom';
  apiKey: string;
  baseUrl: string;
  autoRefresh: boolean;
  refreshInterval: number;
  competition: string;
}

const CONFIG_KEY = 'wc_betting_api_config';

const isDev = import.meta.env.DEV;

const defaultConfig: ApiConfig = {
  provider: 'football-data-org',
  apiKey: '',
  baseUrl: isDev ? '/football-api/v4' : 'https://api.football-data.org/v4',
  autoRefresh: false,
  refreshInterval: 60,
  competition: '2000',
};

export const loadApiConfig = (): ApiConfig => {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const baseUrl = isDev ? '/football-api/v4' : (parsed.baseUrl || defaultConfig.baseUrl);
      return { ...defaultConfig, ...parsed, baseUrl };
    }
  } catch (e) {
    console.error('Failed to load API config:', e);
  }
  return defaultConfig;
};

export const saveApiConfig = (config: Partial<ApiConfig>): void => {
  try {
    const current = loadApiConfig();
    const merged = { ...current, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('Failed to save API config:', e);
  }
};

export const getDefaultConfig = (): ApiConfig => defaultConfig;
