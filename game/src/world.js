// world.js — one job: the game's state and rules, with no DOM in it, so the same
// code runs in the browser and in a headless Node simulation. The renderer reads
// this state; the input layer calls its methods. Times are seconds, scores are
// points, positions are field pixels (600x540, see config.js).

import {
  LEVELS, CLICK_TOLERANCE_PX, FIND_POINTS, WRONG_TIME_PENALTY_S,
  WRONG_SCORE_PENALTY, HINT_COST, HINTS_PER_LEVEL, HINT_COOLDOWN_S,
  TIME_BONUS_PER_S, BEST_KEY, TOAST_MS, SHAKE_MS, SPARKLE_COUNT,
  WRONG_FLASH_MS, CLEAR_TOAST_MS, HINT_RING_MS, diffPoint,
} from './config.js';

// Screens the game can be on: 'start' (title) | 'playing' | 'paused' |
// 'levelclear' (one level done) | 'win' (all levels done) | 'timeup'.
export class World {
  // options.tolerancePx overrides CLICK_TOLERANCE_PX (tests only; the browser
  // always uses the live value). It exists so the ±20% sweep is a real run,
  // not a claim about exact-centre clicks.
  constructor(options = {}) {
    this.tolerancePx = options.tolerancePx ?? CLICK_TOLERANCE_PX;
    this.screen = 'start';
    this.levelIndex = 0;
    this.score = 0;
    this.best = 0;
    this.found = new Set();
    this.hintsLeft = HINTS_PER_LEVEL;
    this.hintCooldown = 0;
    this.hintIndex = -1;
    this.hintUntil = 0;
    this.hinted = new Set();
    this.timeLeft = LEVELS[0].timeLimitS;
    this.shakeUntil = 0;
    this.toast = null;
    this.toastUntil = 0;
    this.wrongFlashUntil = 0;
    this.wrongAt = null;
    this.sparkles = [];
    this.now = 0;
    this.loadBest();
  }

  // loadBest / saveBest — best total score in localStorage, guarded so a missing
  // or blocked storage (private mode, Node) never throws.
  loadBest() {
    try {
      this.best = Number(globalThis.localStorage?.getItem(BEST_KEY) || 0) || 0;
    } catch {
      this.best = 0;
    }
  }

  saveBest() {
    try {
      globalThis.localStorage?.setItem(BEST_KEY, String(this.best));
    } catch {
      // Storage unavailable: the in-memory best still shows this session.
    }
  }

  level() {
    return LEVELS[this.levelIndex];
  }

  remaining() {
    return this.level().differences.length - this.found.size;
  }

  // startLevel — (re)starts a level: fresh finds, hints, and full timer.
  startLevel(index) {
    this.levelIndex = index;
    this.found = new Set();
    this.hintsLeft = HINTS_PER_LEVEL;
    this.hintCooldown = 0;
    this.hintIndex = -1;
    this.hintUntil = 0;
    this.hinted = new Set();
    this.timeLeft = LEVELS[index].timeLimitS;
    this.toast = null;
    this.wrongAt = null;
    this.sparkles = [];
    this.screen = 'playing';
  }

  // startGame — fresh run from level 1 with score zero.
  startGame() {
    this.score = 0;
    this.startLevel(0);
  }

  // endTimeUp — the one time-up path every branch uses: screen to 'timeup'
  // and save the best score. (A wrong click that burns the last seconds ends
  // the run the same way the timer reaching 0 does.)
  endTimeUp() {
    this.timeLeft = 0;
    this.screen = 'timeup';
    if (this.score > this.best) {
      this.best = this.score;
      this.saveBest();
    }
  }

  // tick — advances the game clock by dt seconds. Nothing advances while the
  // game is not playing: the timer, the hint cooldown, the hint ring and the
  // toast/shake clocks all freeze together on pause, and resume together.
  tick(dt) {
    if (this.screen !== 'playing') return;
    this.now += dt;
    if (this.hintCooldown > 0) this.hintCooldown = Math.max(0, this.hintCooldown - dt);
    if (this.hintIndex >= 0 && this.now > this.hintUntil) this.hintIndex = -1;
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (this.timeLeft <= 0) this.endTimeUp();
  }

