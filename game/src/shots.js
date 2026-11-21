// shots.js — one job: stage the deterministic screenshot states behind ?shot=.
// The seed is fixed (seed=1) so every screenshot is reproducible. Each stage
// sets the world to an exact, checkable state — the counts below are the contract
// the screenshots must show, and the headless tests assert them.

// stageShot — applies one of 'start' | 'play' | 'close' | 'end' to the world.
// Returns true when the stage was applied, false for an unknown stage name.
//   start: title screen over the level-1 scene, nothing found yet, score 0.
//   play:  level 2 mid-game, exactly 4 of 10 found, 6 left, 107s on the clock,
//     score 2600 — cumulative: level 1 cleared (7 finds 700 + 1500 time bonus
//     at 150s left) = 2200, plus 4 level-2 finds (400).
//   close: level 3, 11 of 12 found, 1 left, 45s on the clock, score 5800 —
//     cumulative: level 1 (2200) + level 2 cleared (10 finds 1000 + 1500 time
//     bonus at 150s left) = 4700, plus 11 level-3 finds (1100).
//   end:   win screen, score 7100 — the canonical win-path total: 29 finds
//     (2900) + time bonuses 1500 + 1500 + 1200 (150s/150s/120s left, i.e. 30s
//     of play per level before the finds), timeLeft 120s to match the last
//     bonus. The toast names the highest-index found difference, as a real
//     last find would.
export function stageShot(world, stage) {
  if (stage === 'start') {
    world.screen = 'start';
    world.levelIndex = 0;
    world.found = new Set();
    world.score = 0;
    world.timeLeft = 180;
    world.hintIndex = -1;
    world.hinted = new Set();
    world.toast = null;
    return true;
  }
  if (stage === 'play') {
    world.startLevel(1);
    world.found = new Set([0, 2, 4, 7]);
    world.score = 2600;
    world.timeLeft = 107;
    world.hintIndex = -1;
    world.toast = 'Found: Vendor hat! +100';
    world.toastUntil = world.now + 60;
    return true;
  }
  if (stage === 'close') {
    world.startLevel(2);
    world.found = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    world.score = 5800;
    world.timeLeft = 45;
    world.hintIndex = -1;
    world.toast = 'Found: Rope coil! +100';
    world.toastUntil = world.now + 60;
    return true;
  }
  if (stage === 'end') {
    world.startLevel(2);
    world.found = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    world.score = 7100;
    world.best = 7100;
    world.screen = 'win';
    world.timeLeft = 120;
    world.toast = null;
    return true;
  }
  return false;
}

// shotFromUrl — reads ?shot=<stage>&seed=<n> from the page URL. The seed is
// accepted and ignored for now (all stages are fixed at seed 1); returning it
// keeps the query contract honest instead of silently dropping a parameter.
export function shotFromUrl(url) {
  const params = new URL(url).searchParams;
  return { stage: params.get('shot') || '', seed: Number(params.get('seed') || 1) };
}
