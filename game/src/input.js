// input.js — one job: turn mouse clicks and keys into game actions, and map a
// canvas pixel to a field coordinate inside one of the two picture panels.

// PANEL geometry is computed by render.js and shared here through setPanels:
// each panel is { x, y, w, h } in canvas pixels, matching the drawn panel exactly.
let panels = [];
let keyHandler = null;
let clickHandler = null;

export function setPanels(leftPanel, rightPanel) {
  panels = [leftPanel, rightPanel];
}

// panelAt — returns { panelIndex, fx, fy } for a canvas pixel inside a panel,
// where fx/fy are field coordinates in the 600x540 field; null when the pixel is
// outside both panels (header, footer, or the gap between panels).
export function panelAt(canvasX, canvasY, fieldW, fieldH) {
  for (let i = 0; i < panels.length; i += 1) {
    const p = panels[i];
    if (canvasX >= p.x && canvasX <= p.x + p.w && canvasY >= p.y && canvasY <= p.y + p.h) {
      return {
        panelIndex: i,
        fx: ((canvasX - p.x) / p.w) * fieldW,
        fy: ((canvasY - p.y) / p.h) * fieldH,
      };
    }
  }
  return null;
}

// bindInput — wires canvas clicks and window keys to the callbacks the world
// supplies: onFieldClick(fx, fy, panelIndex) for a click inside a panel, onKey(action) for
// the named actions ('hint' | 'next' | 'restart' | 'mute' | 'pause' | 'start').
export function bindInput(canvas, callbacks) {
  clickHandler = (event) => {
    const rect = canvas.getBoundingClientRect();
    const hit = panelAt(event.clientX - rect.left, event.clientY - rect.top,
      callbacks.fieldW, callbacks.fieldH);
    if (hit) callbacks.onFieldClick(hit.fx, hit.fy, hit.panelIndex);
  };
  keyHandler = (event) => {
    const key = event.key.toLowerCase();
    if (key === 'h') callbacks.onKey('hint');
    else if (key === 'n') callbacks.onKey('next');
    else if (key === 'r') callbacks.onKey('restart');
    else if (key === 'm') callbacks.onKey('mute');
    else if (key === 'p' || key === 'escape') callbacks.onKey('pause');
    else if (key === 'enter' || key === ' ') callbacks.onKey('start');
  };
  canvas.addEventListener('click', clickHandler);
  window.addEventListener('keydown', keyHandler);
}
