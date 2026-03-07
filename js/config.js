const DEFAULTS = {
  rectWidth: 600,
  rectHeight: 400,
  timerDuration: 180,
  winThreshold: 5,
};

export const config = { ...DEFAULTS };

export function applyConfigToPanel() {
  document.getElementById('cfg-rect-width').value = config.rectWidth;
  document.getElementById('cfg-rect-height').value = config.rectHeight;
}

export function resetConfigToDefaults() {
  document.getElementById('cfg-rect-width').value = DEFAULTS.rectWidth;
  document.getElementById('cfg-rect-height').value = DEFAULTS.rectHeight;
}

export function loadConfigFromPanel() {
  const w = parseInt(document.getElementById('cfg-rect-width').value, 10);
  const h = parseInt(document.getElementById('cfg-rect-height').value, 10);
  config.rectWidth = Math.max(600, w || 600);
  config.rectHeight = Math.max(400, h || 400);
}
