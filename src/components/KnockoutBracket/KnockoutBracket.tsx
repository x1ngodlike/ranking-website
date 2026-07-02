import { useMemo } from 'react';
import type { Match, Bet, User } from '@/types';
import { formatDate } from '@/utils/helpers';
import Avatar from '@/components/Avatar';

interface KnockoutBracketProps {
  matches: Match[];
  bets?: Bet[];
  users?: User[];
}

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

// 判断预测是否正确（胜负方向正确即可）
const isPredictionCorrect = (match: Match, bet: Bet): boolean => {
  if (!match.homeScore || !match.awayScore || !bet.predictedHomeScore || !bet.predictedAwayScore) {
    return false;
  }
  const actualWinner = match.homeScore > match.awayScore ? 'home' : 'away';
  const predictedWinner = bet.predictedHomeScore > bet.predictedAwayScore ? 'home' : 'away';
  return actualWinner === predictedWinner;
};

// 获取猜对比赛的用户列表
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
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {formatDate(match.matchTime)}
        </span>
        <span className={`text-xs ${isFinished ? 'text-green-500' : 'text-neutral-400'}`}>
          {isFinished ? '已结束' : '未开赛'}
        </span>
      </div>

      {/* 主队 - 上方 */}
      <div className={`flex items-center gap-2 p-1.5 rounded ${homeWon ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
        <span className="text-base flex-shrink-0">{match.homeFlag || '⚪'}</span>
        <span className={`text-sm truncate flex-1 ${homeWon ? 'text-red-600 dark:text-red-400 font-bold' : 'text-neutral-800 dark:text-neutral-200'}`}>
          {match.homeTeam || '待定'}
        </span>
        {match.homeScore !== null && match.awayScore !== null && (
          <span className={`font-display text-sm flex-shrink-0 ${homeWon ? 'text-red-600 dark:text-red-400 font-bold' : 'text-neutral-800 dark:text-neutral-200'}`}>
            {match.homeScore}
          </span>
        )}
      </div>

      {/* 客队 - 下方 */}
      <div className={`flex items-center gap-2 p-1.5 rounded ${awayWon ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
        <span className="text-base flex-shrink-0">{match.awayFlag || '⚪'}</span>
        <span className={`text-sm truncate flex-1 ${awayWon ? 'text-red-600 dark:text-red-400 font-bold' : 'text-neutral-800 dark:text-neutral-200'}`}>
          {match.awayTeam || '待定'}
        </span>
        {match.homeScore !== null && match.awayScore !== null && (
          <span className={`font-display text-sm flex-shrink-0 ${awayWon ? 'text-red-600 dark:text-red-400 font-bold' : 'text-neutral-800 dark:text-neutral-200'}`}>
            {match.awayScore}
          </span>
        )}
      </div>



      {/* 猜对用户的头像展示 */}
      {correctUsers.length > 0 && (
        <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-400 mr-1">猜对:</span>
            <div className="flex -space-x-1.5">
              {correctUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="relative group">
                  <Avatar 
                    src={user.avatar} 
                    alt={user.nickname} 
                    size="xs" 
                    className="w-5 h-5 ring-1 ring-white dark:ring-neutral-800"
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-neutral-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {user.nickname}
                  </div>
                </div>
              ))}
              {correctUsers.length > 5 && (
                <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center ring-1 ring-white dark:ring-neutral-800">
                  <span className="text-[8px] text-neutral-600 dark:text-neutral-400">+{correctUsers.length - 5}</span>
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
  <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between gap-1 mb-1">
      <span className="text-xs text-neutral-500 dark:text-neutral-400">--/-- --:--</span>
      <span className="text-xs text-neutral-400">未开赛</span>
    </div>

    <div className="flex items-center gap-2 p-1.5 rounded">
      <span className="text-base flex-shrink-0">⚪</span>
      <span className="text-sm truncate flex-1 text-neutral-800 dark:text-neutral-200">待定</span>
    </div>

    <div className="flex items-center gap-2 p-1.5 rounded">
      <span className="text-base flex-shrink-0">⚪</span>
      <span className="text-sm truncate flex-1 text-neutral-800 dark:text-neutral-200">待定</span>
    </div>
  </div>
);



const KnockoutBracket = ({ matches, bets = [], users = [] }: KnockoutBracketProps) => {
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

  // 决赛和季军赛单独处理，放在最后两列
  const mainRounds = bracketRounds.filter((r) => r.name !== '季军赛');
  const thirdPlaceRound = bracketRounds.find((r) => r.name === '季军赛');

  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4">
      <div className="flex gap-4 min-w-max items-stretch">
        {mainRounds.map((round) => (
          <div key={round.name} className="flex flex-col w-[180px] sm:w-[200px] flex-shrink-0">
            <div className="mb-4 text-center">
              <h3 className={`font-display text-base font-bold ${round.name === '决赛' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {round.name}
              </h3>
            </div>

            {/* 比赛列表 - 显示固定数量的卡片，有数据显示MatchCard，无数据显示占位 */}
            <div className="flex flex-col justify-around flex-1 gap-3">
              {Array.from({ length: round.count }).map((_, index) => {
                const matchIndex = index;
                const match = round.matches[matchIndex];
                
                if (match) {
                  return <MatchCard key={match.id} match={match} bets={bets} users={users} />;
                } else {
                  return <EmptyMatchCard key={`${round.key}-${index}`} />;
                }
              })}
            </div>
          </div>
        ))}

        {/* 季军赛作为独立列放在决赛后面 */}
        {thirdPlaceRound && (
          <div className="flex flex-col w-[180px] sm:w-[200px] flex-shrink-0">
            <div className="mb-4 text-center">
              <h3 className="font-display text-base text-amber-600 dark:text-amber-400 font-bold">
                {thirdPlaceRound.name}
              </h3>
            </div>
            <div className="flex flex-col justify-around flex-1 gap-3">
              {Array.from({ length: thirdPlaceRound.count }).map((_, index) => {
                const match = thirdPlaceRound.matches[index];
                if (match) {
                  return <MatchCard key={match.id} match={match} bets={bets} users={users} />;
                } else {
                  return <EmptyMatchCard key={`${thirdPlaceRound.key}-${index}`} />;
                }
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnockoutBracket;
