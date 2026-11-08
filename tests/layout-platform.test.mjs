import test from 'node:test';
import assert from 'node:assert/strict';
import { createLayoutPreset } from '../src/core/layouts/layoutPresets.js';
import { parseLayoutDocument } from '../src/core/storage/layoutDocument.js';
import { LayoutRepository, LAYOUT_KEY, BACKUP_KEY, RECOVERY_KEY } from '../src/core/storage/layoutRepository.js';
import { DISPLAY_PROFILES, changeDocumentProfile } from '../src/core/layouts/displayProfiles.js';
import { Grid } from '../src/core/layouts/grid.js';

const memory = () => {
    const values = new Map();
    return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('versioned layouts round trip, including an intentionally empty dashboard', () => {
    const original = createLayoutPreset();
    assert.equal(original.widgets.length, 10);
    assert.deepEqual(parseLayoutDocument(JSON.stringify(original)), original);
    const empty = createLayoutPreset('blank', original);
    assert.deepEqual(parseLayoutDocument(empty).widgets, []);
    assert.equal(empty.schemaVersion, 2);
});

test('legacy object and array documents migrate without resetting geometry', () => {
    const widgets = createLayoutPreset().widgets;
    widgets[0].geometry.x = 23; widgets[0].geometry.width = 400;
    const legacy = parseLayoutDocument({ widgets, appearance: { accentColor: '#123456' } });
    assert.equal(legacy.schemaVersion, 2);
    assert.equal(legacy.widgets[0].geometry.x, 23);
    assert.equal(legacy.appearance.accentColor, '#123456');
    assert.equal(parseLayoutDocument(widgets).widgets.length, 10);
});

test('invalid imports reject unknown versions, types, duplicate ids, geometry and profiles', () => {
    const change = mutate => { const document = createLayoutPreset(); mutate(document); return document; };
    for (const invalid of [
        change(d => { d.schemaVersion = 999; }),
        change(d => { d.widgets[0].type = 'unknown'; }),
        change(d => { d.widgets[1].id = d.widgets[0].id; }),
        change(d => { d.widgets[0].geometry.x = -100; }),
        change(d => { d.widgets[0].geometry.width = Infinity; }),
        change(d => { d.profile.rows = 0; }),
        change(d => { d.widgets[0].size = 'impossible'; }),
        change(d => { d.widgets.find(w => w.type === 'controls').state.controls = 'broken'; }),
        change(d => { d.widgets.find(w => w.type === 'mediaVisual').state.slides = null; }),
        change(d => { d.widgets.find(w => w.type === 'text').state.text = {}; }),
        change(d => { d.layoutMode = 'unknown'; })
    ]) assert.throws(() => parseLayoutDocument(invalid));
    assert.throws(() => parseLayoutDocument('{not-json}'));
    assert.throws(() => parseLayoutDocument('{"widgets":[],"__proto__":{}}'));
    assert.throws(() => parseLayoutDocument(' '.repeat(2 * 1024 * 1024 + 1)));
});

test('recovery retains a last valid document and preserves rejected raw data', () => {
    const storage = memory(); const repository = new LayoutRepository(storage);
    const original = createLayoutPreset(); const empty = createLayoutPreset('blank', original);
    repository.save(original); repository.save(empty);
    assert.equal(repository.load(original).document.widgets.length, 0);
    assert.equal(repository.backup().widgets.length, 10);
    storage.setItem(LAYOUT_KEY, 'broken original text');
    const recovered = repository.load(empty);
    assert.equal(recovered.source, 'backup');
    assert.equal(recovered.document.widgets.length, 10);
    assert.equal(storage.getItem(RECOVERY_KEY), 'broken original text');
    assert.ok(storage.getItem(BACKUP_KEY));
    repository.save(recovered.document);
    assert.equal(repository.load(empty).source, 'saved');
});

test('failed imports and quota failures cannot overwrite a running saved layout', () => {
    const storage = memory(); const repository = new LayoutRepository(storage);
    repository.save(createLayoutPreset()); const before = storage.getItem(LAYOUT_KEY);
    assert.throws(() => repository.save('{'));
    assert.equal(storage.getItem(LAYOUT_KEY), before);
    const blocked = new LayoutRepository({ getItem: storage.getItem, setItem() { throw new DOMException('full', 'QuotaExceededError'); } });
    assert.throws(() => blocked.save(createLayoutPreset('blank')));
    assert.equal(storage.getItem(LAYOUT_KEY), before);
});

test('all profiles keep every widget within bounds in grid and freeform modes', () => {
    for (const layoutMode of ['grid', 'freeform']) {
        const document = createLayoutPreset(); document.layoutMode = layoutMode;
        for (const profile of DISPLAY_PROFILES) {
            const next = parseLayoutDocument(changeDocumentProfile(document, profile));
            for (const widget of next.widgets) {
                const { x, y, width, height } = widget.geometry;
                assert.ok(x >= 0 && y >= 0 && x + width <= profile.width + 0.5 && y + height <= profile.height + 0.5);
                if (layoutMode === 'grid') assert.deepEqual(widget.geometry, new Grid(profile).getGeometry(widget.layout));
            }
        }
    }
});

test('grid snapping handles edge cells and oversized widgets', () => {
    const grid = new Grid(DISPLAY_PROFILES[0]);
    const layout = grid.getLayoutFromGeometry({ x: 10000, y: 10000, width: 10000, height: 10000 });
    assert.deepEqual(layout, { column: 0, row: 0, columns: 4, rows: 16 });
    const rect = grid.getGeometry(layout);
    assert.ok(rect.x + rect.width <= 480 && rect.y + rect.height <= 1920);
});

test('orientation changes transpose widget placement instead of flattening the whole stack', () => {
    const original = createLayoutPreset();
    const landscape = changeDocumentProfile(original, DISPLAY_PROFILES[2]);
    const media = landscape.widgets.find(widget => widget.type === 'media');
    assert.ok(media.geometry.width > 400 && media.geometry.height > 400);
    const returned = changeDocumentProfile(landscape, DISPLAY_PROFILES[0]);
    for (const [index, widget] of returned.widgets.entries()) {
        for (const key of ['x', 'y', 'width', 'height']) assert.ok(Math.abs(widget.geometry[key] - original.widgets[index].geometry[key]) < 0.001);
    }
});
