import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { chromium } from 'playwright';

// Serves only this checkout; no persistent server or browser profile is left behind.
const root = process.cwd();
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = createServer(async (req, res) => {
    try {
        const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
        if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
        const target = (await stat(file)).isDirectory() ? path.join(file, 'index.html') : file;
        res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
        res.end(await readFile(target));
    } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
    const chrome = process.env.CHERRY_BROWSER_PATH || [
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
    ].find(existsSync);
    browser = await chromium.launch({ headless: true, ...(chrome ? { executablePath: chrome } : {}) });
    const page = await browser.newPage({ viewport: { width: 480, height: 1920 }, hasTouch: true });
    page.setDefaultTimeout(60000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.cherryApp?.canvas.widgets.length > 0);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const dimensions = await page.evaluate(() => ({
        body: [document.body.offsetWidth, document.body.offsetHeight],
        canvas: [document.getElementById('cherry-canvas').offsetWidth, document.getElementById('cherry-canvas').offsetHeight],
        scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight]
    }));
    assert.deepEqual(dimensions, { body: [480, 1920], canvas: [480, 1920], scroll: [480, 1920] });
    await page.screenshot({ path: path.join(os.tmpdir(), 'cherry-display-dark.png'), fullPage: true });
    const darkToggleColor = await page.locator('[data-widget-id="wifi"]').evaluate(el => getComputedStyle(el).color);
    assert.equal(darkToggleColor, 'rgb(245, 245, 247)', 'standalone toggle uses readable theme text');
    assert.equal(await page.locator('[data-widget-id="wifi"] .cherry-ui-icon').count(), 1);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(os.tmpdir(), 'cherry-display-light.png'), fullPage: true });
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    assert.equal(await page.locator('input[type="range"]').evaluateAll(inputs => inputs.filter(el => !el.getAttribute('aria-label')).length), 0);
    const wifi = page.locator('[data-widget-id="controls-main"] button[data-control="wifi"]');
    const state = () => page.evaluate(async () => (await import('/src/core/state/appState.js')).appState.get('wifi'));
    const initial = await state();
    await wifi.click();
    assert.equal(await state(), !initial, 'short press toggles once');
    assert.equal(await wifi.getAttribute('aria-pressed'), String(!initial));
    const anchor = await wifi.boundingBox();
    await page.mouse.move(anchor.x + anchor.width / 2, anchor.y + anchor.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(550);
    await page.mouse.up();
    const panel = page.locator('.cherry-expansion-panel');
    await panel.waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    assert.equal(await state(), !initial, 'holding opens settings without toggling');
    const box = await panel.boundingBox();
    assert.ok(Math.abs(box.x + box.width / 2 - 240) < 1, 'panel centered horizontally');
    assert.ok(Math.abs(box.y + box.height / 2 - 960) < 1, 'panel centered vertically');
    assert.ok(box.x >= 16 && box.x + box.width <= 464 && box.y >= 16 && box.y + box.height <= 1904);
    assert.equal(await panel.getAttribute('role'), 'dialog');
    assert.equal(await panel.getAttribute('aria-modal'), 'true');
    assert.ok(await page.evaluate(() => document.querySelector('.cherry-expansion-panel').contains(document.activeElement)));
    await page.keyboard.press('Shift+Tab');
    assert.ok(await page.evaluate(() => document.querySelector('.cherry-expansion-panel').contains(document.activeElement)));
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => document.querySelector('.cherry-expansion-panel').contains(document.activeElement)));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(220);

    // Real touch input follows the same short/long press contract as mouse input.
    const touchBefore = await state();
    await wifi.tap();
    assert.equal(await state(), !touchBefore);
    const touchBox = await wifi.boundingBox();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchBox.x + touchBox.width / 2, y: touchBox.y + touchBox.height / 2 }] });
    await page.waitForTimeout(550);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await panel.waitFor({ state: 'visible' });
    assert.equal(await state(), !touchBefore, 'touch hold does not toggle');
    await page.waitForTimeout(300);
    await page.locator('.cherry-expansion-panel__close').tap();
    await page.waitForTimeout(220);
    assert.equal(await panel.count(), 0, 'first touch on close works after holding');
    assert.equal(await panel.count(), 0);
    assert.ok(await wifi.evaluate(el => document.activeElement === el), 'focus returns to original control');
    await page.keyboard.press('Alt+ArrowDown');
    await panel.waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    await page.locator('.cherry-expansion-panel__close').click();
    await page.waitForTimeout(220);
    assert.equal(await panel.count(), 0, 'first close click after keyboard open works');

    // A cancelled hold must not open a panel after release or pointer loss.
    await wifi.dispatchEvent('pointerdown', { pointerId: 9, clientX: 50, clientY: 50, button: 0 });
    await wifi.dispatchEvent('pointermove', { pointerId: 9, clientX: 100, clientY: 50 });
    await page.waitForTimeout(550);
    assert.equal(await panel.count(), 0, 'movement cancels long press');
    await wifi.dispatchEvent('pointerdown', { pointerId: 10, clientX: 50, clientY: 50, button: 0 });
    await page.locator('body').dispatchEvent('pointerup', { pointerId: 10 });
    await page.waitForTimeout(550);
    assert.equal(await panel.count(), 0, 'release outside cancels long press');

    // Reopening while an old overlay fades out must not close the new panel.
    await page.evaluate(() => {
        const manager = window.cherryApp.canvas.widgets.find(w => w.id === 'controls-main').expansionManager;
        const element = document.querySelector('[data-widget-id="controls-main"] button[data-control="wifi"]');
        manager.openPanel({ id: 'old', label: 'Old', element });
        manager.openPanel({ id: 'tall', label: 'Contenido largo', element,
            getContent: () => ({ items: Array.from({ length: 100 }, (_, i) => ({ label: `Opción ${i}`, callback() {} })) }) });
    });
    await page.waitForTimeout(350);
    assert.equal(await panel.getAttribute('data-control-id'), 'tall');
    const tall = await panel.boundingBox();
    assert.ok(tall.height <= 1888.5 && tall.y >= 15.5 && tall.y + tall.height <= 1904.5, JSON.stringify(tall));
    assert.ok(await page.locator('.cherry-expansion-panel__content').evaluate(el => el.scrollHeight > el.clientHeight));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(220);

    await page.setViewportSize({ width: 1280, height: 1000 });
    assert.deepEqual(await page.evaluate(() => [document.body.offsetWidth, document.body.offsetHeight]), [480, 1920]);
    // A short browser viewport must show every row, including the bottom widgets.
    for (const viewport of [{ width: 1280, height: 1000 }, { width: 480, height: 1280 }, { width: 384, height: 1536 }, { width: 320, height: 720 }]) {
        await page.setViewportSize(viewport);
        await page.waitForFunction(({ height }) => document.getElementById('cherry-canvas').getBoundingClientRect().bottom <= height + 1, viewport);
        const bounds = await page.evaluate(() => ({
            canvas: document.getElementById('cherry-canvas').getBoundingClientRect().toJSON(),
            widgets: Array.from(document.querySelectorAll('#cherry-canvas > .cherry-widget')).map(el => ({ id: el.dataset.widgetId, rect: el.getBoundingClientRect().toJSON() })),
            scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight]
        }));
        assert.ok(bounds.canvas.x >= -1 && bounds.canvas.right <= viewport.width + 1);
        assert.ok(bounds.canvas.y >= -1 && bounds.canvas.bottom <= viewport.height + 1);
        assert.ok(bounds.scroll[0] <= viewport.width && bounds.scroll[1] <= viewport.height);
        for (const { id, rect } of bounds.widgets) {
            assert.ok(rect.x >= -1 && rect.right <= viewport.width + 1 && rect.y >= -1 && rect.bottom <= viewport.height + 1, `${id} clipped in ${viewport.width} x ${viewport.height}`);
        }
        await wifi.focus();
        await page.keyboard.press('Alt+ArrowDown');
        await panel.waitFor({ state: 'visible' });
        await page.waitForTimeout(300);
        const scaledPanel = await panel.boundingBox();
        const canvasBox = await page.locator('#cherry-canvas').boundingBox();
        assert.ok(Math.abs(scaledPanel.x + scaledPanel.width / 2 - canvasBox.x - canvasBox.width / 2) < 1);
        assert.ok(Math.abs(scaledPanel.y + scaledPanel.height / 2 - canvasBox.y - canvasBox.height / 2) < 1);
        await page.keyboard.press('Escape');
        await panel.waitFor({ state: 'detached' });
    }
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.evaluate(() => window.cherryApp.enterEditor());
    await page.locator('#cherry-editor').waitFor();
    assert.equal(await page.evaluate(() => document.body.offsetWidth), 1280, 'editor uses desktop viewport');
    await page.locator('[data-widget-id="clock-main"]').focus();
    await page.keyboard.press('Alt+ArrowDown');
    const context = page.locator('.cherry-context-popover');
    await context.waitFor({ state: 'visible' });
    await page.waitForTimeout(250);
    const contextBox = await context.boundingBox();
    assert.ok(Math.abs(contextBox.x + contextBox.width / 2 - 640) < 1);
    assert.ok(Math.abs(contextBox.y + contextBox.height / 2 - 500) < 1);
    await page.keyboard.press('Escape');
    await context.waitFor({ state: 'detached' });
    assert.equal(await context.count(), 0);
    await page.evaluate(() => window.cherryEditor.state.selectWidget('clock-main'));
    assert.equal(await page.locator('.cherry-property-control__select').first().evaluate(el => getComputedStyle(el).borderRadius), '12px');
    await page.screenshot({ path: path.join(os.tmpdir(), 'cherry-editor-dark.png') });
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(os.tmpdir(), 'cherry-editor-light.png') });
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.evaluate(() => window.cherryEditor.exitEditor());
    await page.waitForTimeout(300);
    assert.deepEqual(await page.evaluate(() => [document.body.offsetWidth, document.body.offsetHeight]), [480, 1920]);
    await page.setViewportSize({ width: 480, height: 1920 });
    await wifi.focus();
    await page.keyboard.press('Alt+ArrowDown');
    await panel.waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    const screenshot = path.join(os.tmpdir(), 'cherry-interaction-480x1920.png');
    await page.screenshot({ path: screenshot, fullPage: true });
    assert.deepEqual(errors, [], 'no browser runtime errors');
    console.log('Browser checks passed: display bounds, all widgets visible in 4 smaller viewports, centered panels, short/long press, cancellation, keyboard, focus, long content, reopening, editor round trip.');
    console.log(`Screenshot: ${screenshot}`);
} finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
}