  // tryFind — a click at field (fx, fy) on panel panelIndex (0 left, 1 right).
  // Returns 'found' | 'already' | 'wrong': 'found' marks the nearest unfound
  // difference within this.tolerancePx of the point of the panel that was
  // clicked (diffPoint: a moved/flipped feature has its own right-panel point)
  // and awards FIND_POINTS; 'already' is a click on a found difference (no
  // penalty); 'wrong' costs WRONG_TIME_PENALTY_S seconds and
  // WRONG_SCORE_PENALTY points. Edge cases: clicks while not playing are
  // ignored (returns 'ignored'); a click exactly on a found ring is 'already',
  // never a penalty; a wrong click that burns the last seconds ends via
  // endTimeUp, so the best score is saved exactly as on a timer time-up.
  tryFind(fx, fy, panelIndex = 0) {
    if (this.screen !== 'playing') return 'ignored';
    const right = panelIndex === 1;
    const diffs = this.level().differences;
    let bestIdx = -1;
    let bestDist = Infinity;
    diffs.forEach((d, i) => {
      if (this.found.has(i)) return;
      const p = diffPoint(d, right);
      const dist = Math.hypot(fx - p.x, fy - p.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });
    if (bestIdx >= 0 && bestDist <= this.tolerancePx) {
      this.found.add(bestIdx);
      this.score += FIND_POINTS;
      this.toast = `Found: ${diffs[bestIdx].label}! +${FIND_POINTS}`;
      this.toastUntil = this.now + TOAST_MS / 1000;
      this.hintIndex = -1;
      this.spawnSparkles(diffs[bestIdx]);
      if (this.found.size === diffs.length) this.clearLevel();
      return 'found';
    }
    if (bestIdx >= 0) {
      let foundDist = Infinity;
      diffs.forEach((d, i) => {
        if (!this.found.has(i)) return;
        const p = diffPoint(d, right);
        foundDist = Math.min(foundDist, Math.hypot(fx - p.x, fy - p.y));
      });
      if (foundDist <= this.tolerancePx) return 'already';
    }
    this.timeLeft = Math.max(0, this.timeLeft - WRONG_TIME_PENALTY_S);
    this.score = Math.max(0, this.score - WRONG_SCORE_PENALTY);
    this.wrongAt = { x: fx, y: fy, panel: panelIndex };
    this.wrongFlashUntil = this.now + WRONG_FLASH_MS / 1000;
    this.shakeUntil = this.now + SHAKE_MS / 1000;
    this.toast = `Not there! -${WRONG_TIME_PENALTY_S}s, -${WRONG_SCORE_PENALTY} pts`;
    this.toastUntil = this.now + TOAST_MS / 1000;
    if (this.timeLeft <= 0) this.endTimeUp();
    return 'wrong';
  }

  // spawnSparkles — a burst of SPARKLE_COUNT particles at a found difference,
  // one burst on each panel at that panel's point (a moved/flipped feature
  // bursts where it actually sits on each side). Each particle carries its
  // panel so the renderer only paints it on that side.
  spawnSparkles(diff) {
    for (let panel = 0; panel <= 1; panel += 1) {
      const p = diffPoint(diff, panel === 1);
      for (let i = 0; i < SPARKLE_COUNT; i += 1) {
        const angle = (i / SPARKLE_COUNT) * Math.PI * 2;
        this.sparkles.push({
          x: p.x + Math.cos(angle) * 6,
          y: p.y + Math.sin(angle) * 6,
          vx: Math.cos(angle) * 40,
          vy: Math.sin(angle) * 40 - 20,
          life: 0.7,
          maxLife: 0.7,
          panel,
        });
      }
    }
  }

  // updateSparkles — moves particles by dt seconds and drops dead ones.
  updateSparkles(dt) {
    this.sparkles.forEach((s) => {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 60 * dt;
      s.life -= dt;
    });
    this.sparkles = this.sparkles.filter((s) => s.life > 0);
  }

  // useHint — rings one unfound difference for HINT_RING_MS. Costs HINT_COST
  // points, one of HINTS_PER_LEVEL hints, and starts the HINT_COOLDOWN_S
  // cooldown. Returns the hinted difference index, or -1 when no hint is
  // available (none left, cooling down, not playing, or nothing left to find).
  // A difference that has already been hinted is never picked again this
  // level (tracked in this.hinted), so a hint never charges twice for the
  // same difference; when every unfound difference has already been hinted,
  // the call returns -1 without charging. The toast never names the target —
  // the ring alone is the nudge.
  useHint() {
    if (this.screen !== 'playing') return -1;
    if (this.hintsLeft <= 0 || this.hintCooldown > 0) return -1;
    const diffs = this.level().differences;
    const open = diffs.map((d, i) => i).filter((i) => !this.found.has(i) && !this.hinted.has(i));
    if (open.length === 0) return -1;
    const pick = open[Math.floor(Math.random() * open.length)];
    this.hintsLeft -= 1;
    this.hintCooldown = HINT_COOLDOWN_S;
    this.hintIndex = pick;
    this.hintUntil = this.now + HINT_RING_MS / 1000;
    this.hinted.add(pick);
    this.score = Math.max(0, this.score - HINT_COST);
    this.toast = `Hint used — -${HINT_COST} pts`;
    this.toastUntil = this.now + TOAST_MS / 1000;
    return pick;
  }

  // clearLevel — awards the time bonus (whole seconds left x TIME_BONUS_PER_S),
  // then moves to 'levelclear', or to 'win' after the last level, saving best.
  clearLevel() {
    const bonus = Math.floor(this.timeLeft) * TIME_BONUS_PER_S;
    this.score += bonus;
    this.toast = `Level clear! Time bonus +${bonus}`;
    this.toastUntil = this.now + CLEAR_TOAST_MS / 1000;
    if (this.levelIndex >= LEVELS.length - 1) {
      this.screen = 'win';
      if (this.score > this.best) {
        this.best = this.score;
        this.saveBest();
      }
    } else {
      this.screen = 'levelclear';
    }
  }

  // nextLevel — advances from 'levelclear' to the next level. Ignored elsewhere.
  nextLevel() {
    if (this.screen !== 'levelclear') return;
    this.startLevel(this.levelIndex + 1);
  }

  // togglePause — flips between 'playing' and 'paused'. Ignored on other screens.
  togglePause() {
    if (this.screen === 'playing') this.screen = 'paused';
    else if (this.screen === 'paused') this.screen = 'playing';
  }

  // shaking — true while the wrong-click shake is active (drives render.js).
  shaking() {
    return this.now < this.shakeUntil;
  }
}
