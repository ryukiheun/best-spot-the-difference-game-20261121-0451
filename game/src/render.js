// render.js — one job: draw everything on the canvas — the two picture panels,
// found markers, hint ring, sparkles, wrong-click marks, toasts, and the screen
// overlays (title, pause, level-clear, win, time-up). The HTML header holds the
// score/timer/counter text; this file only paints the canvas.

import { FIELD_W, FIELD_H, WRONG_FLASH_MS, diffPoint } from './config.js';
import { drawScene } from './scenes.js';
import { mulberry32 } from './random.js';

// layoutPanels — the two panel rectangles in canvas pixels for a canvas of
// (canvasW, canvasH): 24px outer margin, 24px gap, panels keep the field's
// 600:540 aspect and are centred in the canvas both ways, so a tall canvas
// leaves no empty band under the panels and a short canvas shrinks both panel
// dimensions together (never squashing circles into ellipses). Returns
// { left, right }; input.js gets the same rectangles.
export function layoutPanels(canvasW, canvasH) {
  const margin = 24;
  const gap = 24;
  const availW = canvasW - margin * 2 - gap;
  const availH = canvasH - 16;
  let panelW = availW / 2;
  let panelH = panelW * (FIELD_H / FIELD_W);
  if (panelH > availH) {
    panelH = availH;
    panelW = panelH * (FIELD_W / FIELD_H);
  }
  const totalW = panelW * 2 + gap;
  const x0 = (canvasW - totalW) / 2;
  const y = (canvasH - panelH) / 2;
  return {
    left: { x: x0, y, w: panelW, h: panelH },
    right: { x: x0 + panelW + gap, y, w: panelW, h: panelH },
  };
}

// drawPanel — paints one panel: the scene (left original or right with the
// differences), then gold rings on every found difference and the pulsing hint
// ring, then sparkles and the wrong-click X, all in field coordinates.
function drawPanel(ctx, world, panel, variant, time) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(panel.x, panel.y, panel.w, panel.h);
  ctx.clip();
  ctx.translate(panel.x, panel.y);
  ctx.scale(panel.w / FIELD_W, panel.h / FIELD_H);
  drawScene(ctx, world.levelIndex, variant, mulberry32(world.level().seed));

  // Found markers: a gold ring plus a small check, on both panels — at each
  // panel's own point (diffPoint), so a moved object is ringed where it sits
  // on that side, never over empty space.
  world.found.forEach((i) => {
    const d = world.level().differences[i];
    const p = diffPoint(d, variant);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, d.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x - 8, p.y);
    ctx.lineTo(p.x - 2, p.y + 6);
    ctx.lineTo(p.x + 9, p.y - 6);
    ctx.stroke();
  });

  // Hint ring: pulses around one unfound difference (radius breathes with time),
  // at this panel's point for that difference.
  if (world.hintIndex >= 0 && !world.found.has(world.hintIndex)) {
    const d = world.level().differences[world.hintIndex];
    const p = diffPoint(d, variant);
    const pulse = d.r + 6 + Math.sin(time * 5) * 4;
    ctx.strokeStyle = '#ff9f1c';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Sparkles from recent finds, drawn in field space so they sit on the art —
  // only the burst that belongs to this panel (each particle carries its panel).
  world.sparkles.forEach((s) => {
    if (s.panel !== undefined && s.panel !== (variant ? 1 : 0)) return;
    const alpha = Math.max(0, s.life / s.maxLife);
    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Wrong-click mark: a red X where the player clicked, fading with its flash —
  // only on the panel that was actually clicked (world.wrongAt.panel).
  if (world.wrongAt && world.wrongAt.panel === (variant ? 1 : 0) && world.now < world.wrongFlashUntil) {
    const a = (world.wrongFlashUntil - world.now) / (WRONG_FLASH_MS / 1000);
    ctx.strokeStyle = `rgba(220, 40, 40, ${a})`;
    ctx.lineWidth = 5;
    const { x, y } = world.wrongAt;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 12);
    ctx.lineTo(x + 12, y + 12);
    ctx.moveTo(x + 12, y - 12);
    ctx.lineTo(x - 12, y + 12);
    ctx.stroke();
  }
  ctx.restore();

  // Panel frame and label, drawn in canvas pixels outside the clip.
  ctx.strokeStyle = '#3a2a1e';
  ctx.lineWidth = 3;
  ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
  const label = variant ? 'RIGHT — spot the changes' : 'LEFT — original';
  ctx.font = 'bold 15px system-ui, sans-serif';
  const labelW = ctx.measureText(label).width + 20;
  ctx.fillStyle = 'rgba(255, 243, 214, 0.88)';
  ctx.fillRect(panel.x + 4, panel.y + 5, labelW, 24);
  ctx.fillStyle = '#3a2a1e';
  ctx.fillText(label, panel.x + 14, panel.y + 22);
}

// overlay — a centred dim panel with a title, a few lines, and a key hint.
function overlay(ctx, canvasW, canvasH, title, lines, hint) {
  ctx.fillStyle = 'rgba(18, 14, 36, 0.78)';
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, canvasW / 2, canvasH / 2 - 60);
  ctx.font = '20px system-ui, sans-serif';
  lines.forEach((lineText, i) => {
    ctx.fillText(lineText, canvasW / 2, canvasH / 2 - 10 + i * 32);
  });
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(hint, canvasW / 2, canvasH / 2 - 10 + lines.length * 32 + 36);
  ctx.textAlign = 'left';
}

