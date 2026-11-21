// config.js — one job: every tunable number and every level/difference definition.
// Tuning constants: each entry states its definition, its unit, and where the value
// came from, in the same comment block (a number with no definition is a bug here).
// All values below were hand-picked for this game only (source: this file, 2026-11-21);
// none comes from a measurement, a paper, or another game.

// FIELD_W / FIELD_H — the logical drawing area of one picture panel, in field pixels.
// Source: chosen so a 1280x800 desktop window holds two panels plus header/footer.
export const FIELD_W = 600;
export const FIELD_H = 540;

// CLICK_TOLERANCE_PX — how close, in field pixels, a click must land to a difference
// centre to count as a find. Source: hand-tuned for a mouse on a 600px-wide panel;
// 22px is about the width of the smallest difference (a cup, ~20px wide) plus a
// 2px grace. Sensitivity: the headless simulation (tests/sim-spot.mjs) runs the
// win path with the tolerance set to 17.6, 22 and 26.4px (±20%) clicking visual
// centres, and probes the live 22px boundary directly (21px off a centre finds,
// 23px off does not).
export const CLICK_TOLERANCE_PX = 22;

// FIND_POINTS — score points, in points, awarded for one found difference.
// Source: hand-picked round number; 100 makes a 7-difference level worth 700.
export const FIND_POINTS = 100;

// WRONG_TIME_PENALTY_S — seconds subtracted from the level timer on a wrong click.
// Source: hand-picked; 5s is ~3% of a 180s level, a sting without ending a run.
export const WRONG_TIME_PENALTY_S = 5;

// WRONG_SCORE_PENALTY — score points subtracted on a wrong click (floor at 0).
// Source: hand-picked; half of one find, so guessing is worse than looking.
export const WRONG_SCORE_PENALTY = 50;

// HINT_COST — score points charged per hint used. Source: hand-picked; one find's
// worth, so a hint trades exactly one find's points for the answer's location.
export const HINT_COST = 100;

// HINTS_PER_LEVEL — hints allowed per level, in hints. Source: hand-picked; 3 hints
// over 7–12 differences means hints help but cannot finish a level alone.
export const HINTS_PER_LEVEL = 3;

// HINT_COOLDOWN_S — seconds between two hints, in seconds. Source: hand-picked;
// 20s stops hint-spamming while staying usable inside a 150–180s level.
export const HINT_COOLDOWN_S = 20;

// TIME_BONUS_PER_S — score points per whole second left when a level is cleared.
// Source: hand-picked; 10/s means a fast clear (60s left) is worth 600, about
// six finds, so speed matters but never dwarfs finding.
export const TIME_BONUS_PER_S = 10;

// SHAKE_MS — duration of the screen shake after a wrong click, in milliseconds.
// Source: hand-picked; 180ms is felt but never blocks the next click.
export const SHAKE_MS = 180;

// TOAST_MS — how long a "found" toast stays on screen, in milliseconds.
// Source: hand-picked; 1600ms is long enough to read a two-word label.
export const TOAST_MS = 1600;

// SPARKLE_COUNT — sparkle particles burst on a find, in particles. Source:
// hand-picked; 14 particles reads as a burst without covering the picture.
export const SPARKLE_COUNT = 14;

// WRONG_FLASH_MS — how long the red wrong-click X stays visible, in milliseconds.
// Source: hand-picked; 500ms is long enough to read the mark, short enough to
// not linger over the next look.
export const WRONG_FLASH_MS = 500;

// CLEAR_TOAST_MS — how long the "Level clear!" toast stays on screen, in
// milliseconds. Source: hand-picked; 2500ms covers a three-word message.
export const CLEAR_TOAST_MS = 2500;

// HINT_RING_MS — how long a hint ring stays on screen, in milliseconds.
// Source: hand-picked; 8000ms is long enough to walk the eye to the ringed
// spot, short enough that a hint is a nudge, not a permanent marker.
export const HINT_RING_MS = 8000;

// BEST_KEY — localStorage key for the saved best total score. Source: this game.
export const BEST_KEY = 'moonlit-lantern-market-best';

// Palette: one named colour set per level, so both panels of a level share a style.
// Each colour is a CSS colour string. Source: hand-picked for this game.
export const PALETTES = [
  {
    wall: '#f2d8a7', floor: '#8a5a33', floorLine: '#6e4525', sky: '#2c2a55',
    skyLow: '#e07856', accent: '#c94f43', cream: '#fff3d6', dark: '#3a2a1e',
  },
  {
    wall: '#1d1b3a', floor: '#3d2b4f', floorLine: '#2c1e38', sky: '#14122e',
    skyLow: '#3b2a63', accent: '#e8b23a', cream: '#ffe9a8', dark: '#120e24',
  },
  {
    wall: '#bfe3ee', floor: '#e8d9a0', floorLine: '#c9b478', sky: '#7ec3e8',
    skyLow: '#f7d774', accent: '#d94f30', cream: '#fff8e0', dark: '#274b5e',
  },
];

