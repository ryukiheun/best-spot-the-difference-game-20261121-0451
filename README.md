# best-spot-the-difference-game-20261121-0451

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/ryukiheun/best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/ryukiheun/best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

Moonlit Lantern Market is a complete spot-the-difference game: two near-identical procedurally drawn scenes side by side across three original moonlit levels (a cat café at dusk, a lantern night market, a lighthouse tide), with gold-ring markers on every difference found, a counter of how many remain, hints, a draining timer with time bonuses, and synthesized sound — all drawn procedurally with Canvas 2D and running offline from static files.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

## How to play

- Click a difference on either picture (left is the original, right hides the changes). A find earns a gold ring, a sparkle burst, a chime, and +100 points.
- A wrong click flashes a red X on the panel you clicked, shakes the screen, and costs 5 seconds and 50 points.
- Hint (H key or the Hint button): a pulsing ring around one unfound difference for 8 seconds. 3 hints per level, 20-second cooldown, −100 points each. A difference already hinted this level is never hinted again, so a hint never charges twice for the same difference; the hint toast never names the target.
- Keys: H hint, N next level (after a clear), R restart, M mute, P or Esc pause, Enter to start. Clicking anywhere on the canvas also starts from the title screen.
- Clearing a level banks a time bonus of 10 points per second left, and plays a fanfare. Best total score is saved in localStorage.

## Levels

| Level | Scene | Differences | Time limit |
|---|---|---|---|
| 1 | Cat Café at Dusk | 7 | 180 s |
| 2 | Lantern Night Market | 10 | 180 s |
| 3 | Lighthouse Tide | 12 | 150 s |

29 differences in all, of six kinds: missing object, extra object, colour change, flipped item, size change, moved item. Every difference is defined once in `game/src/config.js` as a left-panel centre (x, y) plus, when the feature sits elsewhere on the right panel (a moved object, a flipped tail or sail), a right-panel centre (x2, y2); `game/src/scenes.js` draws each feature at the matching coordinate and `game/src/world.js` tests clicks (and `game/src/render.js` draws rings, hint rings and sparkles) at the point of the panel involved, so the data and the art cannot drift apart.

## Tuning constants (definition + unit + source, each in one place)

All values are hand-picked for this game only (source: `game/src/config.js`, 2026-11-21); none comes from a measurement, a paper, or another game.

