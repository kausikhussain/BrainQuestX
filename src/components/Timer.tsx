import React, { useEffect, useState, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { competitionService } from '../services/competitionService';
import { sound } from '../utils/audio';

interface TimerProps {
  deadline: string | null;
  totalDurationSeconds?: number;
  onExpire?: () => void;
  isLocked?: boolean;
}

export const Timer: React.FC<TimerProps> = ({
  deadline,
  totalDurationSeconds = 20,
  onExpire,
  isLocked = false,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(totalDurationSeconds);
  const [fractionRemaining, setFractionRemaining] = useState<number>(1);
  const [hasExpired, setHasExpired] = useState<boolean>(false);
  const lastTickedSecondRef = useRef<number | null>(null);

  useEffect(() => {
    if (!deadline) {
      setSecondsRemaining(totalDurationSeconds);
      setFractionRemaining(1);
      setHasExpired(false);
      lastTickedSecondRef.current = null;
      return;
    }

    const deadlineMs = new Date(deadline).getTime();
    let animationFrameId: number;
    let expiredTriggered = false;

    const updateTimer = () => {
      const now = competitionService.getEstimatedServerTime();
      const diffMs = deadlineMs - now;

      if (diffMs <= 0) {
        setSecondsRemaining(0);
        setFractionRemaining(0);
        setHasExpired(true);

        if (!expiredTriggered) {
          expiredTriggered = true;
          sound.playTimeExpired();
          if (onExpire) onExpire();
        }
        return;
      }

      const totalMs = totalDurationSeconds * 1000;
      const fraction = Math.max(0, Math.min(1, diffMs / totalMs));
      const secs = Math.ceil(diffMs / 1000);

      // Audio cue during critical 3s
      if (secs <= 3 && secs > 0 && lastTickedSecondRef.current !== secs && !isLocked) {
        lastTickedSecondRef.current = secs;
        sound.playTick(true);
      }

      setSecondsRemaining(secs);
      setFractionRemaining(fraction);

      animationFrameId = requestAnimationFrame(updateTimer);
    };

    updateTimer();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [deadline, totalDurationSeconds, onExpire, isLocked]);

  // Visual phases
  const isCritical = secondsRemaining <= 3 && secondsRemaining > 0;
  const isWarning = secondsRemaining <= 5 && secondsRemaining > 3;

  const getPhaseStyles = () => {
    if (hasExpired || secondsRemaining === 0) {
      return {
        text: 'text-rose-500',
        bar: 'bg-rose-500',
        badge: 'bg-rose-950/50 border-rose-800 text-rose-300',
        glow: 'border-rose-500/50 shadow-rose-900/30',
      };
    }
    if (isCritical) {
      return {
        text: 'text-rose-400',
        bar: 'bg-rose-500 animate-pulse',
        badge: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
        glow: 'border-rose-500 shadow-rose-500/40 shadow-lg',
      };
    }
    if (isWarning) {
      return {
        text: 'text-amber-400',
        bar: 'bg-amber-500',
        badge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
        glow: 'border-amber-500/50 shadow-amber-500/20 shadow-md',
      };
    }
    return {
      text: 'text-cyan-300',
      bar: 'bg-gradient-to-r from-indigo-500 to-cyan-400',
      badge: 'bg-[#121A2B] border-[#22304C] text-slate-300',
      glow: 'border-[#22304C]',
    };
  };

  const styles = getPhaseStyles();

  return (
    <div className="w-full">
      {/* Top Countdown Display */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCritical ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
          ) : (
            <Clock className={`w-4 h-4 ${isWarning ? 'text-amber-400' : 'text-slate-400'}`} />
          )}
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Time Remaining
          </span>
        </div>

        <div className={`px-3 py-1 rounded-full border text-xs font-mono font-bold transition-all ${styles.badge} ${styles.glow}`}>
          {isLocked ? (
            <span className="text-indigo-300 font-sans font-semibold">Answer Locked</span>
          ) : (
            <span className={`text-base ${styles.text}`}>
              {String(secondsRemaining).padStart(2, '0')}s
            </span>
          )}
        </div>
      </div>

      {/* Authoritative Progress Bar */}
      <div className="w-full h-2 rounded-full bg-[#121A2B] border border-[#22304C] overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear ${styles.bar}`}
          style={{ width: `${Math.round(fractionRemaining * 100)}%` }}
        />
      </div>
    </div>
  );
};
