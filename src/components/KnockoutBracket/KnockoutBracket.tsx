import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { Match, Bet, User } from '@/types';
import { formatDate } from '@/utils/helpers';
import Avatar from '@/components/Avatar';

interface KnockoutBracketProps {}

const KNOCKOUT_ROUNDS = [
  { key: 'round_of_32', name: '1/16决赛', count: 16 },
  { key: 'round_of_16', name: '1/8决赛', count: 8 },
  { key: 'quarter_final', name: '1/4决赛', count: 4 },
  { key: 'semi_final', name: '半决赛', count: 2 },
  { key: 'final', name: '决赛', count: 1 },
  { key: 'third_place', name: '季军赛', count: 1 },
];

const getRoundKey = (matchNumber?: string): string => {
  if (!matchNumber) return 'round_of_32';
  const num = parseInt(matchNumber, 10);
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
    .filter((m) => getRoundKey(m.matchNumber) === roundKey)
    .sort((a, b) => {
      const numA = parseInt(a.matchNumber || '0', 10);
      const numB = parseInt(b.matchNumber || '0', 10);
      return numA - numB;
    });
};

const isPredictionCorrect = (match: Match, bet: Bet): boolean => {
  if (!match.homeScore || !match.awayScore || !bet.predictedHomeScore || !bet.predictedAwayScore) {
    return false;
  }
  const actualWinner = match.homeScore > match.awayScore ? 'home' : 'away';
  const predictedWinner = bet.predictedHomeScore > bet.predictedAwayScore ? 'home' : 'away';
  return actualWinner === predictedWinner;
};

const getCorrectPredictUsers = (match: Match, bets: Bet[], users: User[]): User[] => {
  if (!bets || !users || match.status !== 'finished') return [];

  const correctBets = bets.filter((bet) =>
    bet.matchId === match.id && isPredictionCorrect(match, bet)
  );

  const userMap = new Map(users.map((u) => [u.id, u]));
  return correctBets
    .map((bet) => userMap.get(bet.userId))
    .filter((u): u is User => u !== undefined);
};

