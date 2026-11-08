// Browser preferences only; these values do not represent operating-system state.
export const CONTROL_DEFAULTS = Object.freeze({
    wifi: false, bluetooth: false, darkMode: true, colorMode: true,
    doNotDisturb: false, volume: 75, brightness: 50, microphone: 80
});
export const CONTROL_STORAGE_KEY = 'cherry-controls-v1';

export function readControlPreferences(storage) {
    const values = { ...CONTROL_DEFAULTS };
    try {
        const saved = JSON.parse(storage?.getItem(CONTROL_STORAGE_KEY) || 'null');
        if (!saved || saved.version !== 1 || !saved.values) return values;
        for (const [id, fallback] of Object.entries(values)) {
            const value = saved.values[id];
            if (typeof fallback === 'boolean' && typeof value === 'boolean') values[id] = value;
            if (typeof fallback === 'number' && typeof value === 'number' && Number.isFinite(value)) {
                values[id] = Math.min(100, Math.max(0, value));
            }
        }
    } catch { /* Storage may be unavailable or corrupt. Defaults remain usable. */ }
    return values;
}

export function persistControlPreferences(state, storage) {
    const values = readControlPreferences(storage);
    const save = event => {
        if (event.detail?.source?.startsWith('native:')) return;
        const id = event.detail?.id;
        if (id && Object.hasOwn(CONTROL_DEFAULTS, id)) values[id] = state.get(id);
        try { storage?.setItem(CONTROL_STORAGE_KEY, JSON.stringify({ version: 1, values })); }
        catch { /* A blocked or full store must not prevent interaction. */ }
    };
    state.addEventListener('change', save);
    return () => state.removeEventListener('change', save);
}
