import { loadApiConfig } from '@/utils/apiConfig';
import type { Match } from '@/types';

export interface ApiMatch {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED';
  matchday?: number;
  stage?: string;
  group?: string | null;
  homeTeam: {
    id: number;
    name: string;
    shortName?: string;
    tla?: string;
    crest?: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName?: string;
    tla?: string;
    crest?: string;
  };
  score: {
    winner?: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    duration?: string;
    fullTime?: {
      home: number | null;
      away: number | null;
    };
    halfTime?: {
      home: number | null;
      away: number | null;
    };
  };
  odds?: {
    msg?: string;
  };
  lastUpdated?: string;
}

export interface ApiMatchesResponse {
  matches: ApiMatch[];
  filters: any;
  resultSet: {
    count: number;
    competitions?: string;
    first?: string;
    last?: string;
    played?: number;
  };
}

const statusMap: Record<string, Match['status']> = {
  SCHEDULED: 'upcoming',
  LIVE: 'live',
  IN_PLAY: 'live',
  PAUSED: 'live',
  FINISHED: 'finished',
  POSTPONED: 'upcoming',
  SUSPENDED: 'upcoming',
  CANCELLED: 'upcoming',
};

const teamFlagMap: Record<string, string> = {
  'Argentina': '🇦🇷',
  'Brazil': '🇧🇷',
  'France': '🇫🇷',
  'Germany': '🇩🇪',
  'England': '🇬🇧',
  'Spain': '🇪🇸',
  'Portugal': '🇵🇹',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Italy': '🇮🇹',
  'Croatia': '🇭🇷',
  'Morocco': '🇲🇦',
  'Uruguay': '🇺🇾',
  'Colombia': '🇨🇴',
  'Japan': '🇯🇵',
  'Korea Republic': '🇰🇷',
  'South Korea': '🇰🇷',
  'Mexico': '🇲🇽',
  'USA': '🇺🇸',
  'United States': '🇺🇸',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'Saudi Arabia': '🇸🇦',
  'Qatar': '🇶🇦',
  'Ecuador': '🇪🇨',
  'Senegal': '🇸🇳',
  'Switzerland': '🇨🇭',
  'Denmark': '🇩🇰',
  'Serbia': '🇷🇸',
  'Poland': '🇵🇱',
  'Tunisia': '🇹🇳',
  'Cameroon': '🇨🇲',
  'Ghana': '🇬🇭',
  'Wales': '🇬🇧',
  'Iran': '🇮🇷',
  'Paraguay': '🇵🇾',
  'South Africa': '🇿🇦',
  'Algeria': '🇩🇿',
  'New Zealand': '🇳🇿',
  'Sweden': '🇸🇪',
  'Czechia': '🇨🇿',
  'Czech Republic': '🇨🇿',
  'Turkey': '🇹🇷',
  'Türkiye': '🇹🇷',
  'Austria': '🇦🇹',
  'Egypt': '🇪🇬',
  'Haiti': '🇭🇹',
  'Bosnia-Herzegovina': '🇧🇦',
  'Bosnia and Herzegovina': '🇧🇦',
  'Panama': '🇵🇦',
  'Cape Verde Islands': '🇨🇻',
  'Cape Verde': '🇨🇻',
  'Congo DR': '🇨🇩',
  'DR Congo': '🇨🇩',
  'Ivory Coast': '🇨🇮',
  "Côte d'Ivoire": '🇨🇮',
  'Jordan': '🇯🇴',
  'Iraq': '🇮🇶',
  'Uzbekistan': '🇺🇿',
  'Norway': '🇳🇴',
  'Scotland': '🇬🇧',
  'Curaçao': '🇨🇼',
  'Curacao': '🇨🇼',
  'Peru': '🇵🇪',
  'Chile': '🇨🇱',
  'Venezuela': '🇻🇪',
  'Bolivia': '🇧🇴',
  'Hungary': '🇭🇺',
  'Romania': '🇷🇴',
  'Greece': '🇬🇷',
  'Iceland': '🇮🇸',
  'Finland': '🇫🇮',
  'Slovakia': '🇸🇰',
  'Slovenia': '🇸🇮',
  'North Macedonia': '🇲🇰',
  'Albania': '🇦🇱',
  'Bulgaria': '🇧🇬',
  'Israel': '🇮🇱',
  'Georgia': '🇬🇪',
  'Kazakhstan': '🇰🇿',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'China PR': '🇨🇳',
  'China': '🇨🇳',
  'Syria': '🇸🇾',
  'Lebanon': '🇱🇧',
  'Kuwait': '🇰🇼',
  'Oman': '🇴🇲',
  'Bahrain': '🇧🇭',
  'United Arab Emirates': '🇦🇪',
  'UAE': '🇦🇪',
  'India': '🇮🇳',
  'Malaysia': '🇲🇾',
  'Singapore': '🇸🇬',
  'Indonesia': '🇮🇩',
  'Philippines': '🇵🇭',
  'Hong Kong': '🇭🇰',
  'Chinese Taipei': '🇹🇼',
  'Taiwan': '🇹🇼',
  'Nigeria': '🇳🇬',
  'Mali': '🇲🇱',
  'Burkina Faso': '🇧🇫',
  'Niger': '🇳🇪',
  'Guinea': '🇬🇳',
  'Gabon': '🇬🇦',
  'Angola': '🇦🇴',
  'Mozambique': '🇲🇿',
  'Zambia': '🇿🇲',
  'Zimbabwe': '🇿🇼',
  'Kenya': '🇰🇪',
  'Tanzania': '🇹🇿',
  'Uganda': '🇺🇬',
  'Rwanda': '🇷🇼',
  'Sudan': '🇸🇩',
  'Libya': '🇱🇾',
};

