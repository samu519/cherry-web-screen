import { DEFAULT_PROFILE } from './displayProfiles.js';
import { Grid } from './grid.js';
import { parseLayoutDocument } from '../storage/layoutDocument.js';

const initialWidgets = [
    { id: 'clock-main', type: 'clock', size: 'medium', style: 'onlyclock', layout: { column: 0, row: 0, columns: 4, rows: 2 } },
    { id: 'media-main', type: 'media', size: 'large', style: 'artworkProtagonist', layout: { column: 0, row: 2, columns: 4, rows: 4 } },
    { id: 'controls-main', type: 'controls', size: 'mini', style: 'buttons', layout: { column: 0, row: 6, columns: 2, rows: 2 } },
    { id: 'wifi', type: 'toggle', size: 'small', style: 'widget', control: { id: 'wifi', label: 'Wi-Fi' }, layout: { column: 2, row: 6, columns: 2, rows: 1 } },
    { id: 'bluetooth', type: 'toggle', size: 'medium', style: 'widget', control: { id: 'bluetooth', label: 'Bluetooth' }, layout: { column: 2, row: 7, columns: 2, rows: 2 } },
    { id: 'volume-slider-a', type: 'slider', size: 'mini', style: 'bar', control: { id: 'volume', label: 'Volume' }, layout: { column: 0, row: 8, columns: 2, rows: 1 } },
    { id: 'system-main', type: 'system', size: 'cardhorizontal', style: 'circular', layout: { column: 0, row: 9, columns: 4, rows: 2 } },
    { id: 'media-visual-main', type: 'mediaVisual', size: 'medium', style: 'visualizer', layout: { column: 0, row: 11, columns: 4, rows: 3 } },
    { id: 'brightness', type: 'slider', size: 'mini', style: 'default', control: { id: 'brightness', label: 'Brightness' }, layout: { column: 0, row: 14, columns: 2, rows: 1 } },
    { id: 'text-main', type: 'text', size: 'small', style: 'default', layout: { column: 2, row: 14, columns: 2, rows: 2 } }
];

export function createLayoutPreset(name = 'cherry', current = null) {
    const base = { kind: 'cherry-layout', schemaVersion: 2, layoutMode: 'freeform',
        profile: { ...(current?.profile || DEFAULT_PROFILE) }, appearance: { ...(current?.appearance || {}) }, widgets: [] };
    if (name === 'cherry') { base.profile = { ...DEFAULT_PROFILE }; base.widgets = structuredClone(initialWidgets); }
    else if (name === 'minimal') {
        const grid = new Grid(base.profile);
        base.widgets = ['clock', 'system', 'media'].map((type, index) => {
            const row = Math.floor(index * base.profile.rows / 3);
            const endRow = Math.floor((index + 1) * base.profile.rows / 3);
            const layout = { column: 0, row, columns: base.profile.columns, rows: Math.max(1, endRow - row) };
            return { ...structuredClone(initialWidgets.find(widget => widget.type === type)), layout, geometry: grid.getGeometry(layout) };
        });
    } else if (name !== 'blank') throw new Error('Preset desconocido.');
    return parseLayoutDocument(base);
}
