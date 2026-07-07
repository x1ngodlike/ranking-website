import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { Match } from '@/types';
import { formatDate } from '@/utils/helpers';

const KNOCKOUT_ROUNDS = [
  { key: 'round_of_32', name: '1/16决赛', count: 16 },
  { key: 'round_of_16', name: '1/8决赛', count: 8 },
  { key: 'quarter_final', name: '1/4决赛', count: 4 },
  { key: 'semi_final', name: '半决赛', count: 2 },
  { key: 'final', name: '决赛', count: 1 },
  { key: 'third_place', name: '季军赛', count: 1 },
];

const getRoundKey = (match: Match): string => {
  if (match.roundKey) return match.roundKey;
  const num = parseInt(match.matchNumber || '0', 10);
  if (num >= 1 && num <= 16) return 'round_of_32';
  if (num >= 17 && num <= 24) return 'round_of_16';
  if (num >= 25 && num <= 28) return 'quarter_final';
  if (num >= 29 && num <= 30) return 'semi_final';
  if (num === 31) return 'third_place';
  if (num === 32) return 'final';
  return 'round_of_32';
};

const getRoundMatches = (matches: Match[], roundKey: string): Match[] => {
  return matches
    .filter((m) => m.stage === 'knockout')
    .filter((m) => getRoundKey(m) === roundKey);
};

const MatchCard = ({ match, designVersion = 'v1' }: { match: Match; designVersion?: string }) => {
  const isFinished = match.status === 'finished';
  const winner = isFinished && match.homeScore !== null && match.awayScore !== null
    ? (match.homeScore > match.awayScore 
        ? 'home' 
        : match.homeScore < match.awayScore 
          ? 'away' 
          : match.homePenaltyScore !== null && match.awayPenaltyScore !== null
            ? (match.homePenaltyScore > match.awayPenaltyScore ? 'home' : 'away')
            : null)
    : null;
  const homeWon = winner === 'home';
  const awayWon = winner === 'away';

  return (
    <div className={designVersion === 'v2'
      ? 'rounded-lg p-3 border border-[var(--v2-border)] bg-[var(--v2-bg-card)] hover:shadow-md transition-shadow'
      : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md p-1.5 shadow-sm hover:shadow-md transition-shadow'
    }>
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span className={designVersion === 'v2' ? 'text-[9px] font-v2-body text-[var(--v2-text-secondary)]' : 'text-[9px] text-neutral-500 dark:text-neutral-400'}>
          {formatDate(match.matchTime)}
        </span>
        <span className={`text-[9px] ${designVersion === 'v2'
          ? (isFinished ? 'text-green-500' : match.status === 'live' ? 'text-red-500 animate-pulse' : 'text-[var(--v2-text-secondary)]')
          : (isFinished ? 'text-green-500' : 'text-neutral-400')
        }`}>
          {match.status === 'live' ? '进行中' : isFinished ? '已结束' : '未开赛'}
        </span>
      </div>

      <div className={designVersion === 'v2'
        ? `flex items-center gap-1 px-1 py-0.5 rounded ${homeWon ? 'bg-v2-primary-500/5' : ''}`
        : `flex items-center gap-1 px-1 py-0.5 rounded ${homeWon ? 'bg-red-50 dark:bg-red-900/10' : ''}`
      }>
        <span className="text-xs flex-shrink-0">{match.homeFlag || '⚪'}</span>
        <span className={`text-[11px] truncate flex-1 ${designVersion === 'v2'
          ? (homeWon ? 'text-v2-primary-500 font-semibold' : 'font-v2-body text-[var(--v2-text)]')
          : (homeWon ? 'text-red-600 dark:text-red-400 font-bold' : 'text-neutral-800 dark:text-neutral-200')
        }`}>
          {match.homeTeam || '待定'}
        </span>
        {match.homeScore !== null && match.awayScore !== null && (
          <span className={`text-[11px] flex-shrink-0 ${designVersion === 'v2'
            ? (homeWon ? 'font-v2-mono font-bold text-v2-primary-500' : 'font-v2-mono font-bold text-[var(--v2-text)]')
            : (homeWon ? 'font-display text-red-600 dark:text-red-400 font-bold' : 'font-display text-neutral-800 dark:text-neutral-200')
          }`}>
            {match.homeScore}{match.homePenaltyScore !== null ? `[${match.homePenaltyScore}]` : ''}
          </span>
        )}
      </div>

      <div className={designVersion === 'v2'
        ? `flex items-center gap-1 px-1 py-0.5 rounded ${awayWon ? 'bg-v2-primary-500/5' : ''}`
        : `flex items-center gap-1 px-1 py-0.5 rounded ${awayWon ? 'bg-red-50 dark:bg-red-900/10' : ''}`
      }>
        <span className="text-xs flex-shrink-0">{match.awayFlag || '⚪'}</span>
        <span className={`text-[11px] truncate flex-1 ${designVersion === 'v2'
          ? (awayWon ? 'text-v2-primary-500 font-semibold' : 'font-v2-body text-[var(--v2-text)]')
          : (awayWon ? 'text-red-600 dark:text-red-400 font-bold' : 'text-neutral-800 dark:text-neutral-200')
        }`}>
          {match.awayTeam || '待定'}
        </span>
        {match.homeScore !== null && match.awayScore !== null && (
          <span className={`text-[11px] flex-shrink-0 ${designVersion === 'v2'
            ? (awayWon ? 'font-v2-mono font-bold text-v2-primary-500' : 'font-v2-mono font-bold text-[var(--v2-text)]')
            : (awayWon ? 'font-display text-red-600 dark:text-red-400 font-bold' : 'font-display text-neutral-800 dark:text-neutral-200')
          }`}>
            {match.awayScore}{match.awayPenaltyScore !== null ? `[${match.awayPenaltyScore}]` : ''}
          </span>
        )}
      </div>
    </div>
  );
};