const teamNameMap: Record<string, string> = {
  'Argentina': '阿根廷',
  'Brazil': '巴西',
  'France': '法国',
  'Germany': '德国',
  'England': '英格兰',
  'Spain': '西班牙',
  'Portugal': '葡萄牙',
  'Netherlands': '荷兰',
  'Belgium': '比利时',
  'Italy': '意大利',
  'Croatia': '克罗地亚',
  'Morocco': '摩洛哥',
  'Uruguay': '乌拉圭',
  'Colombia': '哥伦比亚',
  'Japan': '日本',
  'Korea Republic': '韩国',
  'South Korea': '韩国',
  'Mexico': '墨西哥',
  'USA': '美国',
  'United States': '美国',
  'Canada': '加拿大',
  'Australia': '澳大利亚',
  'Saudi Arabia': '沙特阿拉伯',
  'Qatar': '卡塔尔',
  'Ecuador': '厄瓜多尔',
  'Senegal': '塞内加尔',
  'Switzerland': '瑞士',
  'Denmark': '丹麦',
  'Serbia': '塞尔维亚',
  'Poland': '波兰',
  'Tunisia': '突尼斯',
  'Cameroon': '喀麦隆',
  'Ghana': '加纳',
  'Wales': '威尔士',
  'Iran': '伊朗',
  'Paraguay': '巴拉圭',
  'South Africa': '南非',
  'Algeria': '阿尔及利亚',
  'New Zealand': '新西兰',
  'Sweden': '瑞典',
  'Czechia': '捷克',
  'Czech Republic': '捷克',
  'Turkey': '土耳其',
  'Türkiye': '土耳其',
  'Austria': '奥地利',
  'Egypt': '埃及',
  'Haiti': '海地',
  'Bosnia-Herzegovina': '波黑',
  'Bosnia and Herzegovina': '波黑',
  'Panama': '巴拿马',
  'Cape Verde Islands': '佛得角',
  'Cape Verde': '佛得角',
  'Congo DR': '刚果(金)',
  'DR Congo': '刚果(金)',
  'Ivory Coast': '科特迪瓦',
  "Côte d'Ivoire": '科特迪瓦',
  'Jordan': '约旦',
  'Iraq': '伊拉克',
  'Uzbekistan': '乌兹别克斯坦',
  'Norway': '挪威',
  'Scotland': '苏格兰',
  'Curaçao': '库拉索',
  'Curacao': '库拉索',
  'Peru': '秘鲁',
  'Chile': '智利',
  'Venezuela': '委内瑞拉',
  'Bolivia': '玻利维亚',
  'Hungary': '匈牙利',
  'Romania': '罗马尼亚',
  'Greece': '希腊',
  'Iceland': '冰岛',
  'Finland': '芬兰',
  'Slovakia': '斯洛伐克',
  'Slovenia': '斯洛文尼亚',
  'North Macedonia': '北马其顿',
  'Albania': '阿尔巴尼亚',
  'Bulgaria': '保加利亚',
  'Israel': '以色列',
  'Georgia': '格鲁吉亚',
  'Kazakhstan': '哈萨克斯坦',
  'Thailand': '泰国',
  'Vietnam': '越南',
  'China PR': '中国',
  'China': '中国',
  'Syria': '叙利亚',
  'Lebanon': '黎巴嫩',
  'Kuwait': '科威特',
  'Oman': '阿曼',
  'Bahrain': '巴林',
  'United Arab Emirates': '阿联酋',
  'UAE': '阿联酋',
  'India': '印度',
  'Malaysia': '马来西亚',
  'Singapore': '新加坡',
  'Indonesia': '印度尼西亚',
  'Philippines': '菲律宾',
  'Hong Kong': '中国香港',
  'Chinese Taipei': '中国台北',
  'Taiwan': '中国台北',
  'Nigeria': '尼日利亚',
  'Mali': '马里',
  'Burkina Faso': '布基纳法索',
  'Niger': '尼日尔',
  'Guinea': '几内亚',
  'Gabon': '加蓬',
  'Angola': '安哥拉',
  'Mozambique': '莫桑比克',
  'Zambia': '赞比亚',
  'Zimbabwe': '津巴布韦',
  'Kenya': '肯尼亚',
  'Tanzania': '坦桑尼亚',
  'Uganda': '乌干达',
  'Rwanda': '卢旺达',
  'Sudan': '苏丹',
  'Libya': '利比亚',
};