// A difference: x, y are field-pixel coordinates of its centre in the 600x540
// field on the LEFT (original) panel; r is its hit radius in field pixels (used
// only for drawing the ring, the click test uses CLICK_TOLERANCE_PX); kind names
// how the right panel differs ('missing' | 'extra' | 'colour' | 'flip' | 'size'
// | 'moved'); label is the short name shown in the found toast. When the changed
// feature sits in a different place on the right panel (a 'moved' object, a
// flipped tail/sail), x2, y2 give its centre on the RIGHT panel — the click test
// and the rings use the point of the panel the player actually clicked/looks at.
// Every difference is drawn by scenes.js at these coordinates: the left point
// for the left panel, the right point (or the left point when x2 is absent) for
// the right panel, so the data and the art cannot drift apart.

// diffPoint — the hit/ring centre of difference d on one panel: the right point
// when right is true and the difference carries x2/y2, else the left point.
export function diffPoint(d, right) {
  if (right && d.x2 !== undefined && d.y2 !== undefined) return { x: d.x2, y: d.y2 };
  return { x: d.x, y: d.y };
}
export const LEVELS = [
  {
    name: 'Cat Café at Dusk',
    subtitle: 'Level 1 · 7 differences · 180 seconds',
    timeLimitS: 180,
    seed: 11,
    differences: [
      { x: 521, y: 74, r: 18, kind: 'missing', label: 'Shelf plant' },
      { x: 255, y: 452, r: 20, kind: 'colour', label: 'Cat collar' },
      { x: 505, y: 352, r: 16, kind: 'extra', label: 'Extra cup' },
      { x: 105, y: 318, r: 22, kind: 'flip', label: 'Framed picture' },
      { x: 300, y: 72, r: 20, kind: 'size', label: 'Hanging lamp' },
      { x: 372, y: 362, x2: 417, y2: 362, r: 22, kind: 'moved', label: 'Teapot' },
      { x: 140, y: 112, r: 18, kind: 'colour', label: 'Window moon' },
    ],
  },
  {
    name: 'Lantern Night Market',
    subtitle: 'Level 2 · 10 differences · 180 seconds',
    timeLimitS: 180,
    seed: 23,
    differences: [
      { x: 300, y: 106, r: 18, kind: 'missing', label: 'Middle lantern' },
      { x: 150, y: 252, r: 16, kind: 'extra', label: 'Extra fish' },
      { x: 425, y: 170, r: 20, kind: 'colour', label: 'Awning stripe' },
      { x: 520, y: 294, r: 20, kind: 'flip', label: 'Shop sign' },
      { x: 522, y: 68, r: 18, kind: 'size', label: 'Night moon' },
      { x: 200, y: 424, x2: 245, y2: 424, r: 20, kind: 'moved', label: 'Wooden crate' },
      { x: 92, y: 52, r: 14, kind: 'missing', label: 'Lucky star' },
      { x: 332, y: 193, r: 18, kind: 'colour', label: 'Vendor hat' },
      { x: 472, y: 282, r: 16, kind: 'extra', label: 'Extra dumpling' },
      { x: 158, y: 423, x2: 156, y2: 448, r: 20, kind: 'flip', label: 'Market cat tail' },
    ],
  },
  {
    name: 'Lighthouse Tide',
    subtitle: 'Level 3 · 12 differences · 150 seconds',
    timeLimitS: 150,
    seed: 37,
    differences: [
      { x: 480, y: 92, r: 14, kind: 'missing', label: 'Seagull' },
      { x: 202, y: 63, r: 16, kind: 'colour', label: 'Lighthouse flag' },
      { x: 422, y: 482, r: 16, kind: 'extra', label: 'Extra starfish' },
      { x: 343, y: 299, x2: 361, y2: 299, r: 22, kind: 'flip', label: 'Boat sail' },
      { x: 202, y: 152, r: 18, kind: 'size', label: 'Beacon light' },
      { x: 522, y: 382, x2: 478, y2: 404, r: 18, kind: 'moved', label: 'Red buoy' },
      { x: 92, y: 72, r: 18, kind: 'missing', label: 'Drift cloud' },
      { x: 152, y: 462, r: 20, kind: 'colour', label: 'Shore rock' },
      { x: 302, y: 422, r: 18, kind: 'extra', label: 'Extra wave crest' },
      { x: 202, y: 246, r: 14, kind: 'colour', label: 'Tower window' },
      { x: 92, y: 402, r: 18, kind: 'missing', label: 'Rope coil' },
      { x: 452, y: 332, r: 16, kind: 'extra', label: 'Jumping fish' },
    ],
  },
];
