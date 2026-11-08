import test from 'node:test';
import assert from 'node:assert/strict';
import { getDisplayScale } from '../src/core/canvas/displayViewport.js';

test('dashboard fits shorter browser windows without changing display geometry', () => {
    assert.equal(getDisplayScale(480, 1920, 1280, 1000), 1000 / 1920);
    assert.equal(getDisplayScale(480, 1920, 480, 1280), 1280 / 1920);
    assert.equal(getDisplayScale(480, 1920, 384, 1536), 0.8);
    assert.equal(getDisplayScale(480, 1920, 320, 1920), 320 / 480);
});

test('physical display and larger viewports retain native size', () => {
    assert.equal(getDisplayScale(480, 1920, 480, 1920), 1);
    assert.equal(getDisplayScale(480, 1920, 1920, 2160), 1);
});

test('hidden or invalid viewports cannot create a zero or invalid scale', () => {
    assert.equal(getDisplayScale(480, 1920, 0, 0), 1);
    assert.equal(getDisplayScale(480, 1920, NaN, 900), 1);
});