// drawGame — one full frame: shake offset, both panels, toast, then the screen
// overlay when the world is not playing. time is seconds since boot (drives the
// hint pulse); world.now is the game clock.
export function drawGame(ctx, world, canvasW, canvasH, time) {
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#241d33';
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.save();
  if (world.shaking()) {
    const mag = 6;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  const panels = layoutPanels(canvasW, canvasH);
  drawPanel(ctx, world, panels.left, false, time);
  drawPanel(ctx, world, panels.right, true, time);
  ctx.restore();

  // Toast: the latest find/wrong/hint message, bottom-centre, while it lasts.
  if (world.toast && world.now < world.toastUntil) {
    ctx.font = 'bold 20px system-ui, sans-serif';
    const w = ctx.measureText(world.toast).width + 32;
    ctx.fillStyle = 'rgba(18, 14, 36, 0.85)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect((canvasW - w) / 2, canvasH - 52, w, 38, 8);
    else ctx.rect((canvasW - w) / 2, canvasH - 52, w, 38);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.textAlign = 'center';
    ctx.fillText(world.toast, canvasW / 2, canvasH - 26);
    ctx.textAlign = 'left';
  }

  if (world.screen === 'start') {
    overlay(ctx, canvasW, canvasH, 'Moonlit Lantern Market', [
      'A spot-the-difference hunt in three moonlit scenes.',
      'Click a difference on either picture — left is the original,',
      'right hides the changes. Find them all before the lanterns burn out!',
      'Level 1: Cat Café at Dusk — 7 differences, 180 seconds.',
    ], 'Click or press Enter to play · H hint · P pause · M mute');
  } else if (world.screen === 'paused') {
    overlay(ctx, canvasW, canvasH, 'Paused', [
      `${world.level().name} — ${world.remaining()} differences left`,
      `Score ${world.score} · ${Math.ceil(world.timeLeft)}s on the clock`,
    ], 'Press P or Esc to resume · R to restart');
  } else if (world.screen === 'levelclear') {
    overlay(ctx, canvasW, canvasH, 'Level Clear!', [
      `${world.level().name} — all differences found.`,
      `Score ${world.score} · Best ${world.best}`,
      `Next: Level ${world.levelIndex + 2}`,
    ], 'Press N for the next level');
  } else if (world.screen === 'win') {
    overlay(ctx, canvasW, canvasH, 'You found them all!', [
      'All three moonlit scenes cleared.',
      `Final score ${world.score} · Best ${world.best}`,
    ], 'Press R to play again');
  } else if (world.screen === 'timeup') {
    overlay(ctx, canvasW, canvasH, 'Time\'s up!', [
      `${world.level().name} — ${world.remaining()} differences still hiding.`,
      `Score ${world.score} · Best ${world.best}`,
    ], 'Press R to try again');
  }
}
