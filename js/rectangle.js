export function createInitialRectangle(config, canvasWidth, canvasHeight) {
  return {
    x: (canvasWidth - config.rectWidth) / 2,
    y: (canvasHeight - config.rectHeight) / 2,
    width: config.rectWidth,
    height: config.rectHeight,
  };
}
