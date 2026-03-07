const DEFAULTS = {
  rectWidth: 600,
  rectHeight: 400,
  timerDuration: 180,
  winThreshold: 5,
  scissorsBorderSpeed: 200,
  scissorsCutSpeed: 300,
  cornerSnapDistance: 8,
};

export const config = { ...DEFAULTS };

export function applyConfigToPanel() {
  document.getElementById('cfg-rect-width').value = config.rectWidth;
  document.getElementById('cfg-rect-height').value = config.rectHeight;
  document.getElementById('cfg-timer-duration').value = config.timerDuration;
  document.getElementById('cfg-scissors-speed').value = config.scissorsBorderSpeed;
  document.getElementById('cfg-cut-speed').value = config.scissorsCutSpeed;
  document.getElementById('cfg-corner-snap').value = config.cornerSnapDistance;
  document.getElementById('cfg-win-threshold').value = config.winThreshold;
}

export function resetConfigToDefaults() {
  document.getElementById('cfg-rect-width').value = DEFAULTS.rectWidth;
  document.getElementById('cfg-rect-height').value = DEFAULTS.rectHeight;
  document.getElementById('cfg-timer-duration').value = DEFAULTS.timerDuration;
  document.getElementById('cfg-scissors-speed').value = DEFAULTS.scissorsBorderSpeed;
  document.getElementById('cfg-cut-speed').value = DEFAULTS.scissorsCutSpeed;
  document.getElementById('cfg-corner-snap').value = DEFAULTS.cornerSnapDistance;
  document.getElementById('cfg-win-threshold').value = DEFAULTS.winThreshold;
}

export function loadConfigFromPanel() {
  const w = parseInt(document.getElementById('cfg-rect-width').value, 10);
  const h = parseInt(document.getElementById('cfg-rect-height').value, 10);
  const t = parseInt(document.getElementById('cfg-timer-duration').value, 10);
  config.rectWidth = Math.max(600, w || 600);
  config.rectHeight = Math.max(400, h || 400);
  config.timerDuration = Math.max(10, t || 180);
  const s = parseInt(document.getElementById('cfg-scissors-speed').value, 10);
  const c = parseInt(document.getElementById('cfg-corner-snap').value, 10);
  config.scissorsBorderSpeed = Math.max(50, s || 200);
  const cs = parseInt(document.getElementById('cfg-cut-speed').value, 10);
  config.scissorsCutSpeed = Math.max(50, cs || 300);
  config.cornerSnapDistance = Math.max(1, c || 8);
  const wt = parseInt(document.getElementById('cfg-win-threshold').value, 10);
  config.winThreshold = Math.max(1, wt || 5);
}
