export type BadgeCategory = 'daily_burst' | 'profit_total' | 'count_total' | 'milestone' | 'daily_profit';
export type BadgeRarity = 1 | 2 | 3 | 4 | 5;

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
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
    description: '单日中奖 2 场',
    icon: 'Footprints',
    emoji: '⚽',
    category: 'daily_burst',
    rarity: 2,
    condition: '单日中奖 >= 2 场',
    checkFunction: 'checkDailyWins',
  },
  {
    id: 'maozixifa',
    name: '帽子戏法',
    description: '单日中奖 3 场',
    icon: 'Wand2',
    emoji: '🎩',
    category: 'daily_burst',
    rarity: 3,
    condition: '单日中奖 >= 3 场',
    checkFunction: 'checkDailyWins',
  },
  {
    id: 'sixilinmen',
    name: '四喜临门',
    description: '单日中奖 4 场',
    icon: 'Sparkles',
    emoji: '🍀',
    category: 'daily_burst',
    rarity: 4,
    condition: '单日中奖 >= 4 场',
    checkFunction: 'checkDailyWins',
  },
  {
    id: 'wuzidengke',
    name: '五子登科',
    description: '单日中奖 5 场及以上',
    icon: 'Flame',
    emoji: '🔥',
    category: 'daily_burst',
    rarity: 5,
    condition: '单日中奖 >= 5 场',
    checkFunction: 'checkDailyWins',
  },

  {
    id: 'xiaoyouhuoshou',
    name: '小有收获',
    description: '累计盈利 ¥200',
    icon: 'Wallet',
    emoji: '💰',
    category: 'profit_total',
    rarity: 1,
    condition: '累计盈利 >= 200',
    checkFunction: 'checkTotalProfit',
  },
  {
    id: 'caiyuanggungun',
    name: '财源滚滚',
    description: '累计盈利 ¥1000',
    icon: 'Coins',
    emoji: '🪙',
    category: 'profit_total',
    rarity: 2,
    condition: '累计盈利 >= 1000',
    checkFunction: 'checkTotalProfit',
  },
  {
    id: 'jinkubazhu',
    name: '金库霸主',
    description: '累计盈利 ¥2000',
    icon: 'Crown',
    emoji: '👑',
    category: 'profit_total',
    rarity: 3,
    condition: '累计盈利 >= 2000',
    checkFunction: 'checkTotalProfit',
  },
  {
    id: 'rijindoujin',
    name: '日进斗金',
    description: '累计盈利 ¥6000',
    icon: 'Gem',
    emoji: '💎',
    category: 'profit_total',
    rarity: 4,
    condition: '累计盈利 >= 6000',
    checkFunction: 'checkTotalProfit',
  },
  {
    id: 'yiwanfuweng',
    name: '亿万富翁',
    description: '累计盈利 ¥10000',
    icon: 'Trophy',
    emoji: '🏆',
    category: 'profit_total',
    rarity: 5,
    condition: '累计盈利 >= 10000',
    checkFunction: 'checkTotalProfit',
  },

  {
    id: 'kaimenhong',
    name: '开门红',
    description: '第 1 次中奖',
    icon: 'PartyPopper',
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
    icon: 'Target',
    emoji: '🎯',
    category: 'count_total',
    rarity: 3,
    condition: '累计中奖 >= 10 次',
    checkFunction: 'checkTotalWins',
  },
  {
    id: 'baizhanbaisheng',
    name: '百战百胜',
    description: '累计中奖 50 次',
    icon: 'Award',
    emoji: '🏅',
    category: 'count_total',
    rarity: 5,
    condition: '累计中奖 >= 50 次',
    checkFunction: 'checkTotalWins',
  },

  {
    id: 'jimuzhanxianzhi',
    name: '揭幕战先知',
    description: '6月15日当天有中奖',
    icon: 'Sunrise',
    emoji: '🌅',
    category: 'milestone',
    rarity: 2,
    condition: '2026-06-15 有中奖',
    checkFunction: 'checkMilestoneDate',
  },
  {
    id: 'juesaiyuyanjia',
    name: '决赛预言家',
    description: '7月19日当天有中奖',
    icon: 'Trophy',
    emoji: '🏆',
    category: 'milestone',
    rarity: 5,
    condition: '2026-07-19 有中奖',
    checkFunction: 'checkMilestoneDate',
  },

  {
    id: 'yiyebaofu',
    name: '一夜暴富',
    description: '单日盈利 ¥500',
    icon: 'Rocket',
    emoji: '🚀',
    category: 'daily_profit',
    rarity: 3,
    condition: '单日盈利 >= 500',
    checkFunction: 'checkDailyProfit',
  },
  {
    id: 'caishenjianglin',
    name: '财神降临',
    description: '单日盈利 ¥2500',
    icon: 'Gift',
    emoji: '🎁',
    category: 'daily_profit',
    rarity: 4,
    condition: '单日盈利 >= 2500',
    checkFunction: 'checkDailyProfit',
  },
  {
    id: 'fuguizaitian',
    name: '富贵在天',
    description: '单日盈利 ¥5000',
    icon: 'Star',
    emoji: '⭐',
    category: 'daily_profit',
    rarity: 5,
    condition: '单日盈利 >= 5000',
    checkFunction: 'checkDailyProfit',
  },
];

export const RARITY_STYLES: Record<BadgeRarity, {
  borderColor: string;
  bgColor: string;
  glow: string;
  label: string;
}> = {
  1: {
    borderColor: 'border-neutral-300 dark:border-neutral-600',
    bgColor: 'bg-white dark:bg-neutral-800',
    glow: '',
    label: '⭐',
  },
  2: {
    borderColor: 'border-neutral-300 dark:border-neutral-600',
    bgColor: 'bg-white dark:bg-neutral-800',
    glow: '',
    label: '⭐⭐',
  },
  3: {
    borderColor: 'border-neutral-300 dark:border-neutral-600',
    bgColor: 'bg-white dark:bg-neutral-800',
    glow: '',
    label: '⭐⭐⭐',
  },
  4: {
    borderColor: 'border-neutral-300 dark:border-neutral-600',
    bgColor: 'bg-white dark:bg-neutral-800',
    glow: '',
    label: '⭐⭐⭐⭐',
  },
  5: {
    borderColor: 'border-transparent',
    bgColor: 'bg-gradient-to-br from-cyan-400/20 via-violet-400/20 to-pink-400/20',
    glow: 'shadow-lg shadow-violet-400/30',
    label: '⭐⭐⭐⭐⭐',
  },
};

export const CATEGORY_NAMES: Record<BadgeCategory, string> = {
  daily_burst: '单日爆发',
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
