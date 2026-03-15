import { gameState, setState, IDLE, RUNNING } from './state.js';
import { config, DEFAULTS, MOBILE_DEFAULTS } from './config.js';
import { drawScore, drawLiveScore, drawTimer } from './renderer.js';
import { isMobile } from './mobile.js';

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
  document.getElementById('cfg-ball-density').value = config.ballDensityPx2;
  document.getElementById('cfg-min-balls').value = config.minBalls;
  document.getElementById('cfg-density-ramp').value = config.densityRampK;
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
  config.cornerSnapDistance = c;
  const wt = parseInt(document.getElementById('cfg-win-threshold').value, 10);
  config.winThreshold = Math.max(1, wt || 5);
  const bs = parseInt(document.getElementById('cfg-ball-speed').value, 10);
  config.ballSpeed = Math.max(10, bs || 150);
  const br = parseInt(document.getElementById('cfg-ball-radius').value, 10);
  config.ballRadius = Math.max(2, br || 6);
  const bd = parseInt(document.getElementById('cfg-ball-density').value, 10);
  config.ballDensityPx2 = Math.max(1000, bd || 72000);
  const mb = parseInt(document.getElementById('cfg-min-balls').value, 10);
  config.minBalls = Math.max(1, mb || 2);
  const dr = parseFloat(document.getElementById('cfg-density-ramp').value);
  config.densityRampK = Math.max(0, Math.min(5, dr || 2));
  config.failPenalty = document.getElementById('cfg-fail-penalty').value;
  const ts = parseFloat(document.getElementById('cfg-touch-sensitivity').value);
  config.touchSensitivity = Math.max(0.5, Math.min(5.0, ts || 2.5));
}



export function initUI(resetCallback) {


  console.log("initUI")
  document.getElementById('btn-start').addEventListener('click', handleStart);
  document.getElementById('btn-reset').addEventListener('click', () => handleReset(resetCallback));
  document.getElementById('btn-config').addEventListener('click', handleConfig);
  document.getElementById('btn-save-config').addEventListener('click', () => handleSaveConfig(resetCallback));
  document.getElementById('btn-reset-config').addEventListener('click', resetConfigToDefaults);

  const btnHelp      = document.getElementById('btn-help');
  const helpPanel    = document.getElementById('help-panel');
  const btnCloseHelp = document.getElementById('btn-close-help');

  if (!isMobile) btnHelp.style.display = 'none';

  btnHelp.addEventListener('click', () => {
    helpPanel.classList.remove('hidden');
  });

  btnCloseHelp.addEventListener('click', () => {
    helpPanel.classList.add('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!helpPanel.classList.contains('hidden') && !helpPanel.contains(e.target) && e.target !== btnHelp) {
      helpPanel.classList.add('hidden');
    }
  });
}

function handleStart() {
  if (gameState.state === IDLE) {
    setState(RUNNING);
    document.getElementById('btn-start').disabled = true;
  }
}

function handleReset(resetCallback) {
  resetCallback();
  drawScore(gameState.score);
  drawLiveScore(0);
  drawTimer(gameState.timeRemaining);
  document.getElementById('btn-start').disabled = false;
}

function handleConfig() {
  if (gameState.state !== IDLE) return;
  applyConfigToPanel();
  document.getElementById('config-panel').classList.remove('hidden');
}

function handleSaveConfig(resetCallback) {
  loadConfigFromPanel();
  document.getElementById('config-panel').classList.add('hidden');
  resetCallback();
}
