import type { Bet } from '../types';

export interface ParsedMatch {
  homeTeam: string;
  awayTeam: string;
  playType: string;
  isWin: boolean;
}

export interface ParsedAIComment {
  matches: ParsedMatch[];
  comment: string;
  principal?: number;
  winAmount?: number;
  maxWin?: number;
}

const PLAY_TYPES = [
  '胜平负',
  '让球胜平负',
  '比分',
  '总进球数',
  '半全场',
];

const TEAM_NAME_ALIASES: Record<string, string> = {
  '沙特阿拉伯': '沙特',
  '沙特阿拉伯队': '沙特',
  '德意志': '德国',
  '德国队': '德国',
  '法国队': '法国',
  '阿根廷队': '阿根廷',
  '巴西队': '巴西',
  '西班牙队': '西班牙',
  '英格兰队': '英格兰',
  '葡萄牙队': '葡萄牙',
  '荷兰队': '荷兰',
  '日本队': '日本',
  '韩国队': '韩国',
  '美国队': '美国',
  '墨西哥队': '墨西哥',
  '加拿大队': '加拿大',
  '澳大利亚队': '澳大利亚',
  '摩洛哥队': '摩洛哥',
  '塞内加尔队': '塞内加尔',
  '突尼斯队': '突尼斯',
  '喀麦隆队': '喀麦隆',
  '加纳队': '加纳',
  '瑞士队': '瑞士',
  '塞尔维亚队': '塞尔维亚',
  '波兰队': '波兰',
  '丹麦队': '丹麦',
  '瑞典队': '瑞典',
  '挪威队': '挪威',
  '奥地利队': '奥地利',
  '捷克队': '捷克',
  '匈牙利队': '匈牙利',
  '苏格兰队': '苏格兰',
  '威尔士队': '威尔士',
  '爱尔兰队': '爱尔兰',
  '冰岛队': '冰岛',
  '芬兰队': '芬兰',
  '罗马尼亚队': '罗马尼亚',
  '斯洛伐克队': '斯洛伐克',
  '斯洛文尼亚队': '斯洛文尼亚',
  '波斯尼亚': '波黑',
  '黑山队': '黑山',
  '阿尔巴尼亚队': '阿尔巴尼亚',
  '北马其顿队': '北马其顿',
  '保加利亚队': '保加利亚',
  '希腊队': '希腊',
  '土耳其队': '土耳其',
  '以色列队': '以色列',
  '埃及队': '埃及',
  '尼日利亚队': '尼日利亚',
  '科特迪瓦队': '科特迪瓦',
  '南非队': '南非',
  '哥斯达黎加队': '哥斯达黎加',
  '洪都拉斯队': '洪都拉斯',
  '巴拿马队': '巴拿马',
  '牙买加队': '牙买加',
  '厄瓜多尔队': '厄瓜多尔',
  '秘鲁队': '秘鲁',
  '智利队': '智利',
  '巴拉圭队': '巴拉圭',
  '玻利维亚队': '玻利维亚',
  '委内瑞拉队': '委内瑞拉',
  '新西兰队': '新西兰',
  '中国队': '中国',
  '中国国家队': '中国',
  '国足': '中国',
  '乌拉圭队': '乌拉圭',
  '哥伦比亚队': '哥伦比亚',
  '卡塔尔国家队': '卡塔尔',
  '伊朗队': '伊朗',
  '意大利队': '意大利',
  '比利时队': '比利时',
  '克罗地亚队': '克罗地亚',
  '佛得角队': '佛得角',
  '阿尔及利亚队': '阿尔及利亚',
  '刚果(金)队': '刚果(金)',
  '刚果民主共和国': '刚果(金)',
  '刚果金': '刚果(金)',
  '乌兹别克斯坦队': '乌兹别克斯坦',
  '约旦队': '约旦',
};

function normalizeTeamName(name: string): string {
  if (!name) return name;
  const trimmed = name.trim();
  if (TEAM_FLAGS[trimmed]) return trimmed;
  if (TEAM_NAME_ALIASES[trimmed]) return TEAM_NAME_ALIASES[trimmed];

  for (const [alias, standard] of Object.entries(TEAM_NAME_ALIASES)) {
    if (trimmed.includes(alias)) {
      return standard;
    }
  }
  return trimmed;
}

