import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AppState } from '../src/core/state/state.js';
import { CONTROL_DEFAULTS, CONTROL_STORAGE_KEY, readControlPreferences, persistControlPreferences } from '../src/core/state/controlPersistence.js';

function memoryStorage(initial = null) {
    let value = initial;
    return { getItem: () => value, setItem: (key, next) => { assert.equal(key, CONTROL_STORAGE_KEY); value = next; } };
}
test('shared controls notify both widgets once and preserve source', () => {
    const state = new AppState(CONTROL_DEFAULTS);
    const received = [];
    const unsubscribe = state.subscribe('wifi', event => received.push(event));
    state.set('wifi', true, 'controls-main');
    state.set('wifi', true, 'wifi-widget');
    assert.equal(received.length, 1);
    assert.equal(received[0].source, 'controls-main');
    assert.equal(state.get('wifi'), true);
    unsubscribe();
    state.set('wifi', false);
    assert.equal(received.length, 1);
});
test('control preferences survive recreation and can detach persistence', () => {
    const storage = memoryStorage();
    const state = new AppState(CONTROL_DEFAULTS);
    const detach = persistControlPreferences(state, storage);
    state.set('volume', 32, 'slider');
    state.set('wifi', true, 'toggle');
    assert.equal(readControlPreferences(storage).volume, 32);
    assert.equal(readControlPreferences(storage).wifi, true);
    detach(); state.set('volume', 99);
    assert.equal(readControlPreferences(storage).volume, 32);
});
test('invalid, blocked and out of range preferences recover safely', () => {
    assert.deepEqual(readControlPreferences(memoryStorage('{')), CONTROL_DEFAULTS);
    const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('full'); } };
    assert.deepEqual(readControlPreferences(blocked), CONTROL_DEFAULTS);
    const values = readControlPreferences(memoryStorage(JSON.stringify({version:1, values:{wifi:'false', volume:200, brightness:-1}})));
    assert.equal(values.wifi, false); assert.equal(values.volume,100); assert.equal(values.brightness,0);
    const state = new AppState(CONTROL_DEFAULTS);
    persistControlPreferences(state, blocked);
    assert.doesNotThrow(() => state.set('wifi', true));
});
test('relative JavaScript imports match exact filename casing for Linux', () => {
    function walk(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]); }
    for(const file of walk('src').filter(f=>f.endsWith('.js'))) {
        for(const match of fs.readFileSync(file,'utf8').matchAll(/from\s+["'](\.[^"']+)["']/g)) {
            let dir=path.dirname(path.resolve(file));
            for(const part of match[1].split('/')) {
                if(part==='.' || part==='..') { dir=path.resolve(dir,part); continue; }
                assert.ok(fs.readdirSync(dir).includes(part), file+': '+match[1]);
                dir=path.join(dir,part);
            }
        }
    }
});
