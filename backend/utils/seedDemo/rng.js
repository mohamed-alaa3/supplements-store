/**
 * Tiny seeded PRNG so the "random" demo data (prices, ratings, stock levels,
 * dates) is reproducible between runs instead of changing every time the
 * seed script executes. Nothing here needs cryptographic randomness — it's
 * just for believable-looking demo numbers.
 */
function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260917); // fixed seed = today's date, arbitrary but stable

function randomInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  const value = rand() * (max - min) + min;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function pickMany(arr, count) {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < count && copy.length; i += 1) {
    const idx = randomInt(0, copy.length - 1);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function chance(probability) {
  return rand() < probability;
}

/** Days offset from "now" (can be negative for the past, positive for the future). */
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

module.exports = { rand, randomInt, randomFloat, pick, pickMany, chance, daysFromNow };
