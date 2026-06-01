// Slither.io length/score tables and helpers (from official game.js setMscps)
const SLITHER_MSCPS = 411;
let SLITHER_FPSLS = [];
let SLITHER_FMLTS = [];

function buildSlitherTables(mscps = SLITHER_MSCPS) {
  const fmlts = [];
  const fpsls = [];
  for (let i = 0; i <= mscps; i++) {
    if (i >= mscps) fmlts.push(fmlts[i - 1]);
    else fmlts.push(Math.pow(1 - i / mscps, 2.25));
    if (i === 0) fpsls.push(0);
    else fpsls.push(fpsls[i - 1] + 1 / fmlts[i - 1]);
  }
  const tFmlt = fmlts[mscps];
  const tFpsl = fpsls[mscps];
  for (let i = 0; i < 2048; i++) {
    fmlts.push(tFmlt);
    fpsls.push(tFpsl);
  }
  SLITHER_FMLTS = fmlts;
  SLITHER_FPSLS = fpsls;
}

buildSlitherTables();

function slitherBodyIndex(snake) {
  return snake.sct + (snake.rsc || 0);
}

function slitherVolume(snake) {
  const s = slitherBodyIndex(snake);
  return SLITHER_FPSLS[s] + snake.fam / SLITHER_FMLTS[s];
}

function setSlitherVolume(snake, volume) {
  let sct = 2;
  while (sct + 1 < SLITHER_FPSLS.length && SLITHER_FPSLS[sct + 1] <= volume + 1e-9) sct++;
  let fam = (volume - SLITHER_FPSLS[sct]) * SLITHER_FMLTS[sct];
  while (fam >= 1 && sct < SLITHER_FPSLS.length - 1) {
    fam -= 1;
    sct++;
  }
  snake.sct = Math.max(2, sct);
  snake.fam = Math.max(0, fam);
}

function getSlitherScore(snake) {
  const s = slitherBodyIndex(snake);
  return Math.floor((SLITHER_FPSLS[s] + snake.fam / SLITHER_FMLTS[s] - 1) * 15 - 5);
}

function addSlitherLength(snake, lengthPoints) {
  if (lengthPoints <= 0) return;
  setSlitherVolume(snake, slitherVolume(snake) + lengthPoints / 15);
}

function removeSlitherLength(snake, lengthPoints) {
  if (lengthPoints <= 0) return;
  const minVol = SLITHER_FPSLS[2];
  setSlitherVolume(snake, Math.max(minVol, slitherVolume(snake) - lengthPoints / 15));
}

function newSlitherStats() {
  return { sct: 2, fam: 0, rsc: 0 };
}

function randomSlitherStats() {
  const stats = newSlitherStats();
  addSlitherLength(stats, Math.random() * 80);
  return stats;
}

function slitherThickness(snake) {
  const sc = Math.min(6, 1 + (snake.sct - 2) / 106);
  return sc;
}

function slitherSegmentsForSnake(snake) {
  return Math.max(8, Math.floor(6 + snake.sct * 0.55 + snake.fam * 0.55));
}

function slitherZoomScale(snake) {
  return 0.64285 + 0.514285714 / Math.max(1, (snake.sct + 16) / 36);
}

function foodSlitherLength(big = false) {
  if (big) return 5 + Math.random() * 15;
  return 0.5 + Math.random() * 4.5;
}

function syncSnakeSegments(snake) {
  const target = slitherSegmentsForSnake(snake);
  if (!snake.segments.length) return;
  while (snake.segments.length < target) {
    const tail = snake.segments[snake.segments.length - 1];
    snake.segments.push({ x: tail.x, y: tail.y });
  }
  while (snake.segments.length > target && snake.segments.length > 8) {
    snake.segments.pop();
  }
}

function snakeRadiusFromSlither(snake) {
  const sc = slitherThickness(snake);
  return Math.min(28, 7 + sc * 3.5);
}