function detectPlayType(text: string): string {
  // 优先从 "| 玩法类型：选项 | 比分" 格式中提取玩法类型
  // 例如：加拿大 vs 摩洛哥 | 总进球数：(2)@2.900元 | 比分0:3 → ❌错
  const playTypeMatch = text.match(/\|\s*(.+?)[：:]/);
  if (playTypeMatch) {
    const playTypePart = playTypeMatch[1].trim().replace(/[（(].*?[）)]/g, '').trim();
    if (PLAY_TYPES.includes(playTypePart)) {
      return playTypePart;
    }
  }

  // 回退到关键词匹配
  for (const type of PLAY_TYPES) {
    if (text.includes(type)) {
      return type;
    }
  }

  const playMatch = text.match(/玩法[：:]\s*(.+?)@/);
  if (playMatch) {
    const option = playMatch[1].trim();

    if (option.match(/^\(\d+:\d+\)/)) {
      return '比分';
    }

    if (option.match(/^\(\d+:\d+\)\+\(\d+:\d+\)/)) {
      return '比分';
    }

    if (option.match(/^\d+\+\d+/)) {
      return '总进球数';
    }

    if (option.match(/^\d+$/)) {
      return '总进球数';
    }

    const halfFullPatterns = ['胜胜', '胜平', '胜负', '平胜', '平平', '平负', '负胜', '负平', '负负'];
    if (halfFullPatterns.includes(option)) {
      return '半全场';
    }

    if (option.match(/^[胜负平]{2}$/)) {
      return '半全场';
    }

    if (option.includes('让')) {
      return '让球胜平负';
    }

    if (option.match(/^[胜负平]$/)) {
      return '胜平负';
    }

    if (option.match(/^[胜负平]\+[胜负平]/)) {
      return '胜平负';
    }
  }

  if (text.includes('胜') && text.includes('@') && !text.includes('平') && !text.includes('负')) {
    return '胜平负';
  }

  return '其他';
}

export function parseAIComment(aiComment: string): ParsedAIComment | null {
  if (!aiComment) return null;

  const lines = aiComment.split('\n').map((l) => l.trim()).filter(Boolean);
  const matches: ParsedMatch[] = [];
  let comment = '';
  let principal: number | undefined;
  let winAmount: number | undefined;
  let maxWin: number | undefined;

  let inCommentSection = false;

  for (const line of lines) {
    if (line.includes('💬') || line.includes('点评')) {
      inCommentSection = true;
      continue;
    }

    if (inCommentSection) {
      if (line && !line.startsWith('📋') && !line.startsWith('🔗') && !line.startsWith('💰')) {
        comment += (comment ? ' ' : '') + line;
      }
      continue;
    }

    const vsMatch = line.match(/(.+?)\s*vs\s*(.+?)\s*[|｜]/);
    if (vsMatch) {
      const homeTeam = normalizeTeamName(vsMatch[1].trim());
      const awayTeam = normalizeTeamName(vsMatch[2].trim());
      const playType = detectPlayType(line);
      const isWin = line.includes('✅') || line.includes('中');
      matches.push({ homeTeam, awayTeam, playType, isWin });
    }

    const principalMatch = line.match(/本金[：:]\s*[¥￥]?\s*(\d+\.?\d*)/);
    if (principalMatch) {
      principal = parseFloat(principalMatch[1]);
    }

    const winMatch = line.match(/中奖[：:]\s*[¥￥]?\s*(\d+\.?\d*)/);
    if (winMatch) {
      winAmount = parseFloat(winMatch[1]);
    }

    const maxMatch = line.match(/最高[¥￥]?\s*(\d+\.?\d*)/);
    if (maxMatch) {
      maxWin = parseFloat(maxMatch[1]);
    }
  }

  return {
    matches,
    comment: comment.trim(),
    principal,
    winAmount,
    maxWin,
  };
}

export interface TeamStats {
  name: string;
  flag?: string;
  winCount: number;
  totalCount: number;
}

export interface PlayTypeStats {
  type: string;
  winCount: number;
  totalCount: number;
}

export function calculateTeamStats(bets: Bet[]): TeamStats[] {
  const teamMap = new Map<string, { winCount: number; totalCount: number }>();

  bets.forEach((bet) => {
    if (!bet.aiComment) return;
    const parsed = parseAIComment(bet.aiComment);
    if (!parsed) return;

    parsed.matches.forEach((m) => {
      [m.homeTeam, m.awayTeam].forEach((team) => {
        const existing = teamMap.get(team) || { winCount: 0, totalCount: 0 };
        existing.totalCount++;
        if (m.isWin) {
          existing.winCount++;
        }
        teamMap.set(team, existing);
      });
    });
  });

  return Array.from(teamMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.winCount - a.winCount || b.totalCount - a.totalCount);
}

