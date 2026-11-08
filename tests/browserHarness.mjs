import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

export async function openBrowser(viewport = { width: 1280, height: 1000 }, initScript) {
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
        const executablePath = process.env.CHERRY_BROWSER_PATH || [
            'C:/Program Files/Google/Chrome/Application/chrome.exe',
            'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
        ].find(existsSync);
        browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
        const page = await browser.newPage({ viewport, hasTouch: true });
        page.setDefaultTimeout(60000);
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        if (initScript) await page.addInitScript(initScript);
        await page.goto(`http://127.0.0.1:${server.address().port}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await page.waitForFunction(() => Boolean(window.cherryApp));
        return { page, errors, async close() { await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
    } catch (error) { await browser?.close(); server.closeAllConnections(); server.close(); throw error; }
}