const EmptyMatchCard = ({ designVersion = 'v1' }: { designVersion?: string }) => (
  <div className={designVersion === 'v2'
    ? 'rounded-lg p-3 border border-dashed border-[var(--v2-border)] bg-[var(--v2-bg-card)]/50'
    : 'bg-white/50 dark:bg-neutral-800/50 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-md p-1.5'
  }>
    <div className="flex items-center justify-between gap-1 mb-0.5">
      <span className={designVersion === 'v2' ? 'text-[9px] font-v2-body text-[var(--v2-text-secondary)]' : 'text-[9px] text-neutral-400'}>--/--</span>
      <span className={designVersion === 'v2' ? 'text-[9px] font-v2-body text-[var(--v2-text-secondary)]' : 'text-[9px] text-neutral-400'}>待定</span>
    </div>
    <div className="flex items-center gap-1 px-1 py-0.5">
      <span className="text-xs flex-shrink-0">⚪</span>
      <span className={designVersion === 'v2' ? 'text-[11px] truncate flex-1 font-v2-body text-[var(--v2-text-secondary)]' : 'text-[11px] truncate flex-1 text-neutral-400'}>待定</span>
    </div>
    <div className="flex items-center gap-1 px-1 py-0.5">
      <span className="text-xs flex-shrink-0">⚪</span>
      <span className={designVersion === 'v2' ? 'text-[11px] truncate flex-1 font-v2-body text-[var(--v2-text-secondary)]' : 'text-[11px] truncate flex-1 text-neutral-400'}>待定</span>
    </div>
  </div>
);

// 连接线组件：绘制从上一轮两张卡片到下一轮一张卡片的连接线
const BracketConnectors = ({ containerRef, roundCardCounts, designVersion = 'v1' }: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  roundCardCounts: number[];
  designVersion?: string;
}) => {
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; mx: number }[]>([]);

  const updateLines = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const roundEls = container.querySelectorAll<HTMLElement>('[data-round]');
    if (roundEls.length < 2) { setLines([]); return; }

    const containerRect = container.getBoundingClientRect();
    const newLines: { x1: number; y1: number; x2: number; y2: number; mx: number }[] = [];

    for (let r = 0; r < roundEls.length - 1; r++) {
      const currentRound = roundEls[r];
      const nextRound = roundEls[r + 1];

      // 跳过季军赛（不连线）
      if (nextRound.getAttribute('data-round') === 'third_place') continue;

      const currentCards = currentRound.querySelectorAll<HTMLElement>('[data-card]');
      const nextCards = nextRound.querySelectorAll<HTMLElement>('[data-card]');

      for (let n = 0; n < nextCards.length; n++) {
        const nextCard = nextCards[n];
        const nextRect = nextCard.getBoundingClientRect();
        const nextY = nextRect.top + nextRect.height / 2 - containerRect.top;
        const nextX = nextRect.left - containerRect.left;

        // 上一轮中对应的两个卡片索引
        const topIdx = n * 2;
        const bottomIdx = n * 2 + 1;

        if (topIdx < currentCards.length && bottomIdx < currentCards.length) {
          const topRect = currentCards[topIdx].getBoundingClientRect();
          const bottomRect = currentCards[bottomIdx].getBoundingClientRect();

          const topY = topRect.top + topRect.height / 2 - containerRect.top;
          const topX = topRect.right - containerRect.left;
          const bottomY = bottomRect.top + bottomRect.height / 2 - containerRect.top;
          const bottomX = bottomRect.right - containerRect.left;

          const midX = topX + (nextX - topX) / 2;

          newLines.push({ x1: topX, y1: topY, x2: midX, y2: topY, mx: midX });
          newLines.push({ x1: midX, y1: topY, x2: midX, y2: bottomY, mx: midX });
          newLines.push({ x1: midX, y1: bottomY, x2: bottomX, y2: bottomY, mx: midX });
          newLines.push({ x1: midX, y1: (topY + bottomY) / 2, x2: nextX, y2: nextY, mx: midX });
        }
      }
    }

    setLines(newLines);
  }, [containerRef]);

  useEffect(() => {
    updateLines();
    window.addEventListener('resize', updateLines);
    // 延迟更新确保DOM已渲染
    const timer = setTimeout(updateLines, 100);
    return () => {
      window.removeEventListener('resize', updateLines);
      clearTimeout(timer);
    };
  }, [updateLines, roundCardCounts]);

  if (lines.length === 0) return null;

  const container = containerRef.current;
  if (!container) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: container.scrollWidth, height: container.scrollHeight }}
    >
      {lines.map((line, i) => (
        <line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="currentColor"
          strokeWidth={1}
          className={designVersion === 'v2' ? 'text-[var(--v2-border)]' : 'text-neutral-300 dark:text-neutral-600'}
        />
      ))}
    </svg>
  );
};

