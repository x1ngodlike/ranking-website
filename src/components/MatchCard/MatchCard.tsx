import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { Match } from '@/types';
import { formatDate } from '@/utils/helpers';
import { Edit2, X, Check, Clock, PlayCircle, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchCardProps {
  match: Match;
  isAdmin?: boolean;
}

const MatchCard = ({ match, isAdmin = false }: MatchCardProps) => {
  const [editing, setEditing] = useState(false);
  const [homeScore, setHomeScore] = useState(match.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(match.awayScore ?? 0);

  const updateMatchScore = useAppStore((state) => state.updateMatchScore);

  const handleSave = () => {
    updateMatchScore(match.id, homeScore, awayScore);
    setEditing(false);
  };

  const getStatusIcon = () => {
    if (match.status === 'finished') return <Trophy size={16} className="text-amber-600 dark:text-gold-400" />;
    if (match.status === 'live') return <PlayCircle size={16} className="text-profit-500 animate-pulse" />;
    return <Clock size={16} className="text-neutral-400" />;
  };

  const getStatusText = () => {
    if (match.status === 'finished') return '已结束';
    if (match.status === 'live') return '进行中';
    return '未开始';
  };

  const getStageLabel = () => {
    if (match.stage === 'knockout') return '淘汰赛';
    if (match.groupName) return `小组赛 ${match.groupName}`;
    return '小组赛';
  };

  return (
    <motion.div
      layout
      className="card overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
            <span className="text-neutral-300 dark:text-neutral-600">•</span>
            <span>{getStageLabel()}</span>
          </div>
          {isAdmin && match.status !== 'live' && (
            <button
              onClick={() => setEditing(!editing)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-neutral-400 hover:text-primary-500 transition-colors"
            >
              {editing ? <X size={16} /> : <Edit2 size={16} />}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="text-3xl flex-shrink-0">{match.homeFlag}</div>
            <div className="min-w-0">
              <p className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                {match.homeTeam}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <AnimatePresence mode="wait">
              {editing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="number"
                    value={homeScore}
                    onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                    className="w-14 h-10 text-center text-xl font-bold rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    min="0"
                  />
                  <span className="text-neutral-400 font-bold">:</span>
                  <input
                    type="number"
                    value={awayScore}
                    onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                    className="w-14 h-10 text-center text-xl font-bold rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    min="0"
                  />
                  <button
                    onClick={handleSave}
                    className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-400 transition-colors"
                  >
                    <Check size={18} />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="score"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center"
                >
                  {match.homeScore !== null && match.awayScore !== null ? (
                    <span className="font-display text-3xl text-neutral-800 dark:text-neutral-200">
                      {match.homeScore} : {match.awayScore}
                    </span>
                  ) : (
                    <span className="font-display text-xl text-neutral-400 dark:text-neutral-500">
                      VS
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 flex items-center gap-3 justify-end">
            <div className="min-w-0 text-right">
              <p className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                {match.awayTeam}
              </p>
            </div>
            <div className="text-3xl flex-shrink-0">{match.awayFlag}</div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            {formatDate(match.matchTime)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default MatchCard;
