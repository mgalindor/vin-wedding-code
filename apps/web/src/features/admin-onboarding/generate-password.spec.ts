import { describe, it, expect } from 'vitest';

import {
  generateInitialPassword,
  PASSWORD_LENGTH,
} from './generate-password';

describe('generateInitialPassword', () => {
  it('produces a value inside the agreed 10-25 char range', () => {
    for (let i = 0; i < 50; i++) {
      const password = generateInitialPassword();
      expect(password.length).toBeGreaterThanOrEqual(PASSWORD_LENGTH.MIN);
      expect(password.length).toBeLessThanOrEqual(PASSWORD_LENGTH.MAX);
    }
  });

  it('uses only ASCII letters, digits, and a small set of safe symbols', () => {
    const sample = generateInitialPassword();
    // No whitespace, no Unicode, no high-bit characters.
    expect(sample).toMatch(/^[A-Za-z0-9!@#$%^&*\-_=+]+$/);
  });

  it('produces different values across calls (statistical)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      seen.add(generateInitialPassword());
    }
    // 20 calls from a pool this large should be virtually unique.
    expect(seen.size).toBeGreaterThan(15);
  });
});