export function calculatePlayTypeStats(bets: Bet[]): PlayTypeStats[] {
  const typeMap = new Map<string, { winCount: number; totalCount: number }>();

  bets.forEach((bet) => {
    if (!bet.aiComment) return;
    const parsed = parseAIComment(bet.aiComment);
    if (!parsed) return;

    parsed.matches.forEach((m) => {
      const existing = typeMap.get(m.playType) || { winCount: 0, totalCount: 0 };
      existing.totalCount++;
      if (m.isWin) {
        existing.winCount++;
      }
      typeMap.set(m.playType, existing);
    });
  });

  return Array.from(typeMap.entries())
    .map(([type, stats]) => ({ type, ...stats }))
    .sort((a, b) => b.winCount - a.winCount || b.totalCount - a.totalCount);
}

export function getBestAIComment(bets: Bet[]): string | null {
  const winBets = bets.filter(
    (b) => b.aiComment && (b.winAmount ?? 0) > 0
  );

  if (winBets.length === 0) return null;

  const best = winBets.sort((a, b) => (b.winAmount ?? 0) - (a.winAmount ?? 0))[0];
  const parsed = parseAIComment(best.aiComment!);
  return parsed?.comment || null;
}

export function getTotalWinMatches(bets: Bet[]): number {
  let count = 0;
  bets.forEach((bet) => {
    if (!bet.aiComment) return;
    const parsed = parseAIComment(bet.aiComment);
    if (!parsed) return;
    count += parsed.matches.filter((m) => m.isWin).length;
  });
  return count;
}

const TEAM_FLAGS: Record<string, string> = {
  '阿根廷': '🇦🇷',
  '法国': '🇫🇷',
  '巴西': '🇧🇷',
  '德国': '🇩🇪',
  '西班牙': '🇪🇸',
  '英格兰': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  '葡萄牙': '🇵🇹',
  '荷兰': '🇳🇱',
  '意大利': '🇮🇹',
  '比利时': '🇧🇪',
  '克罗地亚': '🇭🇷',
  '乌拉圭': '🇺🇾',
  '哥伦比亚': '🇨🇴',
  '墨西哥': '🇲🇽',
  '美国': '🇺🇸',
  '加拿大': '🇨🇦',
  '日本': '🇯🇵',
  '韩国': '🇰🇷',
  '澳大利亚': '🇦🇺',
  '沙特': '🇸🇦',
  '卡塔尔': '🇶🇦',
  '伊朗': '🇮🇷',
  '摩洛哥': '🇲🇦',
  '塞内加尔': '🇸🇳',
  '突尼斯': '🇹🇳',
  '喀麦隆': '🇨🇲',
  '加纳': '🇬🇭',
  '瑞士': '🇨🇭',
  '塞尔维亚': '🇷🇸',
  '波兰': '🇵🇱',
  '丹麦': '🇩🇰',
  '瑞典': '🇸🇪',
  '挪威': '🇳🇴',
  '奥地利': '🇦🇹',
  '捷克': '🇨🇿',
  '匈牙利': '🇭🇺',
  '苏格兰': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  '威尔士': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  '爱尔兰': '🇮🇪',
  '冰岛': '🇮🇸',
  '芬兰': '🇫🇮',
  '罗马尼亚': '🇷🇴',
  '斯洛伐克': '🇸🇰',
  '斯洛文尼亚': '🇸🇮',
  '波斯尼亚': '🇧🇦',
  '波黑': '🇧🇦',
  '黑山': '🇲🇪',
  '阿尔巴尼亚': '🇦🇱',
  '北马其顿': '🇲🇰',
  '保加利亚': '🇧🇬',
  '希腊': '🇬🇷',
  '土耳其': '🇹🇷',
  '以色列': '🇮🇱',
  '埃及': '🇪🇬',
  '尼日利亚': '🇳🇬',
  '科特迪瓦': '🇨🇮',
  '南非': '🇿🇦',
  '哥斯达黎加': '🇨🇷',
  '洪都拉斯': '🇭🇳',
  '巴拿马': '🇵🇦',
  '牙买加': '🇯🇲',
  '厄瓜多尔': '🇪🇨',
  '秘鲁': '🇵🇪',
  '智利': '🇨🇱',
  '巴拉圭': '🇵🇾',
  '玻利维亚': '🇧🇴',
  '委内瑞拉': '🇻🇪',
  '新西兰': '🇳🇿',
  '中国': '🇨🇳',
  '佛得角': '🇨🇻',
  '阿尔及利亚': '🇩🇿',
  '刚果(金)': '🇨🇩',
  '乌兹别克斯坦': '🇺🇿',
  '约旦': '🇯🇴',
};

