export type BadgeCategory = 'daily_burst' | 'profit_total' | 'count_total' | 'milestone' | 'daily_profit';
export type BadgeRarity = 1 | 2 | 3 | 4 | 5;

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  condition: string;
  checkFunction: string;
}

export const BADGES: BadgeDefinition[] = [
  {
    id: 'meierduka',
    name: '梅开二度',
    description: '连续中奖 2 天',
    emoji: '⚽',
    category: 'daily_burst',
    rarity: 3,
    condition: '连续中奖 >= 2 天',
    checkFunction: 'checkStreak',
  },
  {
    id: 'maozixifa',
    name: '帽子戏法',
    description: '连续中奖 3 天',
    emoji: '🎩',
    category: 'daily_burst',
    rarity: 4,
    condition: '连续中奖 >= 3 天',
    checkFunction: 'checkStreak',
  },
  {
    id: 'sixilinmen',
    name: '四喜临门',
    description: '连续中奖 4 天及以上',
    emoji: '🍀',
    category: 'daily_burst',
    rarity: 5,
    condition: '连续中奖 >= 4 天',
    checkFunction: 'checkStreak',
  },

  {
    id: 'xiaoyouhuoshou',
    name: '小有收获',
    description: '累计盈利 ¥80',
    emoji: '💰',
    category: 'profit_total',
    rarity: 1,
    condition: '累计盈利 >= 80',
    checkFunction: 'checkTotalProfit',
  },
  {
    id: 'caiyuanggungun',
    name: '财源滚滚',
    description: '累计盈利 ¥600',
    emoji: '🪙',
    category: 'profit_total',
    rarity: 2,
    condition: '累计盈利 >= 600',
    checkFunction: 'checkTotalProfit',
  },
  {
    id: 'jinkubazhu',
    name: '金库霸主',
    description: '累计盈利 ¥1800',
    emoji: '👑',
    category: 'profit_total',
    rarity: 3,
    condition: '累计盈利 >= 1800',
    checkFunction: 'checkTotalProfit',
  },
  {
    id: 'rijindoujin',
    name: '日进斗金',
    description: '累计盈利 ¥3600',
    emoji: '💎',
    category: 'profit_total',
    rarity: 4,
    condition: '累计盈利 >= 3600',
    checkFunction: 'checkTotalProfit',
  },
  {
    id: 'yiwanfuweng',
    name: '亿万富翁',
    description: '累计盈利 ¥8000',
    emoji: '🏆',
    category: 'profit_total',
    rarity: 5,
    condition: '累计盈利 >= 8000',
    checkFunction: 'checkTotalProfit',
  },

  {
    id: 'kaimenhong',
    name: '开门红',
    description: '第 1 次中奖',
    emoji: '🎉',
    category: 'count_total',
    rarity: 1,
    condition: '累计中奖 >= 1 次',
    checkFunction: 'checkTotalWins',
  },
  {
    id: 'shinaojiuwen',
    name: '十拿九稳',
    description: '累计中奖 10 次',
    emoji: '🎯',
    category: 'count_total',
    rarity: 3,
    condition: '累计中奖 >= 10 次',
    checkFunction: 'checkTotalWins',
  },
  {
    id: 'baizhanbaisheng',
    name: '百战百胜',
    description: '累计中奖 15 次',
    emoji: '🏅',
    category: 'count_total',
    rarity: 5,
    condition: '累计中奖 >= 15 次',
    checkFunction: 'checkTotalWins',
  },

  {
    id: 'jijunsaiyuyanjia',
    name: '季军赛预言家',
    description: '7月19日当天有中奖',
    emoji: '🥉',
    category: 'milestone',
    rarity: 2,
    condition: '2026-07-19 有中奖',
    checkFunction: 'checkMilestoneDate',
  },
  {
    id: 'juesaiyuyanjia',
    name: '决赛预言家',
    description: '7月20日当天有中奖',
    emoji: '🏆',
    category: 'milestone',
    rarity: 5,
    condition: '2026-07-20 有中奖',
    checkFunction: 'checkMilestoneDate',
  },

  {
    id: 'yiyebaofu',
    name: '一夜暴富',
    description: '单日盈利 ¥600',
    emoji: '🚀',
    category: 'daily_profit',
    rarity: 3,
    condition: '单日盈利 >= 600',
    checkFunction: 'checkDailyProfit',
  },
  {
    id: 'caishenjianglin',
    name: '财神降临',
    description: '单日盈利 ¥1200',
    emoji: '🎁',
    category: 'daily_profit',
    rarity: 4,
    condition: '单日盈利 >= 1200',
    checkFunction: 'checkDailyProfit',
  },
  {
    id: 'fuguizaitian',
    name: '富贵在天',
    description: '单日盈利 ¥1800',
    emoji: '⭐',
    category: 'daily_profit',
    rarity: 5,
    condition: '单日盈利 >= 1800',
    checkFunction: 'checkDailyProfit',
  },
];

export const RARITY_STYLES: Record<BadgeRarity, {
  borderColor: string;
  bgColor: string;
  glow: string;
  label: string;
  animation: string;
}> = {
  1: {
    borderColor: 'border-neutral-300 dark:border-neutral-600',
    bgColor: 'bg-white dark:bg-neutral-800',
    glow: '',
    label: '⭐',
    animation: '',
  },
  2: {
    borderColor: 'border-neutral-300 dark:border-neutral-600',
    bgColor: 'bg-white dark:bg-neutral-800',
    glow: '',
    label: '⭐⭐',
    animation: '',
  },
  3: {
    borderColor: 'border-neutral-300 dark:border-neutral-600',
    bgColor: 'bg-white dark:bg-neutral-800',
    glow: '',
    label: '⭐⭐⭐',
    animation: '',
  },
  4: {
    borderColor: 'border-amber-400 dark:border-amber-500',
    bgColor: 'bg-white dark:bg-neutral-800',
    glow: 'shadow-md shadow-amber-400/30',
    label: '⭐⭐⭐⭐',
    animation: 'badge-pulse-gold',
  },
  5: {
    borderColor: 'border-transparent',
    bgColor: 'bg-gradient-to-br from-cyan-400/20 via-violet-400/20 to-pink-400/20',
    glow: 'shadow-lg shadow-violet-400/30',
    label: '⭐⭐⭐⭐⭐',
    animation: 'badge-pulse-legendary',
  },
};

export const CATEGORY_NAMES: Record<BadgeCategory, string> = {
  daily_burst: '连续中奖',
  profit_total: '累计盈利',
  count_total: '累计次数',
  milestone: '特殊里程碑',
  daily_profit: '单日盈利',
};

export function getBadgeDefinition(id: string): BadgeDefinition | undefined {
  return BADGES.find(b => b.id === id);
}

export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return BADGES.filter(b => b.category === category);
}
