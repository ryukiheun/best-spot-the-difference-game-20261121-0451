// random.js — one job: a tiny seeded random-number generator so each level's
// decorative scatter (stars, sparks, cobbles) is identical on every load.

// mulberry32 — a small deterministic PRNG. seed is a 32-bit integer; the returned
// function yields a float in [0, 1). Source: the public-domain mulberry32
// algorithm, retyped here from its well-known description.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// pickInRange — returns a float in [low, high) from the given generator.
// Used for scatter placement so decorative dots never need magic numbers inline.
export function pickInRange(rand, low, high) {
  return low + rand() * (high - low);
}
