const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*-_=+';
const POOL = LETTERS + DIGITS + SYMBOLS;

const MIN_LENGTH = 10;
const MAX_LENGTH = 25;

// Reject-sampling for unbiased uniform distribution from getRandomValues.
function randomIntBelow(max: number): number {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;
  let n: number = 0;
  do {
    crypto.getRandomValues(buf);
    n = buf[0] ?? 0;
  } while (n >= limit);
  return n % max;
}

export function generateInitialPassword(): string {
  const lengthRange = MAX_LENGTH - MIN_LENGTH + 1;
  const length = MIN_LENGTH + randomIntBelow(lengthRange);

  let out = '';
  for (let i = 0; i < length; i++) {
    out += POOL[randomIntBelow(POOL.length)];
  }
  return out;
}

export const PASSWORD_LENGTH = { MIN: MIN_LENGTH, MAX: MAX_LENGTH };