const getTeamFlag = (teamName: string): string => teamFlagMap[teamName] || '⚽️';

const getTeamChineseName = (teamName: string): string => teamNameMap[teamName] || teamName;

const extractStageInfo = (apiMatch: ApiMatch): { stage: Match['stage']; groupName?: string } => {
  if (apiMatch.stage === 'GROUP_STAGE') {
    return {
      stage: 'group',
      groupName: apiMatch.group?.replace('Group ', '') || undefined,
    };
  }
  return { stage: 'knockout' };
};

const apiMatchToLocal = (apiMatch: ApiMatch): Match => {
  const { stage, groupName } = extractStageInfo(apiMatch);
  const status = statusMap[apiMatch.status] || 'upcoming';

  const hasScore = status === 'finished' || status === 'live';
  const scoreData = apiMatch.score.fullTime?.home !== null
    ? apiMatch.score.fullTime
    : apiMatch.score.halfTime;

  const homeScore = hasScore ? (scoreData?.home ?? null) : null;
  const awayScore = hasScore ? (scoreData?.away ?? null) : null;

  const homeTeamCn = getTeamChineseName(apiMatch.homeTeam.name);
  const awayTeamCn = getTeamChineseName(apiMatch.awayTeam.name);

  return {
    id: `api_${apiMatch.id}`,
    homeTeam: homeTeamCn,
    awayTeam: awayTeamCn,
    homeFlag: getTeamFlag(apiMatch.homeTeam.name),
    awayFlag: getTeamFlag(apiMatch.awayTeam.name),
    matchTime: apiMatch.utcDate,
    stage,
    groupName,
    homeScore,
    awayScore,
    status,
  };
};

