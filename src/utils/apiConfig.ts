export interface ApiConfig {
  provider: 'football-data-org' | 'custom';
  apiKey: string;
  baseUrl: string;
  autoRefresh: boolean;
  competition: string;
}

const CONFIG_KEY = 'wc_betting_api_config';

const isDev = import.meta.env.DEV;

const defaultConfig: ApiConfig = {
  provider: 'football-data-org',
  apiKey: '',
  baseUrl: isDev ? '/football-api/v4' : '/api/proxy/football',
  autoRefresh: true,
  competition: '2000',
};

export const loadApiConfig = (): ApiConfig => {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 生产环境使用代理URL，开发环境使用配置的URL
      const baseUrl = isDev ? (parsed.baseUrl || defaultConfig.baseUrl) : '/api/proxy/football';
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
