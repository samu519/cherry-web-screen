import assert from 'node:assert/strict';
import { openBrowser } from './browserHarness.mjs';
import { snapshot, capabilities } from './native-fixture.mjs';

const init = `window.fixture = ${JSON.stringify(snapshot())};
window.nativeCalls = []; window.failNative = false; window.rejectControl = false; window.delayControl = false;
window.__TAURI__ = { core: { invoke: async (command, args) => {
    window.nativeCalls.push({command, args});
    if (window.failNative) throw new Error('Desconectado');
    if (command === 'native_capabilities') return ${JSON.stringify(capabilities())};
    if (command === 'native_snapshot') return structuredClone(window.fixture);
    if (command === 'native_set_control') {
        if (window.rejectControl) throw new Error('Windows rechazó el cambio');
        if (window.delayControl) await new Promise(resolve => window.confirmControl = resolve);
        window.fixture.controls[args.request.id].value = args.request.value;
        return { protocolVersion: 1, ...args.request };
    }
    if (command === 'native_media_action') { window.fixture.media.playing = !window.fixture.media.playing; return structuredClone(window.fixture.media); }
    throw new Error('Comando inesperado');
}}};`;
const { page, errors, close } = await openBrowser({ width: 1280, height: 1000 }, init);
try {
    await page.waitForFunction(() => window.cherryApp.native.mode === 'live');
    assert.equal(await page.locator('.cherry-system [data-available="false"]').count(), 2);
    assert.match(await page.locator('.cherry-media-title').innerText(), /Sin sesión/);
    assert.equal(await page.locator('.cherry-media-artwork').count(), 0);
    assert.equal(await page.locator('.cherry-system .cherry-provider-badge').innerText(), 'Windows');
    const wifi = page.locator('.cherry-controls [data-control="wifi"]');
    await page.evaluate(() => window.delayControl = true);
    await wifi.click();
    await page.waitForFunction(() => Boolean(window.confirmControl));
    assert.equal(await wifi.getAttribute('aria-pressed'), 'false');
    assert.ok(await wifi.isDisabled());
    await page.evaluate(() => window.confirmControl());
    await page.waitForFunction(() => window.cherryApp.native.pending.size === 0);
    assert.equal(await wifi.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-widget-id="wifi"] button').getAttribute('aria-pressed'), 'true', 'standalone duplicate shares confirmed state');
    await page.evaluate(() => { window.delayControl = false; window.rejectControl = true; });
    await wifi.click();
    await page.waitForFunction(() => window.cherryApp.native.pending.size === 0);
    assert.equal(await wifi.getAttribute('aria-pressed'), 'true');
    await wifi.focus(); await page.keyboard.press('Alt+ArrowDown');
    await page.locator('.cherry-expansion-panel').waitFor();
    assert.match(await page.locator('.cherry-expansion-panel').innerText(), /Estado confirmado|permiso|Windows/);
    assert.doesNotMatch(await page.locator('.cherry-expansion-panel').innerText(), /Cherry_Network/);
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
        const service = window.cherryApp.native; service.stop(); service.running = true;
        window.fixture.media = { ...window.fixture.media, available: true, title: 'Canción real', artist: 'Artista',
            controls: { playPause: true, previous: false, next: true }, reason: null };
        return service.poll();
    });
    assert.equal(await page.locator('.cherry-media-title').innerText(), 'Canción real');
    await page.locator('.cherry-media-controls [aria-label="Reproducir"]').click();
    await page.locator('.cherry-media-controls [aria-label="Pausar"]').waitFor();
    await page.evaluate(() => { const s = window.cherryApp.native; clearTimeout(s.timer); window.failNative = true; return s.poll(); });
    assert.equal(await page.locator('.cherry-system [data-available="false"]').count(), 4);
    assert.ok(await wifi.isDisabled());
    assert.doesNotMatch(await page.locator('.cherry-media').innerText(), /Blinding Lights/);
    assert.deepEqual(errors, []);
    console.log('Native UI: confirmed/rejected controls, unavailable sensors, media and disconnect passed (mock IPC).');
} finally { await close(); }