const KnockoutBracket = () => {
  const matches = useAppStore((state) => state.matches);
  const designVersion = useAppStore((s) => s.designVersion);
  const containerRef = useRef<HTMLDivElement>(null);

  const knockoutMatches = useMemo(() => {
    return matches.filter((m) => m.stage === 'knockout');
  }, [matches]);

  const bracketRounds = useMemo(() => {
    return KNOCKOUT_ROUNDS.map((round) => ({
      key: round.key,
      name: round.name,
      count: round.count,
      matches: getRoundMatches(knockoutMatches, round.key),
    }));
  }, [knockoutMatches]);

  const hasKnockoutMatches = knockoutMatches.length > 0;

  // 记录每轮卡片数量用于触发连线更新
  const roundCardCounts = useMemo(() => {
    return bracketRounds.map(r => r.matches.length);
  }, [bracketRounds]);

  if (!hasKnockoutMatches) {
    return (
      <div className={designVersion === 'v2'
        ? 'rounded-xl p-5 border border-[var(--v2-border)] bg-[var(--v2-bg-card)] text-center py-16'
        : 'card text-center py-16'
      }>
        <div className={designVersion === 'v2' ? 'w-16 h-16 rounded-xl bg-[var(--v2-bg)] flex items-center justify-center mx-auto mb-4' : 'w-16 h-16 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={designVersion === 'v2' ? 'text-[var(--v2-text-secondary)]' : 'text-neutral-400'}>
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </div>
        <p className={designVersion === 'v2' ? 'font-v2-body text-[var(--v2-text-secondary)] mb-2' : 'text-neutral-500 dark:text-neutral-500 mb-2'}>暂无淘汰赛数据</p>
        <p className={designVersion === 'v2' ? 'text-sm font-v2-body text-[var(--v2-text-secondary)]' : 'text-sm text-neutral-600 dark:text-neutral-400'}>
          等待淘汰赛赛程同步
        </p>
      </div>
    );
  }

  const mainRounds = bracketRounds.filter((r) => r.name !== '季军赛');
  const thirdPlaceRound = bracketRounds.find((r) => r.name === '季军赛');

  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4">
      <div ref={containerRef} className="relative flex gap-3 min-w-max items-stretch">
        <BracketConnectors containerRef={containerRef} roundCardCounts={roundCardCounts} designVersion={designVersion} />

        {mainRounds.map((round, roundIndex) => {
          const cardSlots = Array.from({ length: round.count }).map((_, index) =>
            round.matches[index] || null
          );

          return (
            <div key={round.name} data-round={round.key} className="flex flex-col w-[130px] sm:w-[150px] flex-shrink-0">
              <div className="mb-2 text-center">
                <h3 className={designVersion === 'v2'
                  ? `font-v2-display font-semibold text-sm uppercase tracking-wider text-[var(--v2-text-secondary)] ${round.name === '决赛' ? 'text-v2-primary-500' : ''}`
                  : `font-display text-xs font-bold ${round.name === '决赛' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`
                }>
                  {round.name}
                </h3>
              </div>
              <div className="flex flex-col flex-1 gap-[5px] justify-around">
                {cardSlots.map((match, cardIndex) => (
                  <div key={cardIndex} data-card={`${roundIndex}-${cardIndex}`}>
                    {match ? (
                      <MatchCard match={match} designVersion={designVersion} />
                    ) : (
                      <EmptyMatchCard designVersion={designVersion} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {thirdPlaceRound && (
          <div data-round="third_place" className="flex flex-col w-[130px] sm:w-[150px] flex-shrink-0">
            <div className="mb-2 text-center">
              <h3 className={designVersion === 'v2'
                ? 'font-v2-display font-semibold text-sm uppercase tracking-wider text-v2-primary-500'
                : 'font-display text-xs text-amber-600 dark:text-amber-400 font-bold'
              }>
                {thirdPlaceRound.name}
              </h3>
            </div>
            <div className="flex flex-col justify-center flex-1">
              {thirdPlaceRound.matches[0] ? (
                <MatchCard match={thirdPlaceRound.matches[0]} designVersion={designVersion} />
              ) : (
                <EmptyMatchCard designVersion={designVersion} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnockoutBracket;
