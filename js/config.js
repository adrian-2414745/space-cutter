import { isMobile } from './mobile.js';

export const DEFAULTS = {
  rectWidth: 600,
  rectHeight: 600,
  timerDuration: 180,
  winThreshold: 15,
  scissorsBorderSpeed: 400,
  scissorsCutSpeed: 350,
  cornerSnapDistance: 0,
  ballSpeed: 150,
  ballRadius: 6,
  ballDensityPx2: 50000,
  minBalls: 2,
  densityRampK: 2,
  failPenalty: 'low',
  touchSensitivity: 1.0,
  minCutDepth: 20,
};

export const MOBILE_DEFAULTS = {
  ...DEFAULTS,
  timerDuration: 240,
  ballSpeed: 120,
  touchSensitivity: 2.5,
};

export const config = isMobile ? { ...MOBILE_DEFAULTS } : { ...DEFAULTS };