export function getTeamFlag(teamName: string): string {
  if (!teamName) return '⚽';
  if (TEAM_FLAGS[teamName]) return TEAM_FLAGS[teamName];

  const cleaned = teamName.replace(/\s+/g, '').toLowerCase();
  for (const [name, flag] of Object.entries(TEAM_FLAGS)) {
    if (name === cleaned) return flag;
  }

  const ALIASES: Array<[string, string]> = [
    ['沙特阿拉伯', '🇸🇦'],
    ['沙特', '🇸🇦'],
    ['巴西联邦共和国', '🇧🇷'],
    ['德意志', '🇩🇪'],
    ['德国队', '🇩🇪'],
    ['法国队', '🇫🇷'],
    ['阿根廷队', '🇦🇷'],
    ['巴西队', '🇧🇷'],
    ['西班牙队', '🇪🇸'],
    ['英格兰队', '🏴'],
    ['葡萄牙队', '🇵🇹'],
    ['荷兰队', '🇳🇱'],
    ['日本队', '🇯🇵'],
    ['韩国队', '🇰🇷'],
    ['韩国', '🇰🇷'],
    ['美国队', '🇺🇸'],
    ['墨西哥队', '🇲🇽'],
    ['加拿大队', '🇨🇦'],
    ['澳大利亚队', '🇦🇺'],
    ['摩洛哥队', '🇲🇦'],
    ['塞内加尔队', '🇸🇳'],
    ['突尼斯队', '🇹🇳'],
    ['喀麦隆队', '🇨🇲'],
    ['加纳队', '🇬🇭'],
    ['瑞士队', '🇨🇭'],
    ['塞尔维亚队', '🇷🇸'],
    ['波兰队', '🇵🇱'],
    ['丹麦队', '🇩🇰'],
    ['瑞典队', '🇸🇪'],
    ['挪威队', '🇳🇴'],
    ['奥地利队', '🇦🇹'],
    ['捷克队', '🇨🇿'],
    ['匈牙利队', '🇭🇺'],
    ['苏格兰队', '🏴'],
    ['威尔士队', '🏴'],
    ['爱尔兰队', '🇮🇪'],
    ['冰岛队', '🇮🇸'],
    ['芬兰队', '🇫🇮'],
    ['罗马尼亚队', '🇷🇴'],
    ['斯洛伐克队', '🇸🇰'],
    ['斯洛文尼亚队', '🇸🇮'],
    ['波斯尼亚', '🇧🇦'],
    ['波黑', '🇧🇦'],
    ['黑山队', '🇲🇪'],
    ['阿尔巴尼亚队', '🇦🇱'],
    ['北马其顿队', '🇲🇰'],
    ['保加利亚队', '🇧🇬'],
    ['希腊队', '🇬🇷'],
    ['土耳其队', '🇹🇷'],
    ['以色列队', '🇮🇱'],
    ['埃及队', '🇪🇬'],
    ['尼日利亚队', '🇳🇬'],
    ['科特迪瓦队', '🇨🇮'],
    ['南非队', '🇿🇦'],
    ['哥斯达黎加队', '🇨🇷'],
    ['洪都拉斯队', '🇭🇳'],
    ['巴拿马队', '🇵🇦'],
    ['牙买加队', '🇯🇲'],
    ['厄瓜多尔队', '🇪🇨'],
    ['秘鲁队', '🇵🇪'],
    ['智利队', '🇨🇱'],
    ['巴拉圭队', '🇵🇾'],
    ['玻利维亚队', '🇧🇴'],
    ['委内瑞拉队', '🇻🇪'],
    ['新西兰队', '🇳🇿'],
    ['中国队', '🇨🇳'],
    ['中国国家队', '🇨🇳'],
    ['国足', '🇨🇳'],
    ['乌拉圭队', '🇺🇾'],
    ['哥伦比亚队', '🇨🇴'],
    ['卡塔尔国家队', '🇶🇦'],
    ['伊朗队', '🇮🇷'],
    ['意大利队', '🇮🇹'],
    ['比利时队', '🇧🇪'],
    ['克罗地亚队', '🇭🇷'],
    ['佛得角', '🇨🇻'],
    ['佛得角队', '🇨🇻'],
    ['阿尔及利亚', '🇩🇿'],
    ['阿尔及利亚队', '🇩🇿'],
    ['刚果(金)', '🇨🇩'],
    ['刚果(金)队', '🇨🇩'],
    ['刚果民主共和国', '🇨🇩'],
    ['刚果金', '🇨🇩'],
    ['乌兹别克斯坦', '🇺🇿'],
    ['乌兹别克斯坦队', '🇺🇿'],
    ['约旦', '🇯🇴'],
    ['约旦队', '🇯🇴'],
  ];

  for (const [alias, flag] of ALIASES) {
    if (cleaned.includes(alias.toLowerCase())) {
      return flag;
    }
  }

  return '⚽';
}