const MatchCard = ({ match, bets, users }: { match: Match; bets?: Bet[]; users?: User[] }) => {
  const isFinished = match.status === 'finished';
  const winner = isFinished && match.homeScore !== null && match.awayScore !== null
    ? (match.homeScore > match.awayScore ? 'home' : 'away')
    : null;
  const homeWon = winner === 'home';
  const awayWon = winner === 'away';

  const correctUsers = useMemo(() => {
    return getCorrectPredictUsers(match, bets || [], users || []);
  }, [match, bets, users]);

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md p-1.5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span className="text-[9px] text-neutral-500 dark:text-neutral-400">
          {formatDate(match.matchTime)}
        </span>
        <span className={`text-[9px] ${isFinished ? 'text-green-500' : 'text-neutral-400'}`}>
          {isFinished ? '已结束' : '未开赛'}
        </span>
      </div>

      <div className={`flex items-center gap-1 px-1 py-0.5 rounded ${homeWon ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
        <span className="text-xs flex-shrink-0">{match.homeFlag || '⚪'}</span>
        <span className={`text-[11px] truncate flex-1 ${homeWon ? 'text-red-600 dark:text-red-400 font-bold' : 'text-neutral-800 dark:text-neutral-200'}`}>
          {match.homeTeam || '待定'}
        </span>
        {match.homeScore !== null && match.awayScore !== null && (
          <span className={`font-display text-[11px] flex-shrink-0 ${homeWon ? 'text-red-600 dark:text-red-400 font-bold' : 'text-neutral-800 dark:text-neutral-200'}`}>
            {match.homeScore}
          </span>
        )}
      </div>

      <div className={`flex items-center gap-1 px-1 py-0.5 rounded ${awayWon ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
        <span className="text-xs flex-shrink-0">{match.awayFlag || '⚪'}</span>
        <span className={`text-[11px] truncate flex-1 ${awayWon ? 'text-red-600 dark:text-red-400 font-bold' : 'text-neutral-800 dark:text-neutral-200'}`}>
          {match.awayTeam || '待定'}
        </span>
        {match.homeScore !== null && match.awayScore !== null && (
          <span className={`font-display text-[11px] flex-shrink-0 ${awayWon ? 'text-red-600 dark:text-red-400 font-bold' : 'text-neutral-800 dark:text-neutral-200'}`}>
            {match.awayScore}
          </span>
        )}
      </div>

      {correctUsers.length > 0 && (
        <div className="mt-1 pt-1 border-t border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-0.5">
            <span className="text-[8px] text-neutral-400 mr-0.5">猜对:</span>
            <div className="flex -space-x-1">
              {correctUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="relative group">
                  <Avatar
                    src={user.avatar}
                    alt={user.nickname}
                    size="xs"
                    className="w-4 h-4 ring-1 ring-white dark:ring-neutral-800"
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-neutral-800 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {user.nickname}
                  </div>
                </div>
              ))}
              {correctUsers.length > 5 && (
                <div className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center ring-1 ring-white dark:ring-neutral-800">
                  <span className="text-[7px] text-neutral-600 dark:text-neutral-400">+{correctUsers.length - 5}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyMatchCard = () => (
  <div className="bg-white/50 dark:bg-neutral-800/50 border border-dashed border-neutral-200 dark:border-neutral-700 rounded-md p-1.5">
    <div className="flex items-center justify-between gap-1 mb-0.5">
      <span className="text-[9px] text-neutral-400">--/--</span>
      <span className="text-[9px] text-neutral-400">待定</span>
    </div>
    <div className="flex items-center gap-1 px-1 py-0.5">
      <span className="text-xs flex-shrink-0">⚪</span>
      <span className="text-[11px] truncate flex-1 text-neutral-400">待定</span>
    </div>
    <div className="flex items-center gap-1 px-1 py-0.5">
      <span className="text-xs flex-shrink-0">⚪</span>
      <span className="text-[11px] truncate flex-1 text-neutral-400">待定</span>
    </div>
  </div>
);

const PairConnector = () => (
  <div className="absolute right-[-12px] top-0 bottom-0 w-3 pointer-events-none z-0">
    <div className="absolute top-1/4 left-0 w-full h-px bg-neutral-300 dark:bg-neutral-600" />
    <div className="absolute top-3/4 left-0 w-full h-px bg-neutral-300 dark:bg-neutral-600" />
    <div className="absolute top-1/4 bottom-1/4 right-0 w-px bg-neutral-300 dark:bg-neutral-600" />
    <div className="absolute top-1/2 left-full w-full h-px bg-neutral-300 dark:bg-neutral-600" />
  </div>
);

const KnockoutBracket = () => {
  const matches = useAppStore((state) => state.matches);
  const bets = useAppStore((state) => state.bets);
  const users = useAppStore((state) => state.users);

  const knockoutMatches = useMemo(() => {
    const filtered = matches.filter((m) => m.stage === 'knockout');

    const hasMatchNumbers = filtered.some((m) => m.matchNumber);

    if (hasMatchNumbers) {
      return filtered;
    }

    const sorted = [...filtered].sort(
      (a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()
    );

    return sorted.map((match, index) => ({
      ...match,
      matchNumber: String(index + 1),
    }));
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

  if (!hasKnockoutMatches) {
    return (
      <div className="card text-center py-16">
        <div className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </div>
        <p className="text-neutral-500 dark:text-neutral-500 mb-2">暂无淘汰赛数据</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          等待淘汰赛赛程同步
        </p>
      </div>
    );
  }

  const mainRounds = bracketRounds.filter((r) => r.name !== '季军赛');
  const thirdPlaceRound = bracketRounds.find((r) => r.name === '季军赛');

  const renderRound = (round: typeof bracketRounds[0], isLastRound: boolean) => {
    const cardSlots = Array.from({ length: round.count }).map((_, index) =>
      round.matches[index] || null
    );

    if (round.count === 1) {
      return (
        <div key={round.name} className="flex flex-col w-[130px] sm:w-[150px] flex-shrink-0">
          <div className="mb-2 text-center">
            <h3 className={`font-display text-xs font-bold ${round.name === '决赛' ? 'text-amber-600 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {round.name}
            </h3>
          </div>
          <div className="flex flex-col justify-center flex-1">
            {cardSlots[0] ? (
              <MatchCard match={cardSlots[0]} bets={bets} users={users} />
            ) : (
              <EmptyMatchCard />
            )}
          </div>
        </div>
      );
    }

    const pairs: (Match | null)[][] = [];
    for (let i = 0; i < cardSlots.length; i += 2) {
      pairs.push([cardSlots[i], cardSlots[i + 1] || null]);
    }

    return (
      <div key={round.name} className="flex flex-col w-[130px] sm:w-[150px] flex-shrink-0">
        <div className="mb-2 text-center">
          <h3 className="font-display text-xs font-bold text-blue-600 dark:text-blue-400">
            {round.name}
          </h3>
        </div>
        <div className="flex flex-col flex-1 gap-[5px] justify-around">
          {pairs.map((pair, pairIndex) => (
            <div
              key={pairIndex}
              className="relative flex flex-col gap-[5px]"
            >
              {pair[0] ? (
                <MatchCard match={pair[0]} bets={bets} users={users} />
              ) : (
                <EmptyMatchCard />
              )}
              {pair[1] ? (
                <MatchCard match={pair[1]} bets={bets} users={users} />
              ) : (
                <EmptyMatchCard />
              )}
              {!isLastRound && <PairConnector />}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4">
      <div className="flex gap-3 min-w-max items-stretch">
        {mainRounds.map((round, roundIndex) => {
          const isLastRound = roundIndex === mainRounds.length - 1;
          return renderRound(round, isLastRound);
        })}

        {thirdPlaceRound && (
          <div className="flex flex-col w-[130px] sm:w-[150px] flex-shrink-0">
            <div className="mb-2 text-center">
              <h3 className="font-display text-xs text-amber-600 dark:text-amber-400 font-bold">
                {thirdPlaceRound.name}
              </h3>
            </div>
            <div className="flex flex-col justify-center flex-1">
              {thirdPlaceRound.matches[0] ? (
                <MatchCard match={thirdPlaceRound.matches[0]} bets={bets} users={users} />
              ) : (
                <EmptyMatchCard />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnockoutBracket;
