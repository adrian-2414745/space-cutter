const keysDown = new Set();
const keysPressed = new Set();

export function initInput() {
  const gameKeys = new Set([' ', 'ArrowLeft', 'ArrowRight', 'p', 'P']);

  window.addEventListener('keydown', (e) => {
    if (gameKeys.has(e.key)) {
      e.preventDefault();
    }
    if (!keysDown.has(e.key)) {
      keysPressed.add(e.key);
    }
    keysDown.add(e.key);
  });

  window.addEventListener('keyup', (e) => {
    keysDown.delete(e.key);
  });
}

export function isKeyDown(key) {
  return keysDown.has(key);
}

export function consumeKeyPress(key) {
  if (keysPressed.has(key)) {
    keysPressed.delete(key);
    return true;
  }
  return false;
}
