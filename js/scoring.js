export const PENALTY_VALUES = { none: 0, low: 15, moderate: 35, heavy: 60 };

export function calculateScore(areaPercent, won, timeRemaining, totalTime, successfulCuts, failedCuts, winThreshold, penaltyLevel) {
  const idealCuts = Math.ceil(Math.log2(100 / winThreshold));
  const base = (100 - areaPercent) * 10;
  const timeMult = won ? 1 + (timeRemaining / totalTime) : 1.0;
  const effMult = successfulCuts > 0 ? 1 + (idealCuts / successfulCuts) : 1.0;
  const penalty = failedCuts * (PENALTY_VALUES[penaltyLevel] || 0);

  return Math.max(0, Math.round(base * timeMult * effMult - penalty));
}