export interface RateLimitInfo {
  requestsAvailable: number | null;
  requestsLimit: number | null;
  requestsReset: string | null;
}

let lastRateLimitInfo: RateLimitInfo = {
  requestsAvailable: null,
  requestsLimit: null,
  requestsReset: null,
};

export const getRateLimitInfo = (): RateLimitInfo => lastRateLimitInfo;

const updateRateLimitFromHeaders = (headers: Headers) => {
  const available = headers.get('X-Requests-Available');
  const limit = headers.get('X-Requests-Limit');
  const reset = headers.get('X-Requests-Reset');

  lastRateLimitInfo = {
    requestsAvailable: available ? parseInt(available) : null,
    requestsLimit: limit ? parseInt(limit) : null,
    requestsReset: reset,
  };
};

const getNetworkErrorMessage = (): string => {
  if (import.meta.env.DEV) {
    return '网络连接失败，请检查网络连接。如果是开发环境，请确保已启动开发服务器';
  }
  return '网络连接失败，请检查服务器网络连接';
};

const handleRequestError = (error: unknown): never => {
  if (error instanceof Error) {
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
      throw new Error(getNetworkErrorMessage());
    }
    throw error;
  }
  throw new Error('网络请求失败');
};

const buildApiUrl = (baseUrl: string, path: string, apiKey: string): string => {
  const separator = path.includes('?') ? '&' : '?';
  return `${baseUrl}/${path}${separator}apiKey=${apiKey}`;
};

const fetchFootballApi = async <T>(
  path: string,
  options: { updateRateLimit?: boolean; detailedErrors?: boolean } = {}
): Promise<T> => {
  const { updateRateLimit = true, detailedErrors = true } = options;
  const config = loadApiConfig();

  if (!config.apiKey) {
    throw new Error('请先配置 API Key');
  }

  const url = buildApiUrl(config.baseUrl, path, config.apiKey);

  try {
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': config.apiKey,
      },
    });

    if (updateRateLimit) {
      updateRateLimitFromHeaders(response.headers);
    }

    if (!response.ok) {
      if (!detailedErrors) {
        throw new Error(`请求失败: ${response.status}`);
      }
      if (response.status === 403) {
        throw new Error('API Key 无效或已过期，请检查你的 API Key 是否正确');
      }
      if (response.status === 429) {
        const resetTime = lastRateLimitInfo.requestsReset;
        const resetMsg = resetTime ? `，将于 ${new Date(resetTime).toLocaleTimeString('zh-CN')} 重置` : '';
        throw new Error(`请求过于频繁${resetMsg}，请稍后再试`);
      }
      if (response.status === 404) {
        throw new Error('赛事不存在，请选择正确的赛事');
      }
      throw new Error(`请求失败: HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    handleRequestError(error);
  }
};

export const fetchMatchesFromApi = async (
  competitionId: string = '2000'
): Promise<Match[]> => {
  const data = await fetchFootballApi<ApiMatchesResponse>(
    `competitions/${competitionId}/matches`
  );
  return data.matches.map(apiMatchToLocal);
};

export const fetchLiveMatches = async (): Promise<Match[]> => {
  const data = await fetchFootballApi<ApiMatchesResponse>(
    'matches?status=LIVE,IN_PLAY'
  );
  return data.matches.map(apiMatchToLocal);
};

export const getCompetitions = async (): Promise<Array<{ id: string; name: string }>> => {
  const data = await fetchFootballApi<any>(
    'competitions?plan=TIER_ONE',
    { updateRateLimit: false, detailedErrors: false }
  );
  return data.competitions.map((c: any) => ({
    id: String(c.id),
    name: c.name,
  }));
};
