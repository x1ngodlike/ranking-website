import { useEffect, useState } from 'react';
import { BADGES, RARITY_STYLES, CATEGORY_NAMES, BadgeDefinition, BadgeRarity, BadgeCategory } from '../../utils/badges';
import { getBadgeIconSrc } from '../../utils/badgeIcons';

function BadgeIcon({ badgeId, size = 60, grayscale = false }: { badgeId: string; size?: number; grayscale?: boolean }) {
  const src = getBadgeIconSrc(badgeId);
  return (
    <img
      src={src}
      alt=""
      className={`rounded-full object-cover ${grayscale ? 'grayscale opacity-50' : ''}`}
      style={{ width: size, height: size }}
      onError={(e) => {
        const el = e.currentTarget as HTMLImageElement;
        el.style.display = 'none';
      }}
    />
  );
}
import { useAppStore } from '../../store/useAppStore';

interface EarnedBadge {
  id: string;
  name: string;
  rarity: number;
  earnedAt: string;
}

interface BadgeDisplayProps {
  userId: string;
}

export default function BadgeDisplay({ userId }: BadgeDisplayProps) {
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const environment = useAppStore((state) => state.environment);
  const designVersion = useAppStore((s) => s.designVersion);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/badges/${userId}?environment=${encodeURIComponent(environment)}`);
        const result = await res.json();
        if (result.success) {
          setEarnedBadges(result.badges || []);
        }
      } catch (e) {
        console.error('Failed to fetch badges:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBadges();
  }, [userId, environment]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  const categories: BadgeCategory[] = ['daily_burst', 'profit_total', 'count_total', 'milestone', 'daily_profit'];
  const earnedCount = earnedBadges.length;
  const totalCount = BADGES.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          已解锁 <span className="font-bold text-amber-500">{earnedCount}</span> / {totalCount}
        </p>
        <div className="flex-1 mx-3 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
            style={{ width: `${(earnedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {categories.map(category => {
        const categoryBadges = BADGES.filter(b => b.category === category);
        const earnedInCategory = categoryBadges.filter(b => earnedBadges.some(e => e.id === b.id)).length;
        return (
          <div key={category}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                {CATEGORY_NAMES[category]}
              </h4>
              <span className="text-xs text-neutral-400">
                {earnedInCategory}/{categoryBadges.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {categoryBadges.map(badgeDef => {
                const earned = earnedBadges.find(e => e.id === badgeDef.id);
                return (
                  <BadgeItem
                    key={badgeDef.id}
                    badge={badgeDef}
                    earned={earned}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BadgeItem({ badge, earned }: { badge: BadgeDefinition; earned?: EarnedBadge }) {
  const rarity = (earned?.rarity || badge.rarity) as BadgeRarity;
  const style = RARITY_STYLES[rarity];
  const isEarned = Boolean(earned);
  const designVersion = useAppStore((s) => s.designVersion);

  // V2: 卡片式 grid 布局，突出勋章图标
  if (designVersion === 'v2') {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
          isEarned
            ? `${style.borderColor} ${style.bgColor} ${style.glow} ${style.animation}`
            : 'border-[var(--v2-border)] bg-[var(--v2-bg-muted)] opacity-50'
        }`}
      >
        <BadgeIcon badgeId={badge.id} size={60} grayscale={!isEarned} />
        <p className={`font-v2-body text-[11px] font-medium mt-1.5 text-center leading-tight ${isEarned ? 'text-[var(--v2-text)]' : 'text-[var(--v2-text-muted)]'}`}>
          {badge.name}
        </p>
        <div className="flex items-center gap-px mt-0.5">
          {[...Array(rarity)].map((_, i) => (
            <span key={i} className={`text-[10px] ${isEarned ? 'text-v2-gold-500' : 'text-neutral-400'}`}>
              ★
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer
        ${isEarned
          ? `${style.borderColor} ${style.bgColor} ${style.glow} ${style.animation}`
          : 'border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800/50 opacity-60'
        }
      `}
    >
      <BadgeIcon badgeId={badge.id} size={60} grayscale={!isEarned} />
      <p className={`text-sm mt-2 text-center font-medium
        ${isEarned
          ? 'text-neutral-800 dark:text-neutral-200'
          : 'text-neutral-500 dark:text-neutral-500'
        }
      `}>
        {badge.name}
      </p>
      <div className="flex items-center gap-0.5 mt-1">
        {[...Array(rarity)].map((_, i) => (
          <span key={i} className={`text-xs ${isEarned ? 'text-amber-500' : 'text-neutral-400'}`}>
            ⭐
          </span>
        ))}
      </div>
      <p className={`text-xs mt-2 text-center leading-relaxed
        ${isEarned
          ? 'text-neutral-600 dark:text-neutral-400'
          : 'text-neutral-400 dark:text-neutral-500'
        }
      `}>
        {badge.condition}
      </p>
    </div>
  );
}
