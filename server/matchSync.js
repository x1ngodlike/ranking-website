// 赛程自动同步模块 - 服务器端定时同步 football-data.org 数据

const FOOTBALL_API_BASE = 'https://api.football-data.org/v4/';

const statusMap = {
  SCHEDULED: 'upcoming',
  LIVE: 'live',
  IN_PLAY: 'live',
  PAUSED: 'live',
  FINISHED: 'finished',
  POSTPONED: 'upcoming',
  SUSPENDED: 'upcoming',
  CANCELLED: 'upcoming',
};

const teamFlagMap = {
  'Argentina': '🇦🇷', 'Brazil': '🇧🇷', 'France': '🇫🇷', 'Germany': '🇩🇪',
  'England': '🇬🇧', 'Spain': '🇪🇸', 'Portugal': '🇵🇹', 'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪', 'Italy': '🇮🇹', 'Croatia': '🇭🇷', 'Morocco': '🇲🇦',
  'Uruguay': '🇺🇾', 'Colombia': '🇨🇴', 'Japan': '🇯🇵', 'Korea Republic': '🇰🇷',
  'South Korea': '🇰🇷', 'Mexico': '🇲🇽', 'USA': '🇺🇸', 'United States': '🇺🇸',
  'Canada': '🇨🇦', 'Australia': '🇦🇺', 'Saudi Arabia': '🇸🇦', 'Qatar': '🇶🇦',
  'Ecuador': '🇪🇨', 'Senegal': '🇸🇳', 'Switzerland': '🇨🇭', 'Denmark': '🇩🇰',
  'Serbia': '🇷🇸', 'Poland': '🇵🇱', 'Tunisia': '🇹🇳', 'Cameroon': '🇨🇲',
  'Ghana': '🇬🇭', 'Wales': '🇬🇧', 'Iran': '🇮🇷', 'Paraguay': '🇵🇾',
  'South Africa': '🇿🇦', 'Algeria': '🇩🇿', 'New Zealand': '🇳🇿', 'Sweden': '🇸🇪',
  'Czechia': '🇨🇿', 'Czech Republic': '🇨🇿', 'Turkey': '🇹🇷', 'Türkiye': '🇹🇷',
  'Austria': '🇦🇹', 'Egypt': '🇪🇬', 'Haiti': '🇭🇹',
  'Bosnia-Herzegovina': '🇧🇦', 'Bosnia and Herzegovina': '🇧🇦',
  'Panama': '🇵🇦', 'Cape Verde Islands': '🇨🇻', 'Cape Verde': '🇨🇻',
  'Congo DR': '🇨🇩', 'DR Congo': '🇨🇩', 'Ivory Coast': '🇨🇮',
  "Côte d'Ivoire": '🇨🇮', 'Jordan': '🇯🇴', 'Iraq': '🇮🇶', 'Uzbekistan': '🇺🇿',
  'Norway': '🇳🇴', 'Scotland': '🇬🇧', 'Curaçao': '🇨🇼', 'Curacao': '🇨🇼',
  'Peru': '🇵🇪', 'Chile': '🇨🇱', 'Venezuela': '🇻🇪', 'Bolivia': '🇧🇴',
  'Hungary': '🇭🇺', 'Romania': '🇷🇴', 'Greece': '🇬🇷', 'Iceland': '🇮🇸',
  'Finland': '🇫🇮', 'Slovakia': '🇸🇰', 'Slovenia': '🇸🇮',
  'North Macedonia': '🇲🇰', 'Albania': '🇦🇱', 'Bulgaria': '🇧🇬',
  'Israel': '🇮🇱', 'Georgia': '🇬🇪', 'Kazakhstan': '🇰🇿',
  'Thailand': '🇹🇭', 'Vietnam': '🇻🇳', 'China PR': '🇨🇳', 'China': '🇨🇳',
  'Syria': '🇸🇾', 'Lebanon': '🇱🇧', 'Kuwait': '🇰🇼', 'Oman': '🇴🇲',
  'Bahrain': '🇧🇭', 'United Arab Emirates': '🇦🇪', 'UAE': '🇦🇪',
  'India': '🇮🇳', 'Malaysia': '🇲🇾', 'Singapore': '🇸🇬',
  'Indonesia': '🇮🇩', 'Philippines': '🇵🇭', 'Hong Kong': '🇭🇰',
  'Chinese Taipei': '🇹🇼', 'Taiwan': '🇹🇼', 'Nigeria': '🇳🇬',
  'Mali': '🇲🇱', 'Burkina Faso': '🇧🇫', 'Niger': '🇳🇪', 'Guinea': '🇬🇳',
  'Gabon': '🇬🇦', 'Angola': '🇦🇴', 'Mozambique': '🇲🇿', 'Zambia': '🇿🇲',
  'Zimbabwe': '🇿🇼', 'Kenya': '🇰🇪', 'Tanzania': '🇹🇿', 'Uganda': '🇺🇬',
  'Rwanda': '🇷🇼', 'Sudan': '🇸🇩', 'Libya': '🇱🇾',
};

