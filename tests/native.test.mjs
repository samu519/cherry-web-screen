import test from 'node:test';
import assert from 'node:assert/strict';
import { NativeBridge, validateSnapshot } from '../src/services/nativeBridge.js';
import { NativeService } from '../src/services/nativeService.js';
import { AppState } from '../src/core/state/state.js';
import { persistControlPreferences, CONTROL_STORAGE_KEY } from '../src/core/state/controlPersistence.js';
import { snapshot, capabilities } from './native-fixture.mjs';

test('IPC rejects incompatible versions, invalid telemetry and control acknowledgements', async () => {
    assert.equal(validateSnapshot(snapshot()).telemetry.gpu.value, null);
    assert.throws(() => validateSnapshot({ ...snapshot(), protocolVersion: 2 }));
    const bad = snapshot(); bad.telemetry.cpu.value = NaN;
    assert.throws(() => validateSnapshot(bad));
    const bridge = new NativeBridge(async () => ({ protocolVersion: 1, id: 'wifi', value: true }));
    await assert.rejects(bridge.setControl('volume', 50));
    await assert.rejects(bridge.setControl('wifi', 50));
    await assert.rejects(bridge.setControl('volume', 101));
});

test('OS requests update shared state only after confirmation; failures retain it', async () => {
    let resolve, reject;
    const state = new AppState({ volume: 75 });
    const bridge = { available: true, discover: async () => capabilities(), snapshot: async () => snapshot(),
        setControl: () => new Promise((yes, no) => { resolve = yes; reject = no; }) };
    const service = new NativeService({ bridge, state, interval: 100000 });
    try {
        await service.start(); assert.equal(state.get('volume'), 32);
        const request = service.requestControl('volume', 60);
        assert.equal(state.get('volume'), 32); assert.ok(service.pending.has('volume'));
        resolve({ value: 59 }); await request;
        assert.equal(state.get('volume'), 59); assert.equal(service.snapshot.controls.volume.value, 59);
        const failed = service.requestControl('volume', 10); reject(new Error('Denied'));
        await assert.rejects(failed); assert.equal(state.get('volume'), 59);
        await assert.rejects(service.requestControl('brightness', 60));
    } finally { service.stop(); }
});

test('stale polls cannot overwrite a newly confirmed control', async () => {
    let resolvePoll;
    const state = new AppState();
    const bridge = { available: true, discover: async () => capabilities(), snapshot: async () => snapshot(), setControl: async () => ({ value: 80 }) };
    const service = new NativeService({ bridge, state, interval: 100000 });
    try {
        await service.start(); clearTimeout(service.timer);
        bridge.snapshot = () => new Promise(resolve => { resolvePoll = resolve; });
        const poll = service.poll();
        await service.requestControl('volume', 80);
        resolvePoll(snapshot()); await poll;
        assert.equal(state.get('volume'), 80); assert.equal(service.snapshot.controls.volume.value, 80);
    } finally { service.stop(); }
});

test('connection loss clears real readings and retry recovers without demo fallback', async () => {
    const bridge = { available: true, discover: async () => capabilities(), snapshot: async () => snapshot() };
    const service = new NativeService({ bridge, state: new AppState(), interval: 100000 });
    try {
        await service.start(); clearTimeout(service.timer);
        bridge.snapshot = async () => { throw new Error('Disconnected'); };
        await service.poll(); clearTimeout(service.timer);
        assert.equal(service.mode, 'offline'); assert.equal(service.snapshot, null); assert.equal(service.state.get('volume'), null);
        bridge.snapshot = async () => snapshot(); await service.poll(); assert.equal(service.mode, 'live');
    } finally { service.stop(); }
});

test('a poll started during a pending OS request cannot revert its acknowledgement', async () => {
    let acknowledge, resolvePoll;
    const state = new AppState();
    const bridge = { available: true, discover: async () => capabilities(), snapshot: async () => snapshot(),
        setControl: () => new Promise(resolve => { acknowledge = resolve; }) };
    const service = new NativeService({ bridge, state, interval: 100000 });
    try {
        await service.start(); clearTimeout(service.timer);
        const request = service.requestControl('volume', 81);
        bridge.snapshot = () => new Promise(resolve => { resolvePoll = resolve; });
        const poll = service.poll();
        acknowledge({ value: 81 }); await request;
        resolvePoll(snapshot()); await poll;
        assert.equal(state.get('volume'), 81); assert.equal(service.snapshot.controls.volume.value, 81);
    } finally { service.stop(); }
});

test('native state never replaces browser preferences, including when local theme changes', () => {
    const data = new Map(); const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
    const state = new AppState({ volume: 75, darkMode: true });
    const unsubscribe = persistControlPreferences(state, storage);
    state.set('volume', null, 'native:connecting'); state.set('volume', 22, 'native:sample');
    state.set('darkMode', false, 'ui');
    const saved = JSON.parse(data.get(CONTROL_STORAGE_KEY));
    assert.equal(saved.values.volume, 75); assert.equal(saved.values.darkMode, false); unsubscribe();
});

test('browser-only mode keeps local controls without making native calls', async () => {
    const service = new NativeService({ bridge: new NativeBridge(null), state: new AppState() });
    await service.start(); await service.requestControl('wifi', true);
    assert.equal(service.mode, 'demo'); assert.equal(service.state.get('wifi'), true);
});

test('hung native reads time out without queueing more backend requests', async () => {
    let resolve, calls = 0;
    const bridge = new NativeBridge(() => { calls++; return new Promise(done => { resolve = done; }); }, 10);
    await assert.rejects(bridge.snapshot(), /tiempo/);
    await assert.rejects(bridge.snapshot(), /lectura anterior/);
    assert.equal(calls, 1);
    resolve(snapshot()); await new Promise(done => setTimeout(done, 0));
    bridge.invoke = async () => snapshot();
    assert.equal((await bridge.snapshot()).provider, 'windows');
});
