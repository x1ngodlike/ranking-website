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

function detectPlayType(text: string): string {
  for (const type of PLAY_TYPES) {
    if (text.includes(type)) {
      return type;
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
      const homeTeam = vsMatch[1].trim();
      const awayTeam = vsMatch[2].trim();
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
};

export function getTeamFlag(teamName: string): string {
  return TEAM_FLAGS[teamName] || '⚽';
}