const teamNameMap = {
  'Argentina': '阿根廷', 'Brazil': '巴西', 'France': '法国', 'Germany': '德国',
  'England': '英格兰', 'Spain': '西班牙', 'Portugal': '葡萄牙', 'Netherlands': '荷兰',
  'Belgium': '比利时', 'Italy': '意大利', 'Croatia': '克罗地亚', 'Morocco': '摩洛哥',
  'Uruguay': '乌拉圭', 'Colombia': '哥伦比亚', 'Japan': '日本',
  'Korea Republic': '韩国', 'South Korea': '韩国', 'Mexico': '墨西哥',
  'USA': '美国', 'United States': '美国', 'Canada': '加拿大',
  'Australia': '澳大利亚', 'Saudi Arabia': '沙特阿拉伯', 'Qatar': '卡塔尔',
  'Ecuador': '厄瓜多尔', 'Senegal': '塞内加尔', 'Switzerland': '瑞士',
  'Denmark': '丹麦', 'Serbia': '塞尔维亚', 'Poland': '波兰', 'Tunisia': '突尼斯',
  'Cameroon': '喀麦隆', 'Ghana': '加纳', 'Wales': '威尔士', 'Iran': '伊朗',
  'Paraguay': '巴拉圭', 'South Africa': '南非', 'Algeria': '阿尔及利亚',
  'New Zealand': '新西兰', 'Sweden': '瑞典', 'Czechia': '捷克',
  'Czech Republic': '捷克', 'Turkey': '土耳其', 'Türkiye': '土耳其',
  'Austria': '奥地利', 'Egypt': '埃及', 'Haiti': '海地',
  'Bosnia-Herzegovina': '波黑', 'Bosnia and Herzegovina': '波黑',
  'Panama': '巴拿马', 'Cape Verde Islands': '佛得角', 'Cape Verde': '佛得角',
  'Congo DR': '刚果(金)', 'DR Congo': '刚果(金)', 'Ivory Coast': '科特迪瓦',
  "Côte d'Ivoire": '科特迪瓦', 'Jordan': '约旦', 'Iraq': '伊拉克',
  'Uzbekistan': '乌兹别克斯坦', 'Norway': '挪威', 'Scotland': '苏格兰',
  'Curaçao': '库拉索', 'Curacao': '库拉索', 'Peru': '秘鲁', 'Chile': '智利',
  'Venezuela': '委内瑞拉', 'Bolivia': '玻利维亚', 'Hungary': '匈牙利',
  'Romania': '罗马尼亚', 'Greece': '希腊', 'Iceland': '冰岛',
  'Finland': '芬兰', 'Slovakia': '斯洛伐克', 'Slovenia': '斯洛文尼亚',
  'North Macedonia': '北马其顿', 'Albania': '阿尔巴尼亚', 'Bulgaria': '保加利亚',
  'Israel': '以色列', 'Georgia': '格鲁吉亚', 'Kazakhstan': '哈萨克斯坦',
  'Thailand': '泰国', 'Vietnam': '越南', 'China PR': '中国', 'China': '中国',
  'Syria': '叙利亚', 'Lebanon': '黎巴嫩', 'Kuwait': '科威特', 'Oman': '阿曼',
  'Bahrain': '巴林', 'United Arab Emirates': '阿联酋', 'UAE': '阿联酋',
  'India': '印度', 'Malaysia': '马来西亚', 'Singapore': '新加坡',
  'Indonesia': '印度尼西亚', 'Philippines': '菲律宾', 'Hong Kong': '中国香港',
  'Chinese Taipei': '中国台北', 'Taiwan': '中国台北', 'Nigeria': '尼日利亚',
  'Mali': '马里', 'Burkina Faso': '布基纳法索', 'Niger': '尼日尔',
  'Guinea': '几内亚', 'Gabon': '加蓬', 'Angola': '安哥拉',
  'Mozambique': '莫桑比克', 'Zambia': '赞比亚', 'Zimbabwe': '津巴布韦',
  'Kenya': '肯尼亚', 'Tanzania': '坦桑尼亚', 'Uganda': '乌干达',
  'Rwanda': '卢旺达', 'Sudan': '苏丹', 'Libya': '利比亚',
};

