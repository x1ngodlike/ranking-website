import { useMemo } from 'react';
import type { Match } from '@/types';
import { formatDate } from '@/utils/helpers';
import { Clock, PlayCircle, Trophy } from 'lucide-react';

interface KnockoutBracketProps {
  matches: Match[];
}

interface BracketMatch {
  match: Match;
  winner?: string;
  loser?: string;
}

interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

const KNOCKOUT_ROUNDS = [
  { key: 'round_of_16', name: '1/8决赛', count: 8 },
  { key: 'quarter_final', name: '1/4决赛', count: 4 },
  { key: 'semi_final', name: '半决赛', count: 2 },
  { key: 'third_place', name: '季军赛', count: 1 },
  { key: 'final', name: '决赛', count: 1 },
];

const getRoundKey = (matchNumber?: string): string => {
  if (!matchNumber) return 'round_of_16';
  const num = parseInt(matchNumber, 10);
  if (num >= 1 && num <= 8) return 'round_of_16';
  if (num >= 9 && num <= 12) return 'quarter_final';
  if (num >= 13 && num <= 14) return 'semi_final';
  if (num === 15) return 'third_place';
  if (num === 16) return 'final';
  return 'round_of_16';
};

const getStatusIcon = (status: Match['status']) => {
  if (status === 'finished') return <Trophy size={14} className="text-amber-600 dark:text-gold-400" />;
  if (status === 'live') return <PlayCircle size={14} className="text-profit-500 animate-pulse" />;
  return <Clock size={14} className="text-neutral-400" />;
};

const getStatusText = (status: Match['status']) => {
  if (status === 'finished') return '已结束';
  if (status === 'live') return '进行中';
  return '未开始';
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

const MatchNode = ({ match }: { match: Match }) => {
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';
  const homeWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
  const awayWon = isFinished && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;

  return (
    <div className="relative">
      <div
        className={`p-3 rounded-xl border-2 transition-all duration-300 ${
          isFinished
            ? 'bg-amber-500/10 border-amber-500/30'
            : isLive
            ? 'bg-profit-500/10 border-profit-500/30'
            : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl flex-shrink-0">{match.homeFlag}</span>
            <span
              className={`font-medium text-sm truncate ${
                homeWon ? 'text-amber-600 dark:text-gold-400 font-bold' : 'text-neutral-800 dark:text-neutral-200'
              }`}
            >
              {match.homeTeam}
            </span>
          </div>

          <div className="flex-shrink-0 text-center">
            {match.homeScore !== null && match.awayScore !== null ? (
              <span
                className={`font-display text-lg ${
                  isLive ? 'text-profit-500' : 'text-neutral-800 dark:text-neutral-200'
                }`}
              >
                {match.homeScore}
                <span className="text-neutral-400 mx-0.5">:</span>
                {match.awayScore}
              </span>
            ) : (
              <span className="text-sm text-neutral-400">VS</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span
              className={`font-medium text-sm truncate text-right ${
                awayWon ? 'text-amber-600 dark:text-gold-400 font-bold' : 'text-neutral-800 dark:text-neutral-200'
              }`}
            >
              {match.awayTeam}
            </span>
            <span className="text-xl flex-shrink-0">{match.awayFlag}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-2">
          {getStatusIcon(match.status)}
          <span className={`text-xs ${isLive ? 'text-profit-500' : 'text-neutral-500 dark:text-neutral-400'}`}>
            {getStatusText(match.status)}
          </span>
          <span className="text-neutral-300 dark:text-neutral-600">•</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {formatDate(match.matchTime)}
          </span>
        </div>
      </div>

      {isFinished && (match.homeScore !== null && match.awayScore !== null) && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0">
          <div className="border-l-8 border-r-8 border-t-8 border-transparent border-t-amber-500/50" />
        </div>
      )}
    </div>
  );
};

const KnockoutBracket = ({ matches }: KnockoutBracketProps) => {
  const knockoutMatches = useMemo(() => {
    return matches.filter((m) => m.stage === 'knockout');
  }, [matches]);

  const bracketRounds: BracketRound[] = useMemo(() => {
    return KNOCKOUT_ROUNDS.map((round) => ({
      name: round.name,
      matches: getRoundMatches(knockoutMatches, round.key).map((match) => ({
        match,
      })),
    }));
  }, [knockoutMatches]);

  const hasKnockoutMatches = knockoutMatches.length > 0;

  if (!hasKnockoutMatches) {
    return (
      <div className="card text-center py-16">
        <div className="w-16 h-16 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
          <Trophy size={32} className="text-neutral-600 dark:text-neutral-400" />
        </div>
        <p className="text-neutral-500 dark:text-neutral-500 mb-2">暂无淘汰赛数据</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          等待淘汰赛赛程同步
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max px-4">
        {bracketRounds.map((round, roundIndex) => (
          <div key={round.name} className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <h3 className="font-display text-lg text-blue-600 dark:text-blue-400">
                {round.name}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {round.matches.length} 场比赛
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {round.matches.map((bracketMatch, matchIndex) => (
                <div key={`${round.name}-${matchIndex}`}>
                  <MatchNode match={bracketMatch.match} />

                  {roundIndex < bracketRounds.length - 1 && round.name !== 'third_place' && (
                    <div className="flex flex-col items-center mt-2">
                      <div className="w-px h-4 bg-gradient-to-b from-amber-500/30 to-transparent" />
                      <div className="w-8 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {roundIndex < bracketRounds.length - 1 && (
              <div className="flex flex-col items-center mt-2">
                <div className="w-px h-6 bg-gradient-to-b from-amber-500/30 to-transparent" />
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnockoutBracket;