/* eslint-env node */
/**
 * Unit tests for the boundary rules.
 *
 * These tests verify the SHAPE of the rules (they exist, have the right
 * zones, the right direction, and the right messages). The BEHAVIOR of
 * the rules (that they actually fire on real violations) is verified by
 * the end-to-end smoke test (T2.4 / T4.1) which runs ESLint against
 * throw-away files in the three workspaces.
 *
 * Uses Node's built-in test runner (requires Node 18+). No external deps.
 *
 * Run with: `node --test tools/eslint/boundary-rules.test.cjs`
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const boundaryRules = require('./boundary-rules.cjs');

test('boundary-rules exports an object with a `zones` array', () => {
  assert.equal(typeof boundaryRules, 'object');
  assert.ok(boundaryRules.zones, 'boundaryRules.zones should exist');
  assert.ok(Array.isArray(boundaryRules.zones), 'boundaryRules.zones should be an array');
  assert.equal(boundaryRules.zones.length, 3, 'there should be exactly 3 forbidden zones');
});

test('zone 1 — apps/api must not import from apps/web', () => {
  const zone = boundaryRules.zones[0];
  assert.equal(zone.from, './apps/web/src/**', 'from points to the importer (apps/web)');
  assert.equal(zone.target, './apps/api/src/**', 'target points to the forbidden path (apps/api)');
  assert.ok(zone.message.includes('apps/web'));
  assert.ok(zone.message.includes('apps/api'));
});

test('zone 2 — apps/web must not import from apps/api', () => {
  const zone = boundaryRules.zones[1];
  assert.equal(zone.from, './apps/api/src/**', 'from points to the importer (apps/api)');
  assert.equal(zone.target, './apps/web/src/**', 'target points to the forbidden path (apps/web)');
  assert.ok(zone.message.includes('apps/web'));
  assert.ok(zone.message.includes('apps/api'));
});

test('zone 3 — packages/* must not import from apps/*', () => {
  const zone = boundaryRules.zones[2];
  assert.equal(zone.from, './packages/*/src/**', 'from is packages/*');
  assert.equal(zone.target, './apps/*/src/**', 'target is apps/*');
  assert.ok(zone.message.includes('packages'));
  assert.ok(zone.message.includes('apps'));
});

test('every zone has all required fields', () => {
  for (const zone of boundaryRules.zones) {
    assert.ok(zone.from, 'zone must have a `from` field');
    assert.ok(zone.target, 'zone must have a `target` field');
    assert.ok(zone.message, 'zone must have a `message` field');
    assert.ok(typeof zone.from === 'string');
    assert.ok(typeof zone.target === 'string');
    assert.ok(typeof zone.message === 'string');
  }
});

test('every zone message references ADR-12', () => {
  for (const zone of boundaryRules.zones) {
    assert.ok(
      zone.message.includes('ADR-12'),
      `zone message should reference ADR-12: ${zone.message}`,
    );
  }
});

test('no zone forbids the allowed direction (apps/* -> packages/*)', () => {
  // The rule should NOT block apps/* from importing packages/*.
  // We verify this by checking that no zone has the inverse pattern.
  for (const zone of boundaryRules.zones) {
    const isAppsToPackages =
      zone.from.includes('apps') && zone.target.includes('packages');
    assert.equal(
      isAppsToPackages,
      false,
      `apps -> packages is an allowed direction; zone should not forbid it: ${JSON.stringify(zone)}`,
    );
  }
});