const getTeamFlag = (name) => teamFlagMap[name] || '⚽️';
const getTeamChineseName = (name) => teamNameMap[name] || name;

const extractStageInfo = (apiMatch) => {
  if (apiMatch.stage === 'GROUP_STAGE') {
    return {
      stage: 'group',
      groupName: apiMatch.group?.replace('Group ', '') || undefined,
      roundKey: undefined,
      originalStage: apiMatch.stage,
    };
  }
  
  const stageMap = {
    'LAST_32': 'round_of_32',
    'LAST_16': 'round_of_16',
    'QUARTER_FINALS': 'quarter_final',
    'SEMI_FINALS': 'semi_final',
    'FINAL': 'final',
    'THIRD_PLACE': 'third_place',
  };
  
  return { 
    stage: 'knockout',
    roundKey: stageMap[apiMatch.stage] || 'round_of_32',
    originalStage: apiMatch.stage,
  };
};

const apiMatchToLocal = (apiMatch) => {
  const { stage, groupName, roundKey, originalStage } = extractStageInfo(apiMatch);
  const status = statusMap[apiMatch.status] || 'upcoming';

  const hasScore = status === 'finished' || status === 'live';
  
  const extraTime = apiMatch.score.extraTime;
  const penalties = apiMatch.score.penalties;
  
  let homeScore = null;
  let awayScore = null;
  let homePenaltyScore = null;
  let awayPenaltyScore = null;

  if (hasScore) {
    const fullTime = apiMatch.score.fullTime;
    const halfTime = apiMatch.score.halfTime;
    
    const ftHome = fullTime?.home ?? null;
    const ftAway = fullTime?.away ?? null;
    const etHome = extraTime?.home ?? 0;
    const etAway = extraTime?.away ?? 0;
    const pHome = penalties?.home ?? 0;
    const pAway = penalties?.away ?? 0;

    if (ftHome !== null) {
      homeScore = ftHome - etHome - pHome;
    } else if (halfTime?.home !== null) {
      homeScore = halfTime.home;
    }

    if (ftAway !== null) {
      awayScore = ftAway - etAway - pAway;
    } else if (halfTime?.away !== null) {
      awayScore = halfTime.away;
    }

    homePenaltyScore = penalties?.home ?? null;
    awayPenaltyScore = penalties?.away ?? null;
  }

  return {
    id: `api_${apiMatch.id}`,
    homeTeam: getTeamChineseName(apiMatch.homeTeam.name),
    awayTeam: getTeamChineseName(apiMatch.awayTeam.name),
    homeFlag: getTeamFlag(apiMatch.homeTeam.name),
    awayFlag: getTeamFlag(apiMatch.awayTeam.name),
    matchTime: apiMatch.utcDate,
    stage,
    groupName,
    roundKey,
    originalStage,
    homeScore,
    awayScore,
    homePenaltyScore,
    awayPenaltyScore,
    status,
    matchNumber: apiMatch.matchNumber ? String(apiMatch.matchNumber) : undefined,
  };
};

const hasLiveMatches = (matches) => {
  return matches.some((m) => m.status === 'live');
};

