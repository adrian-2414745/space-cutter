import { gameState, setState, IDLE, RUNNING } from './state.js';
import { config, loadConfigFromPanel, applyConfigToPanel, resetConfigToDefaults } from './config.js';
import { drawScore, drawLiveScore, drawTimer } from './renderer.js';
import { isMobile } from './mobile.js';

let onReset = null;

export function initUI(resetCallback) {
  onReset = resetCallback;

  document.getElementById('btn-start').addEventListener('click', handleStart);
  document.getElementById('btn-reset').addEventListener('click', handleReset);
  document.getElementById('btn-config').addEventListener('click', handleConfig);
  document.getElementById('btn-save-config').addEventListener('click', handleSaveConfig);
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

function handleReset() {
  setState(IDLE);
  gameState.score = 100;
  gameState.timeRemaining = config.timerDuration;
  gameState.successfulCuts = 0;
  gameState.failedCuts = 0;
  gameState.finalScore = null;
  drawScore(gameState.score);
  drawLiveScore(0);
  drawTimer(gameState.timeRemaining);
  document.getElementById('btn-start').disabled = false;
  if (onReset) onReset();
}

function handleConfig() {
  if (gameState.state !== IDLE) return;
  applyConfigToPanel();
  document.getElementById('config-panel').classList.remove('hidden');
}

function handleSaveConfig() {
  loadConfigFromPanel();
  document.getElementById('config-panel').classList.add('hidden');
  if (onReset) onReset();
}
