// main.js — one job: boot the game, run the fixed-step loop, and wire the world,
// the renderer, the input layer, and the sound bank together. It also owns the
// ?shot= staging (via shots.js) and sets window.__shotReady only after the
// staged frame has been fully drawn, which is what the screenshot helper waits on.

import { FIELD_W, FIELD_H } from './config.js';
import { World } from './world.js';
import { drawGame, layoutPanels } from './render.js';
import { bindInput, setPanels } from './input.js';
import { SoundBank } from './audio.js';
import { stageShot, shotFromUrl } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');
const scoreLine = document.getElementById('score-line');
const timerFill = document.getElementById('timer-fill');
const timerText = document.getElementById('timer-text');
const leftLine = document.getElementById('left-line');
const hintButton = document.getElementById('hint-btn');
const pauseButton = document.getElementById('pause-btn');
const muteButton = document.getElementById('mute-btn');
const restartButton = document.getElementById('restart-btn');

const world = new World();
const sounds = new SoundBank();
let staged = false;
let shotReadySent = false;
let lastFrame = performance.now();

// resizeCanvas — fits the canvas to its container (the window, minus header and
// footer) and re-registers the panel rectangles with the input layer, so clicks
// keep mapping to the drawn panels after any window resize.
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.max(320, Math.floor(rect.width));
  canvas.height = Math.max(320, Math.floor(rect.height));
  const panels = layoutPanels(canvas.width, canvas.height);
  setPanels(panels.left, panels.right);
}

// formatTime — seconds as MM:SS, rounded up so a live timer never shows 00:00
// while a second is still left to play.
function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// refreshHud — writes the header numbers and the aria-live status line from the
// world, every frame, so the visible counter and the screen-reader line agree.
function refreshHud() {
  const level = world.level();
  scoreLine.textContent = `Score ${world.score} · Best ${world.best} · ${level.name}`;
  timerText.textContent = formatTime(world.timeLeft);
  const limit = level.timeLimitS;
  timerFill.style.width = `${(world.timeLeft / limit) * 100}%`;
  timerFill.style.background = world.timeLeft < 30 ? '#e23b2e' : '#e8b23a';
  leftLine.textContent = `${world.remaining()} left`;
  hintButton.textContent = `Hint (H) — ${world.hintsLeft} left`;
  hintButton.disabled = world.screen !== 'playing' || world.hintsLeft <= 0;
  pauseButton.textContent = world.screen === 'paused' ? 'Resume (P)' : 'Pause (P)';
  muteButton.textContent = sounds.muted ? 'Unmute (M)' : 'Mute (M)';
  if (world.screen === 'playing') {
    statusLine.textContent = `${level.name}: ${world.remaining()} differences left, ${formatTime(world.timeLeft)} remaining.`;
  } else if (world.screen === 'start') {
    statusLine.textContent = 'Moonlit Lantern Market. Press Enter or click to play.';
  } else if (world.screen === 'levelclear') {
    statusLine.textContent = `Level clear! Score ${world.score}. Press N for the next level.`;
  } else if (world.screen === 'win') {
    statusLine.textContent = `You found them all! Final score ${world.score}.`;
  } else if (world.screen === 'timeup') {
    statusLine.textContent = `Time's up. ${world.remaining()} differences left. Press R to retry.`;
  } else if (world.screen === 'paused') {
    statusLine.textContent = 'Paused.';
  }
}

// handleKey — the named keyboard actions from input.js, each guarded by screen.
function handleKey(action) {
  sounds.unlock();
  if (action === 'start' && world.screen === 'start') {
    world.startGame();
    sounds.blip();
  } else if (action === 'hint') {
    const picked = world.useHint();
    if (picked >= 0) sounds.blip();
  } else if (action === 'next') {
    world.nextLevel();
  } else if (action === 'restart') {
    world.startGame();
  } else if (action === 'mute') {
    sounds.muted = !sounds.muted;
  } else if (action === 'pause') {
    world.togglePause();
  }
  refreshHud();
}

// handleFieldClick — a click inside a panel: unlock audio, try the find, and
// play the matching sound (chime on a find, buzz on a wrong click). The panel
// index travels with the click so a moved object is found by its right-panel
// position and the wrong-click X lands on the panel that was clicked.
function handleFieldClick(fx, fy, panelIndex) {
  sounds.unlock();
  if (world.screen === 'start') {
    world.startGame();
    refreshHud();
    return;
  }
  const result = world.tryFind(fx, fy, panelIndex);
  if (result === 'found') sounds.chime();
  else if (result === 'wrong') sounds.buzz();
  refreshHud();
}

// frame — one animation frame: advance the world by the real elapsed time
// (clamped to 0.1s so a hidden tab never jumps the timer), draw, and, in shot
// mode, announce readiness after the first fully drawn staged frame. Sparkles
// freeze while paused, like everything else; the fanfare plays once when the
// screen first becomes level-clear or win (tracked via prevScreen, so a staged
// win shot at boot — prevScreen 'start' — stays silent).
let prevScreen = world.screen;
function frame(now) {
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  world.tick(dt);
  if (world.screen !== 'paused') world.updateSparkles(dt);
  drawGame(ctx, world, canvas.width, canvas.height, now / 1000);
  refreshHud();
  if ((world.screen === 'levelclear' || world.screen === 'win') && prevScreen === 'playing') {
    sounds.fanfare();
  }
  prevScreen = world.screen;
  if (staged && !shotReadySent) {
    shotReadySent = true;
    window.__shotReady = true;
  }
  requestAnimationFrame(frame);
}

// Boot: size the canvas, stage a screenshot state when ?shot= is present,
// wire input and buttons, then start the loop.
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
const shot = shotFromUrl(window.location.href);
if (shot.stage) {
  staged = stageShot(world, shot.stage);
}
bindInput(canvas, {
  fieldW: FIELD_W,
  fieldH: FIELD_H,
  onFieldClick: handleFieldClick,
  onKey: handleKey,
});
// Buttons blur after a click so a later Space press starts the game instead
// of re-firing the focused button.
hintButton.addEventListener('click', (e) => { handleKey('hint'); e.currentTarget.blur(); });
pauseButton.addEventListener('click', (e) => { handleKey('pause'); e.currentTarget.blur(); });
muteButton.addEventListener('click', (e) => { handleKey('mute'); e.currentTarget.blur(); });
restartButton.addEventListener('click', (e) => { handleKey('restart'); e.currentTarget.blur(); });
// A click anywhere on the canvas starts the game from the title screen, as the
// overlay promises ("Click or press Enter to play") — not only clicks on a panel.
canvas.addEventListener('click', () => {
  sounds.unlock();
  if (world.screen === 'start') {
    world.startGame();
    refreshHud();
  }
});
refreshHud();
requestAnimationFrame(frame);
