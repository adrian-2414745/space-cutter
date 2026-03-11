import { isMobile } from './mobile.js';

const DEFAULTS = {
  rectWidth: 600,
  rectHeight: 600,
  timerDuration: 180,
  winThreshold: 15,
  scissorsBorderSpeed: 250,
  scissorsCutSpeed: 300,
  cornerSnapDistance: 8,
  ballSpeed: 150,
  ballRadius: 6,
  initialBallCount: 2,
  failPenalty: 'low',
  touchSensitivity: 1.0,
  minCutDepth: 20,
};

const MOBILE_DEFAULTS = {
  ...DEFAULTS,
  timerDuration: 240,
  ballSpeed: 120,
  touchSensitivity: 2.5,
};

export const config = isMobile ? { ...MOBILE_DEFAULTS } : { ...DEFAULTS };

export function applyConfigToPanel() {
  document.getElementById('cfg-rect-width').value = config.rectWidth;
  document.getElementById('cfg-rect-height').value = config.rectHeight;
  document.getElementById('cfg-timer-duration').value = config.timerDuration;
  document.getElementById('cfg-scissors-speed').value = config.scissorsBorderSpeed;
  document.getElementById('cfg-cut-speed').value = config.scissorsCutSpeed;
  document.getElementById('cfg-corner-snap').value = config.cornerSnapDistance;
  document.getElementById('cfg-win-threshold').value = config.winThreshold;
  document.getElementById('cfg-ball-speed').value = config.ballSpeed;
  document.getElementById('cfg-ball-radius').value = config.ballRadius;
  document.getElementById('cfg-ball-count').value = config.initialBallCount;
  document.getElementById('cfg-fail-penalty').value = config.failPenalty;
  document.getElementById('cfg-touch-sensitivity').value = config.touchSensitivity;
}

export function resetConfigToDefaults() {
  const defaults = isMobile ? MOBILE_DEFAULTS : DEFAULTS;
  Object.assign(config, defaults);
  applyConfigToPanel();
}

export function loadConfigFromPanel() {
  const w = parseInt(document.getElementById('cfg-rect-width').value, 10);
  const h = parseInt(document.getElementById('cfg-rect-height').value, 10);
  const t = parseInt(document.getElementById('cfg-timer-duration').value, 10);
  if (!isMobile) {
    config.rectWidth = Math.max(600, w || 600);
    config.rectHeight = Math.max(400, h || 400);
  }
  config.timerDuration = Math.max(10, t || 180);
  const s = parseInt(document.getElementById('cfg-scissors-speed').value, 10);
  const c = parseInt(document.getElementById('cfg-corner-snap').value, 10);
  config.scissorsBorderSpeed = Math.max(50, s || 200);
  const cs = parseInt(document.getElementById('cfg-cut-speed').value, 10);
  config.scissorsCutSpeed = Math.max(50, cs || 300);
  config.cornerSnapDistance = Math.max(1, c || 8);
  const wt = parseInt(document.getElementById('cfg-win-threshold').value, 10);
  config.winThreshold = Math.max(1, wt || 5);
  const bs = parseInt(document.getElementById('cfg-ball-speed').value, 10);
  config.ballSpeed = Math.max(10, bs || 150);
  const br = parseInt(document.getElementById('cfg-ball-radius').value, 10);
  config.ballRadius = Math.max(2, br || 6);
  const bc = parseInt(document.getElementById('cfg-ball-count').value, 10);
  config.initialBallCount = Math.max(1, bc || 1);
  config.failPenalty = document.getElementById('cfg-fail-penalty').value;
  const ts = parseFloat(document.getElementById('cfg-touch-sensitivity').value);
  config.touchSensitivity = Math.max(0.5, Math.min(5.0, ts || 2.5));
}
