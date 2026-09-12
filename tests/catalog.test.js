import test from 'node:test';
import assert from 'node:assert/strict';
import { works, clampStop, filterWorks, station } from '../src/catalog.js';

test('mockups cannot masquerade as original artwork', () => {
  assert.equal(filterWorks('original').length, 4);
  for (const work of filterWorks('placeholder')) {
    assert.equal(work.src, undefined);
    assert.match(work.medium, /Not an artwork/);
  }
  assert.equal(new Set(works.map(work => work.id)).size, works.length);
});
test('navigation stays within the exhibition', () => {
  assert.equal(clampStop(-1), 0);
  assert.equal(clampStop(works.length), works.length - 1);
  assert.equal(clampStop(NaN), 0);
  assert.equal(clampStop(1), 1);
});
test('future catalog additions have distinct navigable stations', () => {
  assert.ok(station(10).z < station(9).z);
  assert.notEqual(station(0).x, station(1).x);
});
