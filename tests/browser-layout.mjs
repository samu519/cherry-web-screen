import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { openBrowser } from './browserHarness.mjs';

const session = await openBrowser();
const { page, errors } = session;
const doc = () => page.evaluate(() => window.cherryApp.getDocument());
const reload = async () => { await page.reload(); await page.waitForFunction(() => Boolean(window.cherryApp)); };
const enter = () => page.evaluate(() => window.cherryApp.enterEditor());
const leave = () => page.evaluate(() => window.cherryEditor.exitEditor());
try {
    assert.equal((await doc()).widgets.length, 10);
    await enter();
    const ids = await page.evaluate(() => {
        window.cherryEditor.executeWidgetAction('wifi', 'duplicate');
        const wifi = window.cherryApp.canvas.widgets.at(-1).id;
        window.cherryEditor.executeWidgetAction('volume-slider-a', 'duplicate');
        const volume = window.cherryApp.canvas.widgets.at(-1).id;
        return { wifi, volume };
    });
    let snapshot = await doc();
    assert.equal(snapshot.widgets.length, 12);
    assert.equal(snapshot.widgets.find(w => w.id === ids.wifi).control.id, 'wifi');
    assert.equal(snapshot.widgets.find(w => w.id === ids.volume).control.id, 'volume');
    await page.evaluate(wifiId => {
        document.querySelector(`[data-widget-id="${wifiId}"] button`).click();
    }, ids.wifi);
    assert.equal(await page.evaluate(() => window.cherryApp.canvas.widgets.find(w => w.id === 'wifi').control.value), true);
    await page.locator(`[data-widget-id="${ids.volume}"] input`).fill('35');
    assert.equal(await page.evaluate(() => window.cherryApp.canvas.widgets.find(w => w.id === 'volume-slider-a').value), 35);

    await page.evaluate(() => {
        window.deletedClock = window.cherryApp.canvas.widgets.find(w => w.id === 'clock-main');
        window.cherryEditor.deleteWidgets(['clock-main']);
    });
    assert.equal(await page.evaluate(() => window.deletedClock.interval), null, 'deletion stops the clock timer');
    await page.evaluate(() => window.cherryEditor.restoreCanvasState(window.cherryEditor.history.undo()));
    assert.ok((await doc()).widgets.some(w => w.id === 'clock-main'));
    await page.evaluate(() => window.cherryEditor.restoreCanvasState(window.cherryEditor.history.redo()));
    assert.ok(!(await doc()).widgets.some(w => w.id === 'clock-main'));
    await page.evaluate(() => window.cherryEditor.restoreCanvasState(window.cherryEditor.history.undo()));
    await page.evaluate(() => window.cherryEditor.deleteWidgets(window.cherryApp.canvas.widgets.map(w => w.id)));
    assert.equal((await doc()).widgets.length, 0);
    await page.evaluate(() => window.cherryEditor.restoreCanvasState(window.cherryEditor.history.undo()));
    assert.equal((await doc()).widgets.length, 12, 'undo recreates every deleted instance');
    await leave(); await reload();
    assert.equal((await doc()).widgets.length, 12, 'duplicates survive reload');
    assert.equal((await doc()).widgets.find(w => w.id === ids.wifi).control.id, 'wifi');

    await enter();
    await page.evaluate(() => {
        window.cherryEditor.deleteWidgets(['wifi']);
        window.cherryEditor.executeWidgetAction('clock-main', 'hide');
        window.cherryEditor.executeWidgetAction('bluetooth', 'lock');
    });
    await leave(); await reload();
    snapshot = await doc();
    assert.ok(!snapshot.widgets.some(w => w.id === 'wifi'), 'deleted originals do not return');
    assert.equal(snapshot.widgets.find(w => w.id === 'clock-main').flags.hidden, true);
    assert.equal(snapshot.widgets.find(w => w.id === 'bluetooth').flags.locked, true);
    await page.evaluate(async id => {
        document.querySelector(`[data-widget-id="${id}"] button`).click();
        await window.cherryApp.showWidget('clock-main');
    }, ids.wifi);
    assert.equal(await page.evaluate(() => window.cherryApp.canvas.widgets.find(w => w.id === 'clock-main').element.hidden), false);

    // Export and import use the actual visible file controls.
    await page.locator('.cherry-layout-entry').click();
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar layout (.json)', exact: true }).click();
    const download = await downloadEvent;
    assert.equal(download.suggestedFilename(), 'cherry-layout.json');
    const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.equal(exported.schemaVersion, 2); assert.equal(exported.widgets.length, 11);
    const primary = await page.evaluate(() => localStorage.getItem('cherry-layout-state-v1'));
    await page.locator('.cherry-overlay[aria-hidden="false"] input[type="file"]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
    await page.waitForFunction(() => document.querySelector('.cherry-layout-status').dataset.error === 'true');
    assert.equal(await page.evaluate(() => localStorage.getItem('cherry-layout-state-v1')), primary, 'invalid import preserves saved state');
    const empty = { ...exported, widgets: [] };
    await page.locator('.cherry-layout-entry').click();
    await page.locator('.cherry-overlay[aria-hidden="false"] input[type="file"]').setInputFiles({ name: 'empty.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(empty)) });
    await page.waitForFunction(() => window.cherryApp.canvas.widgets.length === 0);
    await reload(); assert.equal((await doc()).widgets.length, 0, 'intentionally empty layout survives reload');
    await page.locator('.cherry-layout-entry').click();
    await page.getByRole('button', { name: 'Recuperar copia anterior', exact: true }).click();
    await page.waitForFunction(() => window.cherryApp.canvas.widgets.length === 11);
    await page.evaluate(async data => {
        const { DISPLAY_PROFILES } = await import('/src/core/layouts/displayProfiles.js');
        window.layoutTestProfiles = DISPLAY_PROFILES;
    });
    for (const id of ['compact-portrait', 'wide', 'desktop', 'cherry-portrait']) {
        await page.locator('.cherry-layout-entry').click();
        await page.getByRole('combobox', { name: 'Perfil de pantalla' }).selectOption(id);
        await page.waitForFunction(id => window.cherryApp.canvas.profile.id === id, id);
        const result = await doc();
        const { width, height } = result.profile;
        assert.deepEqual(await page.evaluate(() => [document.body.offsetWidth, document.body.offsetHeight]), [width, height]);
        for (const widget of result.widgets) assert.ok(widget.geometry.x >= 0 && widget.geometry.y >= 0 && widget.geometry.x + widget.geometry.width <= width + 0.5 && widget.geometry.y + widget.geometry.height <= height + 0.5);
    }
    await page.evaluate(() => window.cherryApp.setLayoutMode('grid'));
    await enter();
    await page.evaluate(() => {
        const widget = window.cherryApp.canvas.widgets.find(w => w.id === 'text-main');
        widget.setGeometry({ x: 16, y: 16, width: 212, height: 106 });
        window.cherryEditor.state.selectWidget(widget.id, false);
    });
    await page.locator('.cherry-widget[data-widget-id="text-main"]').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal((await doc()).widgets.find(w => w.id === 'text-main').layout.column, 1, 'keyboard movement snaps to real grid cells');
    await page.evaluate(() => window.cherryApp.setLayoutMode('freeform'));
    assert.ok(await page.evaluate(() => Boolean(window.cherryEditor)), 'profile/mode replacement keeps editor available');
    await page.evaluate(() => {
        const widget = window.cherryApp.canvas.widgets.find(w => w.id === 'text-main');
        widget.setGeometry({ x: 23, y: 239, width: 199, height: 103 });
    });
    await leave(); await reload();
    assert.deepEqual((await doc()).widgets.find(w => w.id === 'text-main').geometry, { x: 23, y: 239, width: 199, height: 103 });

    // A corrupt primary restores the backup and retains the original rejected bytes.
    const good = await doc();
    await page.evaluate(good => {
        localStorage.setItem('cherry-layout-backup-v2', JSON.stringify(good));
        localStorage.setItem('cherry-layout-state-v1', 'rejected raw layout');
    }, good);
    await reload();
    assert.equal((await doc()).widgets.length, 11);
    assert.equal(await page.evaluate(() => localStorage.getItem('cherry-layout-rejected-v2')), 'rejected raw layout');
    // Legacy documents migrate all instances without requiring matching hard-coded IDs.
    await page.evaluate(good => localStorage.setItem('cherry-layout-state-v1', JSON.stringify({ widgets: good.widgets, appearance: good.appearance })), good);
    await reload(); assert.equal((await doc()).widgets.length, 11);
    assert.deepEqual((await doc()).widgets.find(w => w.id === 'text-main').geometry, { x: 23, y: 239, width: 199, height: 103 });

    const beforePresets = await doc();
    for (const [name, count] of [['Minimal · reloj, sistema y media', 3], ['Lienzo vacío', 0], ['Cherry original · 480 × 1920', 10]]) {
        await page.locator('.cherry-layout-entry').click();
        await page.getByRole('button', { name, exact: true }).click();
        await page.waitForFunction(count => window.cherryApp.canvas.widgets.length === count, count);
        await reload(); assert.equal((await doc()).widgets.length, count, `${name} survives reload`);
        await page.evaluate(document => window.cherryApp.importLayout(document), beforePresets);
    }

    await enter();
    await page.getByTitle('Preview Mode', { exact: true }).click();
    await page.waitForFunction(() => document.body.dataset.displayMode === 'clean' && !document.getElementById('cherry-editor'));
    assert.equal(await page.locator('.cherry-layout-entry').isVisible(), false);
    for (const button of await page.locator('.cherry-editor-entry-button').all()) assert.equal(await button.isVisible(), false);
    assert.ok(new URL(page.url()).searchParams.get('display') === '1');
    await reload();
    assert.equal(await page.locator('.cherry-layout-entry').isVisible(), false);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.cherry-layout-entry').isVisible(), true);
    await page.evaluate(() => window.cherryApp.setDisplayMode(true));
    await page.locator('.cherry-display-exit').tap();
    assert.equal(await page.locator('.cherry-layout-entry').isVisible(), true);
    await page.locator('.cherry-layout-entry').click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(os.tmpdir(), 'cherry-layout-platform.png') });
    assert.deepEqual(errors, [], 'no runtime errors during layout lifecycle');
    console.log('Layout browser checks passed: functional duplicates, shared control identities, reload/deletion/empty layouts, undo/redo, hidden/locked state, actual import/export UI, recovery, legacy migration, profiles, grid/freeform, clean display and touch exit.');
} finally { await session.close(); }
