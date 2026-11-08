import { DEFAULT_PROFILE } from '../layouts/displayProfiles.js';
import { Grid } from '../layouts/grid.js';
import { WIDGET_CATALOG, canonicalWidgetType } from '../widgets/widgetCatalog.js';

export const LAYOUT_VERSION = 2;
export const MAX_LAYOUT_BYTES = 2 * 1024 * 1024;
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const check = (condition, message) => { if (!condition) throw new Error(message); };
const finite = value => typeof value === 'number' && Number.isFinite(value);

function safeData(value, depth = 0) {
    check(depth <= 16, 'El documento tiene demasiados niveles.');
    if (Array.isArray(value)) return value.map(item => safeData(item, depth + 1));
    if (object(value)) {
        const result = {};
        for (const [key, item] of Object.entries(value)) {
            check(!['__proto__', 'constructor', 'prototype'].includes(key), 'Propiedad no permitida.');
            result[key] = safeData(item, depth + 1);
        }
        return result;
    }
    check(value === null || ['string', 'number', 'boolean'].includes(typeof value), 'Solo se permiten datos JSON.');
    if (typeof value === 'number') check(Number.isFinite(value), 'Número no válido.');
    return value;
}

export function parseLayoutDocument(input) {
    if (typeof input === 'string') {
        check(new TextEncoder().encode(input).length <= MAX_LAYOUT_BYTES, 'El layout supera 2 MB.');
        try { input = JSON.parse(input); } catch { throw new Error('El archivo no contiene JSON válido.'); }
    }
    check(input != null, 'No hay un layout para cargar.');
    const raw = safeData(input);
    const legacy = Array.isArray(raw) || (object(raw) && raw.schemaVersion === undefined);
    check(legacy || raw.schemaVersion === LAYOUT_VERSION, 'Versión de layout no compatible.');
    check(legacy || raw.kind === 'cherry-layout', 'El archivo no es un layout de Cherry.');
    const source = Array.isArray(raw) ? { widgets: raw } : raw;
    check(object(source) && Array.isArray(source.widgets), 'Falta la lista de widgets.');
    check(source.widgets.length <= 128, 'Máximo 128 widgets por layout.');
    const profile = { ...DEFAULT_PROFILE, ...(source.profile || {}) };
    check(typeof profile.id === 'string' && typeof profile.name === 'string', 'Perfil no válido.');
    for (const key of ['width', 'height']) check(Number.isInteger(profile[key]) && profile[key] >= 240 && profile[key] <= 7680, `Dimensión no válida: ${key}.`);
    for (const key of ['columns', 'rows']) check(Number.isInteger(profile[key]) && profile[key] >= 1 && profile[key] <= 64, `Grilla no válida: ${key}.`);
    for (const key of ['gap', 'padding']) check(finite(profile[key]) && profile[key] >= 0 && profile[key] <= 64, `Espaciado no válido: ${key}.`);
    const grid = new Grid(profile);
    check(grid.getColumnWidth() >= 12 && grid.getRowHeight() >= 12, 'Las celdas de la grilla son demasiado pequeñas.');
    const layoutMode = source.layoutMode ?? 'freeform';
    check(['grid', 'freeform'].includes(layoutMode), 'Modo de layout no válido.');
    const appearance = { accentColor: '#3b82f6', themeMode: 'dark', backgroundMode: 'static', ...(source.appearance || {}) };
    check(/^#[\da-f]{6}$/i.test(appearance.accentColor), 'El color debe estar en formato #RRGGBB.');
    check(['dark', 'light'].includes(appearance.themeMode), 'Tema no válido.');
    check(['static', 'dynamic'].includes(appearance.backgroundMode), 'Fondo no válido.');
    const ids = new Set();
    const widgets = source.widgets.map((saved, index) => {
        check(object(saved), `Widget ${index + 1} no válido.`);
        const widget = { ...saved, type: canonicalWidgetType(saved.type) };
        check(typeof widget.id === 'string' && /^[a-z\d_-]{1,100}$/i.test(widget.id), 'Identificador de widget no válido.');
        check(!ids.has(widget.id), `Identificador duplicado: ${widget.id}.`); ids.add(widget.id);
        const entry = Object.hasOwn(WIDGET_CATALOG, widget.type) ? WIDGET_CATALOG[widget.type] : null;
        check(entry, `Tipo desconocido: ${widget.type}.`);
        widget.size ??= entry.size; widget.style ??= entry.style; widget.variant ??= 'translucid';
        check(entry.sizes.includes(widget.size), `Tamaño no compatible: ${widget.type}/${widget.size}.`);
        check(entry.styles.includes(widget.style), `Estilo no compatible: ${widget.type}/${widget.style}.`);
        check(['translucid', 'solid', 'glass'].includes(widget.variant), 'Variante no válida.');
        widget.layout = { column: 0, row: 0, columns: 1, rows: 1, ...widget.layout };
        for (const key of ['column', 'row', 'columns', 'rows']) check(Number.isInteger(widget.layout[key]), 'Las coordenadas de grilla deben ser enteros.');
        const { column, row, columns, rows } = widget.layout;
        check(column >= 0 && row >= 0 && columns >= 1 && rows >= 1, 'Coordenadas de grilla no válidas.');
        if (layoutMode === 'grid') check(column + columns <= profile.columns && row + rows <= profile.rows, 'Un widget está fuera de la grilla.');
        let geometry = widget.geometry || grid.getGeometry(widget.layout);
        check(object(geometry) && ['x', 'y', 'width', 'height'].every(key => finite(geometry[key])), 'Geometría no válida.');
        check(geometry.width > 0 && geometry.height > 0, 'El tamaño del widget debe ser positivo.');
        if (!legacy) check(geometry.x >= 0 && geometry.y >= 0 && geometry.x + geometry.width <= profile.width + 0.5 && geometry.y + geometry.height <= profile.height + 0.5, 'Un widget está fuera de la pantalla.');
        widget.geometry = layoutMode === 'grid' ? grid.getGeometry(widget.layout) : grid.constrainGeometry(geometry);
        for (const key of ['settings', 'state']) {
            widget[key] ??= {};
            check(object(widget[key]), `${key} debe ser un objeto.`);
        }
        const optionalType = (key, type) => {
            if (widget.state[key] !== undefined) check(typeof widget.state[key] === type, `Estado no válido: ${widget.type}.${key}.`);
        };
        if (widget.type === 'text') optionalType('text', 'string');
        if (widget.type === 'media') {
            for (const key of ['title', 'artist', 'artwork']) optionalType(key, 'string');
            for (const key of ['progress', 'duration']) optionalType(key, 'number');
        }
        if (widget.type === 'system') for (const key of ['cpu', 'gpu', 'ram', 'temperature']) optionalType(key, 'number');
        if (widget.type === 'controls' && widget.state.controls !== undefined) {
            check(Array.isArray(widget.state.controls), 'La lista de controles no es válida.');
            for (const control of widget.state.controls) {
                check(object(control) && typeof control.id === 'string' && /^[a-z\d_-]{1,100}$/i.test(control.id) &&
                    typeof control.label === 'string' && ['toggle', 'slider', 'action'].includes(control.type), 'Control no válido.');
            }
        }
        if (widget.type === 'mediaVisual' && widget.state.slides !== undefined) {
            check(Array.isArray(widget.state.slides), 'La lista de medios no es válida.');
            for (const slide of widget.state.slides) check(object(slide) && ['image', 'gif', 'video'].includes(slide.type) && typeof slide.src === 'string', 'Medio no válido.');
        }
        widget.flags = { hidden: false, locked: false, zIndex: 1, ...widget.flags };
        check(typeof widget.flags.hidden === 'boolean' && typeof widget.flags.locked === 'boolean' && Number.isInteger(widget.flags.zIndex) && widget.flags.zIndex >= 0 && widget.flags.zIndex <= 99, 'Estado de visibilidad/orden no válido.');
        if (['toggle', 'slider'].includes(widget.type)) {
            const fallbackId = widget.type === 'toggle' ? widget.id : widget.id.includes('brightness') ? 'brightness' : 'volume';
            widget.control ??= { id: fallbackId, label: fallbackId === 'wifi' ? 'Wi-Fi' : fallbackId };
            check(object(widget.control) && typeof widget.control.id === 'string' && /^[a-z\d_-]{1,100}$/i.test(widget.control.id), 'Identidad de control no válida.');
            check(typeof widget.control.label === 'string' && widget.control.label.length <= 120, 'Etiqueta de control no válida.');
            if (widget.type === 'slider') {
                widget.control = { min: 0, max: 100, step: 1, value: 50, ...widget.control };
                check(['min', 'max', 'step', 'value'].every(key => finite(widget.control[key])) && widget.control.min < widget.control.max && widget.control.step > 0, 'Rango de slider no válido.');
            }
        }
        return widget;
    });
    const result = { kind: 'cherry-layout', schemaVersion: LAYOUT_VERSION, profile, layoutMode, appearance, widgets };
    check(new TextEncoder().encode(JSON.stringify(result)).length <= MAX_LAYOUT_BYTES, 'El layout supera 2 MB.');
    return result;
}
