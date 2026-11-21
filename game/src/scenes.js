// scenes.js — one job: draw the three scenes with Canvas 2D, and draw the right
// panel with its differences applied. No external images: every wall, lantern and
// cat is drawn here from shapes. Each scene function takes (ctx, variant, rand):
// variant false draws the left (original) panel, true draws the right panel with
// the level's differences from config.js applied at their exact coordinates.
// rand is a fresh seeded generator per panel, so decorative scatter is identical
// on both sides and only the listed differences ever differ.

import { FIELD_W, FIELD_H, PALETTES } from './config.js';
import { pickInRange } from './random.js';

// --- tiny shape helpers (all coordinates are field pixels) ---
function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function line(ctx, x1, y1, x2, y2, stroke, width) {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// star4 — a four-point sparkle star of outer radius r, in fill colour.
function star4(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Level 1 — Cat Café at Dusk. Differences (index: what the right panel does):
// 0 shelf plant missing · 1 cat collar red→teal · 2 extra cup on counter
// 3 framed picture flipped · 4 hanging lamp bigger · 5 teapot moved +45px
// 6 window moon crescent→full.
function drawCafe(ctx, variant, rand) {
  const P = PALETTES[0];
  rect(ctx, 0, 0, FIELD_W, FIELD_H, P.wall);
  rect(ctx, 0, 430, FIELD_W, 110, P.floor);
  for (let y = 452; y < FIELD_H; y += 22) line(ctx, 0, y, FIELD_W, y, P.floorLine, 2);

  // Window: dusk sky, hills, moon (diff 6), stars.
  rect(ctx, 60, 55, 240, 205, P.sky);
  const skyGrad = ctx.createLinearGradient(0, 55, 0, 260);
  skyGrad.addColorStop(0, P.sky);
  skyGrad.addColorStop(1, P.skyLow);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(66, 61, 228, 193);
  for (let i = 0; i < 14; i += 1) {
    star4(ctx, pickInRange(rand, 75, 285), pickInRange(rand, 68, 140), 2.5, '#ffe9a8');
  }
  if (variant) {
    circle(ctx, 140, 112, 20, '#ffe9a8');
    circle(ctx, 132, 106, 4, '#e8c87a');
    circle(ctx, 148, 120, 3, '#e8c87a');
  } else {
    circle(ctx, 140, 112, 20, '#ffe9a8');
    circle(ctx, 152, 104, 17, P.skyLow);
  }
  ctx.fillStyle = '#4a3560';
  ctx.beginPath();
  ctx.moveTo(66, 254);
  ctx.quadraticCurveTo(140, 205, 210, 250);
  ctx.quadraticCurveTo(260, 225, 294, 254);
  ctx.lineTo(294, 254);
  ctx.lineTo(66, 254);
  ctx.fill();
  ctx.strokeStyle = P.dark;
  ctx.lineWidth = 6;
  ctx.strokeRect(60, 55, 240, 205);
  line(ctx, 180, 55, 180, 260, P.dark, 5);
  line(ctx, 60, 157, 300, 157, P.dark, 5);

  // Shelf with jars and the potted plant (diff 0: plant missing on the right).
  rect(ctx, 380, 96, 190, 10, '#6e4525');
  rect(ctx, 396, 66, 26, 30, '#7fb069');
  rect(ctx, 436, 60, 26, 36, '#e07856');
  rect(ctx, 472, 70, 22, 26, '#e8b23a');
  if (!variant) {
    rect(ctx, 512, 76, 18, 20, '#c94f43');
    circle(ctx, 521, 66, 12, '#5d8a4a');
    circle(ctx, 512, 60, 8, '#6da055');
    circle(ctx, 530, 62, 8, '#6da055');
  }

  // Hanging lamps (diff 4: the middle lamp is 1.5x bigger on the right).
  [140, 300, 460].forEach((lx, i) => {
    const big = variant && i === 1;
    const s = big ? 1.5 : 1;
    line(ctx, lx, 0, lx, 52, P.dark, 3);
    ctx.fillStyle = '#e8b23a';
    ctx.beginPath();
    ctx.moveTo(lx - 22 * s, 52);
    ctx.lineTo(lx + 22 * s, 52);
    ctx.lineTo(lx + 12 * s, 78);
    ctx.lineTo(lx - 12 * s, 78);
    ctx.closePath();
    ctx.fill();
    circle(ctx, lx, 82, 7 * s, '#ffe9a8');
  });

  // Framed picture (diff 3: the cat silhouette faces left, right on the right).
  rect(ctx, 70, 290, 72, 56, '#6e4525');
  rect(ctx, 76, 296, 60, 44, '#fff3d6');
  ctx.fillStyle = P.dark;
  ctx.beginPath();
  const face = variant ? 1 : -1;
  ctx.arc(106 + face * 6, 318, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(100 + face * 12, 310);
  ctx.lineTo(104 + face * 14, 300);
  ctx.lineTo(108 + face * 10, 309);
  ctx.fill();
  ellipse(ctx, 106, 334, 16, 7, P.dark);

  // Counter, teapot (diff 5: moved +45px on the right), cups (diff 2: extra cup).
  rect(ctx, 40, 330, 520, 100, '#a9713f');
  rect(ctx, 40, 330, 520, 12, '#c98d54');
  const potX = variant ? 417 : 372;
  circle(ctx, potX, 362, 18, '#c94f43');
  ctx.fillStyle = '#c94f43';
  ctx.beginPath();
  ctx.moveTo(potX + 16, 352);
  ctx.lineTo(potX + 30, 344);
  ctx.lineTo(potX + 28, 360);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(potX - 16, 362, 8, Math.PI * 0.4, Math.PI * 1.6);
  ctx.strokeStyle = '#c94f43';
  ctx.lineWidth = 5;
  ctx.stroke();
  circle(ctx, potX, 340, 5, '#8a2f26');
  [250, 300, 460].forEach((cx) => {
    rect(ctx, cx - 10, 348, 20, 16, '#fff3d6');
    ctx.beginPath();
    ctx.arc(cx + 11, 356, 5, -Math.PI / 2, Math.PI / 2);
    ctx.strokeStyle = '#fff3d6';
    ctx.lineWidth = 4;
    ctx.stroke();
  });
  if (variant) {
    rect(ctx, 495, 344, 20, 16, '#7fb069');
    ctx.beginPath();
    ctx.arc(516, 352, 5, -Math.PI / 2, Math.PI / 2);
    ctx.strokeStyle = '#7fb069';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  // Steam curls above the teapot.
  ctx.strokeStyle = 'rgba(255,243,214,0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(potX, 332);
  ctx.quadraticCurveTo(potX + 6, 322, potX, 312);
  ctx.stroke();

  // Cat on a cushion (diff 1: collar red on the left, teal on the right).
  ellipse(ctx, 255, 470, 62, 20, '#c94f43');
  ellipse(ctx, 255, 452, 44, 26, '#e8a34c');
  circle(ctx, 255, 424, 22, '#e8a34c');
  ctx.fillStyle = '#e8a34c';
  ctx.beginPath();
  ctx.moveTo(238, 410);
  ctx.lineTo(234, 392);
  ctx.lineTo(248, 404);
  ctx.closePath();
  ctx.moveTo(272, 410);
  ctx.lineTo(276, 392);
  ctx.lineTo(262, 404);
  ctx.closePath();
  ctx.fill();
  circle(ctx, 247, 422, 2.5, P.dark);
  circle(ctx, 263, 422, 2.5, P.dark);
  ctx.strokeStyle = variant ? '#2a9d8f' : '#c94f43';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(255, 442, 16, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  circle(ctx, 255, 458, 4, '#e8b23a');
  ellipse(ctx, 300, 452, 20, 8, '#e8a34c');

  // Rug on the floor.
  ellipse(ctx, 300, 505, 150, 16, '#7fb069');
  ellipse(ctx, 300, 505, 110, 11, '#a8c686');
}

// ---------------------------------------------------------------------------
// Level 2 — Lantern Night Market. Differences (index: right panel):
// 0 middle lantern missing · 1 extra fish · 2 awning stripe red→teal
// 3 shop sign flipped · 4 moon bigger · 5 crate moved +45px · 6 lucky star missing
// 7 vendor hat straw→red · 8 extra dumpling · 9 cat tail up→down.
function drawMarket(ctx, variant, rand) {
  const P = PALETTES[1];
  rect(ctx, 0, 0, FIELD_W, FIELD_H, P.sky);
  for (let i = 0; i < 26; i += 1) {
    star4(ctx, pickInRange(rand, 20, 580), pickInRange(rand, 15, 200), 2.5, '#ffe9a8');
  }
  // Lucky star (diff 6: missing on the right).
  if (!variant) star4(ctx, 92, 52, 9, '#fff3d6');
  // Moon (diff 4: bigger on the right).
  circle(ctx, 522, 68, variant ? 27 : 18, '#ffe9a8');
  circle(ctx, 516, 62, 4, '#e8c87a');
  circle(ctx, 528, 74, 3, '#e8c87a');

  // Lantern string (diff 0: the 300px lantern is missing on the right).
  ctx.strokeStyle = '#0e0a1e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 58);
  ctx.quadraticCurveTo(300, 92, 600, 58);
  ctx.stroke();
  [60, 140, 220, 300, 380, 460, 540].forEach((lx) => {
    if (variant && lx === 300) return;
    const ly = 58 + Math.sin((lx / 600) * Math.PI) * 22;
    line(ctx, lx, ly, lx, ly + 8, '#0e0a1e', 2);
    ellipse(ctx, lx, ly + 26, 15, 19, '#e23b2e');
    rect(ctx, lx - 8, ly + 6, 16, 5, '#e8b23a');
    rect(ctx, lx - 8, ly + 41, 16, 5, '#e8b23a');
    circle(ctx, lx, ly + 26, 5, '#ffe9a8');
  });

  // Left stall: striped awning, fish counter.
  for (let i = 0; i < 6; i += 1) rect(ctx, 40 + i * 38, 150, 19, 40, i % 2 ? '#fff3d6' : '#c94f43');
  rect(ctx, 40, 190, 228, 8, '#6e4525');
  rect(ctx, 40, 250, 228, 80, '#7a4a28');
  rect(ctx, 40, 250, 228, 10, '#a9713f');
  [120, 175].forEach((fx) => {
    ellipse(ctx, fx, 268, 22, 10, '#7fb069');
    ctx.beginPath();
    ctx.moveTo(fx + 20, 268);
    ctx.lineTo(fx + 30, 260);
    ctx.lineTo(fx + 30, 276);
    ctx.closePath();
    ctx.fillStyle = '#7fb069';
    ctx.fill();
    circle(ctx, fx - 14, 266, 2, P.dark);
  });
  if (variant) {
    ellipse(ctx, 150, 252, 18, 8, '#5d8a4a');
    ctx.beginPath();
    ctx.moveTo(166, 252);
    ctx.lineTo(175, 246);
    ctx.lineTo(175, 258);
    ctx.closePath();
    ctx.fillStyle = '#5d8a4a';
    ctx.fill();
  }
  rect(ctx, 60, 330, 180, 60, '#5d3a1e');
  rect(ctx, 70, 340, 50, 16, '#e8b23a');
  rect(ctx, 130, 340, 50, 16, '#c94f43');

  // Right stall: awning stripe (diff 2), fruit, dumplings (diff 8: extra one).
  for (let i = 0; i < 6; i += 1) {
    const stripe = i % 2 ? '#fff3d6' : (variant ? '#2a9d8f' : '#c94f43');
    rect(ctx, 340 + i * 38, 150, 19, 40, stripe);
  }
  rect(ctx, 340, 190, 228, 8, '#6e4525');
  rect(ctx, 340, 250, 228, 80, '#7a4a28');
  rect(ctx, 340, 250, 228, 10, '#a9713f');
  [380, 410, 440].forEach((ox) => circle(ctx, ox, 268, 11, '#e07856'));
  [395, 425].forEach((ax) => circle(ctx, ax, 288, 10, '#c94f43'));
  ellipse(ctx, 430, 292, 14, 9, '#fff3d6');
  ellipse(ctx, 452, 292, 14, 9, '#fff3d6');
  if (variant) ellipse(ctx, 472, 282, 14, 9, '#fff3d6');

  // Vendor (diff 7: straw hat on the left, red hat on the right).
  circle(ctx, 332, 212, 16, '#f2c89b');
  ctx.fillStyle = variant ? '#c94f43' : '#e8b23a';
  ctx.beginPath();
  ctx.moveTo(306, 206);
  ctx.quadraticCurveTo(332, 178, 358, 206);
  ctx.closePath();
  ctx.fill();
  rect(ctx, 312, 228, 40, 46, '#3b6ea5');
  rect(ctx, 312, 228, 40, 12, '#fff3d6');

  // Hanging shop sign (diff 3: arrow points right on the left, left on the right).
  line(ctx, 520, 240, 520, 272, P.dark, 3);
  rect(ctx, 488, 272, 64, 44, '#e8b23a');
  ctx.strokeStyle = P.dark;
  ctx.lineWidth = 3;
  ctx.strokeRect(488, 272, 64, 44);
  ctx.fillStyle = P.dark;
  ctx.beginPath();
  const dir = variant ? -1 : 1;
  ctx.moveTo(520 - dir * 14, 294);
  ctx.lineTo(520 + dir * 12, 284);
  ctx.lineTo(520 + dir * 12, 304);
  ctx.closePath();
  ctx.fill();

  // Crate (diff 5: at x=200 on the left, x=245 on the right) and market cat (diff 9).
  const crateX = variant ? 245 : 200;
  rect(ctx, crateX - 28, 404, 56, 40, '#a9713f');
  line(ctx, crateX - 28, 424, crateX + 28, 424, '#6e4525', 3);
  line(ctx, crateX, 404, crateX, 444, '#6e4525', 3);
  ellipse(ctx, 122, 436, 30, 14, '#8a5a33');
  circle(ctx, 122, 414, 15, '#8a5a33');
  ctx.fillStyle = '#8a5a33';
  ctx.beginPath();
  ctx.moveTo(112, 404);
  ctx.lineTo(110, 392);
  ctx.lineTo(120, 400);
  ctx.closePath();
  ctx.moveTo(130, 404);
  ctx.lineTo(134, 392);
  ctx.lineTo(124, 400);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a5a33';
  ctx.lineWidth = 5;
  ctx.beginPath();
  if (variant) {
    ctx.moveTo(148, 436);
    ctx.quadraticCurveTo(162, 448, 150, 458);
  } else {
    ctx.moveTo(148, 436);
    ctx.quadraticCurveTo(164, 424, 158, 408);
  }
  ctx.stroke();

  // Cobble ground.
  rect(ctx, 0, 444, FIELD_W, 96, P.floor);
  for (let i = 0; i < 30; i += 1) {
    ellipse(ctx, pickInRange(rand, 15, 585), pickInRange(rand, 455, 525), 14, 6, P.floorLine);
  }
}

// ---------------------------------------------------------------------------
// Level 3 — Lighthouse Tide. Differences (index: right panel):
// 0 gull missing · 1 flag red→teal · 2 extra starfish · 3 sail flipped
// 4 beacon bigger · 5 buoy moved · 6 cloud missing · 7 rock grey→rust
// 8 extra wave crest · 9 tower window dark→lit · 10 rope coil missing
// 11 jumping fish extra.
function drawTide(ctx, variant, rand) {
  const P = PALETTES[2];
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
  skyGrad.addColorStop(0, P.sky);
  skyGrad.addColorStop(1, P.skyLow);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, FIELD_W, 300);
  // Clouds (diff 6: the 92px cloud is missing on the right).
  const clouds = [[92, 72], [330, 56], [470, 120]];
  clouds.forEach(([cx, cy]) => {
    if (variant && cx === 92) return;
    ellipse(ctx, cx, cy, 34, 14, '#ffffff');
    ellipse(ctx, cx - 20, cy + 6, 22, 10, '#ffffff');
    ellipse(ctx, cx + 22, cy + 6, 24, 11, '#ffffff');
  });
  // Gulls (diff 0: the 480px gull is missing on the right).
  const gulls = [[480, 92], [420, 70], [540, 130]];
  gulls.forEach(([gx, gy]) => {
    if (variant && gx === 480) return;
    ctx.strokeStyle = P.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gx - 10, gy);
    ctx.quadraticCurveTo(gx - 4, gy - 7, gx, gy);
    ctx.quadraticCurveTo(gx + 4, gy - 7, gx + 10, gy);
    ctx.stroke();
  });

  // Sea and sand.
  rect(ctx, 0, 300, FIELD_W, 240, '#2a7fa8');
  for (let i = 0; i < 12; i += 1) {
    const wy = 320 + i * 12;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, wy);
    for (let x = 0; x <= FIELD_W; x += 40) ctx.quadraticCurveTo(x + 20, wy - 5, x + 40, wy);
    ctx.stroke();
  }
  rect(ctx, 0, 460, FIELD_W, 80, P.floor);
  for (let i = 0; i < 10; i += 1) {
    ellipse(ctx, pickInRange(rand, 20, 580), pickInRange(rand, 480, 520), 8, 3, P.floorLine);
  }

  // Lighthouse: tower, stripes, window (diff 9), beacon (diff 4), flag (diff 1).
  rect(ctx, 178, 120, 48, 340, '#fff8e0');
  rect(ctx, 178, 180, 48, 26, P.accent);
  rect(ctx, 178, 260, 48, 26, P.accent);
  rect(ctx, 178, 340, 48, 26, P.accent);
  rect(ctx, 170, 108, 64, 14, P.dark);
  circle(ctx, 202, 152, variant ? 30 : 18, 'rgba(255,233,168,0.55)');
  circle(ctx, 202, 152, variant ? 14 : 9, '#ffe9a8');
  rect(ctx, 196, 96, 12, 14, '#3a2a1e');
  line(ctx, 202, 96, 202, 54, P.dark, 3);
  ctx.fillStyle = variant ? '#2a9d8f' : P.accent;
  ctx.beginPath();
  ctx.moveTo(202, 54);
  ctx.lineTo(232, 62);
  ctx.lineTo(202, 72);
  ctx.closePath();
  ctx.fill();
  rect(ctx, 194, 236, 16, 20, variant ? '#ffe9a8' : '#274b5e');
  rect(ctx, 194, 300, 16, 20, '#274b5e');

  // Boat (diff 3: sail on the left side of the mast, right side on the right).
  const bx = 352;
  ctx.fillStyle = '#6e4525';
  ctx.beginPath();
  ctx.moveTo(bx - 34, 318);
  ctx.lineTo(bx + 34, 318);
  ctx.lineTo(bx + 22, 334);
  ctx.lineTo(bx - 22, 334);
  ctx.closePath();
  ctx.fill();
  line(ctx, bx, 318, bx, 268, P.dark, 3);
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  if (variant) {
    ctx.moveTo(bx, 270);
    ctx.lineTo(bx + 26, 314);
    ctx.lineTo(bx, 314);
  } else {
    ctx.moveTo(bx, 270);
    ctx.lineTo(bx - 26, 314);
    ctx.lineTo(bx, 314);
  }
  ctx.closePath();
  ctx.fill();

  // Buoy (diff 5: at (522,382) on the left, (478,404) on the right).
  const buoy = variant ? [478, 404] : [522, 382];
  circle(ctx, buoy[0], buoy[1], 14, P.accent);
  rect(ctx, buoy[0] - 14, buoy[1] - 4, 28, 8, '#fff3d6');
  line(ctx, buoy[0], buoy[1] - 14, buoy[0], buoy[1] - 24, P.dark, 3);

  // Shore rock (diff 7: grey on the left, rust on the right).
  ellipse(ctx, 152, 462, 34, 16, variant ? '#b0562f' : '#8a9aa5');
  ellipse(ctx, 120, 470, 18, 10, variant ? '#b0562f' : '#8a9aa5');

  // Starfish on the sand (diff 2: extra one at 422,482 on the right).
  star4(ctx, 300, 500, 10, '#e07856');
  star4(ctx, 520, 505, 9, '#e07856');
  if (variant) star4(ctx, 422, 482, 10, '#e07856');

  // Extra wave crest (diff 8) and jumping fish (diff 11), right panel only.
  if (variant) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(282, 422);
    ctx.quadraticCurveTo(302, 408, 322, 422);
    ctx.stroke();
    ellipse(ctx, 452, 332, 12, 6, '#7fb069');
    ctx.beginPath();
    ctx.moveTo(462, 332);
    ctx.lineTo(472, 326);
    ctx.lineTo(472, 338);
    ctx.closePath();
    ctx.fillStyle = '#7fb069';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(452, 344, 10, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  // Rope coil on the dock (diff 10: missing on the right).
  if (!variant) {
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 4;
    [16, 11, 6].forEach((r) => {
      ctx.beginPath();
      ctx.arc(92, 402, r, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
}

// drawScene — draws level `levelIndex` into ctx (already translated to the panel
// origin and scaled to FIELD_W x FIELD_H). variant selects the right panel.
export function drawScene(ctx, levelIndex, variant, rand) {
  if (levelIndex === 0) drawCafe(ctx, variant, rand);
  else if (levelIndex === 1) drawMarket(ctx, variant, rand);
  else drawTide(ctx, variant, rand);
}