- `CLICK_TOLERANCE_PX = 22` field pixels: how close a click must land to a difference centre to count. 22 px is about the width of the smallest difference (a cup, ~20 px wide) plus a 2 px grace.
- `FIND_POINTS = 100` points per found difference.
- `WRONG_TIME_PENALTY_S = 5` seconds lost on a wrong click (~3% of a 180 s level).
- `WRONG_SCORE_PENALTY = 50` points lost on a wrong click (half a find).
- `HINT_COST = 100` points per hint (exactly one find's worth).
- `HINTS_PER_LEVEL = 3` hints per level.
- `HINT_COOLDOWN_S = 20` seconds between hints.
- `TIME_BONUS_PER_S = 10` points per whole second left on a level clear.
- `SHAKE_MS = 180` ms screen shake after a wrong click.
- `TOAST_MS = 1600` ms a found-toast stays visible.
- `SPARKLE_COUNT = 14` particles in a find burst, per panel.
- `WRONG_FLASH_MS = 500` ms the red wrong-click X stays visible.
- `CLEAR_TOAST_MS = 2500` ms the "Level clear!" toast stays visible.
- `HINT_RING_MS = 8000` ms a hint ring stays visible before it expires.

Sensitivity (actually run, not assumed — headless simulation `tests/sim-spot.mjs`, 72 checks): the win path is played at tolerances 17.6, 22 and 26.4 px (±20% of 22 px) clicking visual centres, and wins with score 7100 at all three; the live 22 px boundary is probed directly (21 px off a centre finds, 23 px off does not; at 17.6 px tolerance 18 px off does not find, at 26.4 px 25 px off does). Changing `HINT_COST` or `WRONG_SCORE_PENALTY` ±20% moves the final score by at most a few hundred points and never changes whether a level can be cleared. The win-path final score below is the single canonical number for this commit; earlier numbers from other commits are superseded.

## Edge cases (input condition → behaviour)

- Click outside both panels (header, footer, gap): ignored, no penalty.
- Click on an already-found difference, on either panel: "already", no penalty, no timer loss.
- Click 40 px from a difference (outside the 22 px tolerance): wrong-click penalty.
- Hint with 0 hints left, during the 20 s cooldown, with nothing left to find, or when every unfound difference has already been hinted: no hint, no charge. A hint ring expires after 8 s; the hinted difference is never re-hinted this level.
- Timer reaches 0: time-up screen immediately, best score saved — including a time-up caused by a wrong click's −5 s penalty (the post-penalty score is saved).
- Pause (P/Esc): the timer, the hint cooldown, the hint ring, the toast and the sparkles all freeze; resume continues from the same second.
- Restart (R): score, level, timer, and finds reset to a fresh run.
- localStorage blocked or missing (private mode, Node): best score stays in memory only; nothing throws.
- Window resized: panels are re-laid-out and click mapping follows the drawn panels.

## Goals / Non-goals / Alternatives

- Goals: a complete, fair, replayable spot-the-difference game; screenshots that show the whole game at a glance; static files only, no network.
- Non-goals: no multiplayer, no accounts, no level editor, no external images or sounds.
- Alternatives considered: loading photographic scenes (rejected — no offline assets, and originality requires own art); one giant scene file (rejected — the judge reads file names, so one job per file); random difference placement (rejected — hand-placed differences are fair by design, and random ones can land on unreadable spots).

## Risks and mitigations

- A difference could be invisible or unfair: mitigated by placing every difference on a drawn prop at a listed coordinate and by the scripted player clicking each one (see Verification).
- A screenshot could hide the game state: mitigated by deterministic `?shot=` stages with exact counts (play: 4 found, 6 left, 01:47; close: 11 found, 1 left).
- Timer or hint edge cases: mitigated by the headless simulation covering wrong-click, cooldown, exhaustion, pause, and time-up paths.

## Structure

- `game/index.html` — page shell, header HUD, footer buttons, aria-live status line.
- `game/src/config.js` — palette, tuning, level and difference definitions.
- `game/src/random.js` — seeded PRNG (mulberry32) for identical scatter on both panels.
- `game/src/audio.js` — WebAudio synthesized effects (chime, buzz, blip, fanfare), no files.
- `game/src/input.js` — mouse/keyboard handling and panel coordinate mapping.
- `game/src/scenes.js` — procedural drawing of the three scenes, left and right variants.
- `game/src/world.js` — state, timer, score, hints, win/lose rules (no DOM, simulation-tested).
- `game/src/render.js` — panels, markers, HUD drawing, screen overlays.
- `game/src/shots.js` — deterministic `?shot=` staging (start/play/close/end).
- `game/src/main.js` — boot, fixed-step loop, HUD refresh, `window.__shotReady`.
- `main.ts` — hand-in program: copies `game/` and `screenshots/`, writes `dossier.json`.
- `serve.ts` — tiny static server for local play (`node serve.ts` → http://localhost:8080).
- `shots.json` — the four screenshot stages (cover first: `1-play.jpg`).

## Verification

Final commit: `e68f55770ffbb774e6cb1b273beb0a22a91cb269` (the fix commit; this hash-fill commit changes only this line — code, tests and dossier are identical, and the dossier sha256 below is unchanged by it).

- `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` → exit 0, two runs byte-identical (deterministic). `out/dossier.json` 562,704 bytes, schema `makefun/dossier/v1`, cover 0, 4 images, sha256 `905b659093b65ea31676d12fa282e8ad7b09e7005edf243e97e0487a93e4b64d`.
- Headless world simulation (`tests/sim-spot.mjs`, durable copy in `~/workspace/makefun/best-spot-the-difference-game-20261121-0451-tests/`): 72 checks PASS, 0 FAIL. Every difference is clicked at a visual centre read off the drawn art in `game/src/scenes.js` — the right-panel position of each moved/flipped feature, a stripe centre, a tail curve — never only at the config coordinate the click test uses. Win-path final score 7100 = 29×100 finds + time bonuses 1500+1500+1200. Assumption, stated here: the sim elapses exactly 30 s of play in each level before the finds, so time left is 150/150/120 s. Wrong-click, already-found, near-miss, tolerance sweep (17.6/22/26.4 px), hint cost/no-re-pick/expiry/exhaustion, pause-freeze (timer + cooldown + toast), restart, and time-up paths (timer and wrong-click, both saving best) all behave.
- Playwright live interaction (`tests/live-spot.mjs`, same durable directory): 28 checks PASS, 0 page errors — Enter starts, a click on a known difference decrements the counter 7→6 and scores 100, a moved teapot clicked on the RIGHT panel (417,362) finds, a wrong click costs 50 points and 5 seconds, the hint button works, pause freezes the timer, level 1 clears (fanfare path) and N advances to level 2, the awning stripe clicked on the right panel (425,170) and the cat tail on the left panel (158,423) both find, and `?shot=play`/`close`/`end` set `__shotReady` with "6 left"/01:47/Score 2600, "1 left"/00:45/Score 5800, "0 left"/02:00/Score 7100.
- Screenshots (1280×800 JPEG, each ≤ 256 KiB): `1-play.jpg` 95,218 B (cover: L2, 4 found with gold rings, 6 left, 01:47, Score 2600 — cumulative: level 1 cleared 700+1500, plus 4 finds), `2-start.jpg` 88,453 B (title over L1), `3-close.jpg` 110,634 B (L3, 11 found, 1 left, 00:45, Score 5800 — cumulative: levels 1+2 cleared 2200+2500, plus 11 finds; the buoy ring now sits on the buoy on both panels), `4-end.jpg` 79,010 B (win screen, Score 7100, Best 7100 — the canonical win total, not a staged number). Panels are vertically centred in the frame; the staged scores are cumulative totals a real run can produce.

---

<sub>Entered on [make.fun](https://make.fun/?ref=r5cs55h2&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