const syncMatches = async (apiKey, competitionId = '2000') => {
  if (!apiKey) {
    console.warn('[MatchSync] No API key, skipping sync');
    return { success: false, reason: 'no_api_key' };
  }

  const url = `${FOOTBALL_API_BASE}competitions/${competitionId}/matches`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': apiKey,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[MatchSync] API returned ${response.status}`);
      return { success: false, reason: `http_${response.status}` };
    }

    const data = await response.json();
    if (!data.matches || !Array.isArray(data.matches)) {
      console.warn('[MatchSync] Invalid API response');
      return { success: false, reason: 'invalid_response' };
    }

    const matches = data.matches.map(apiMatchToLocal);
    
    const roundOrder = {
      'round_of_32': 1,
      'round_of_16': 2,
      'quarter_final': 3,
      'semi_final': 4,
      'final': 5,
      'third_place': 6,
    };
    
    const roundOf32 = matches.filter(m => m.roundKey === 'round_of_32');
    const roundOf16 = matches.filter(m => m.roundKey === 'round_of_16');
    
    const teamToMatch = new Map();
    roundOf32.forEach(match => {
      if (match.homeTeam && match.homeTeam !== '待定') {
        teamToMatch.set(match.homeTeam, match);
      }
      if (match.awayTeam && match.awayTeam !== '待定') {
        teamToMatch.set(match.awayTeam, match);
      }
    });
    
    const sorted32 = [];
    const usedIds = new Set();
    const idSorted32 = [...roundOf32].sort((a, b) => {
      const idA = parseInt(a.id.replace('api_', '') || '0', 10);
      const idB = parseInt(b.id.replace('api_', '') || '0', 10);
      return idA - idB;
    });
    
    roundOf16.sort((a, b) => {
      const idA = parseInt(a.id.replace('api_', '') || '0', 10);
      const idB = parseInt(b.id.replace('api_', '') || '0', 10);
      return idA - idB;
    }).forEach(nextMatch => {
      const homeTeam = nextMatch.homeTeam && nextMatch.homeTeam !== 'None' ? nextMatch.homeTeam : null;
      const awayTeam = nextMatch.awayTeam && nextMatch.awayTeam !== 'None' ? nextMatch.awayTeam : null;
      
      let added = 0;
      if (homeTeam && teamToMatch.has(homeTeam)) {
        const homeMatch = teamToMatch.get(homeTeam);
        if (!usedIds.has(homeMatch.id)) {
          sorted32.push(homeMatch);
          usedIds.add(homeMatch.id);
          added++;
        }
      }
      
      if (awayTeam && teamToMatch.has(awayTeam)) {
        const awayMatch = teamToMatch.get(awayTeam);
        if (!usedIds.has(awayMatch.id)) {
          sorted32.push(awayMatch);
          usedIds.add(awayMatch.id);
          added++;
        }
      }
      
      const needed = 2 - added;
      for (let i = 0; i < needed; i++) {
        const nextUnused = idSorted32.find(m => !usedIds.has(m.id));
        if (nextUnused) {
          sorted32.push(nextUnused);
          usedIds.add(nextUnused.id);
        }
      }
    });
    
    matches.sort((a, b) => {
      if (a.stage === 'knockout' && b.stage === 'knockout') {
        if (a.roundKey === 'round_of_32' && b.roundKey === 'round_of_32') {
          const idxA = sorted32.findIndex(m => m.id === a.id);
          const idxB = sorted32.findIndex(m => m.id === b.id);
          return idxA - idxB;
        }
        const orderA = roundOrder[a.roundKey] || 1;
        const orderB = roundOrder[b.roundKey] || 1;
        if (orderA !== orderB) return orderA - orderB;
        const idA = parseInt(a.id.replace('api_', '') || '0', 10);
        const idB = parseInt(b.id.replace('api_', '') || '0', 10);
        return idA - idB;
      }
      return new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime();
    });
    
    console.log(`[MatchSync] Synced ${matches.length} matches, ${matches.filter(m => m.status === 'live').length} live`);
    return { success: true, matches };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn('[MatchSync] Request timeout');
      return { success: false, reason: 'timeout' };
    }
    console.error('[MatchSync] Error:', error.message);
    return { success: false, reason: 'network_error' };
  }
};

module.exports = { syncMatches, hasLiveMatches };
