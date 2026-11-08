import { parseLayoutDocument } from './layoutDocument.js';

export const LAYOUT_KEY = 'cherry-layout-state-v1';
export const BACKUP_KEY = 'cherry-layout-backup-v2';
export const RECOVERY_KEY = 'cherry-layout-rejected-v2';

export class LayoutRepository {
    constructor(storage) { this.storage = storage; }
    read(key) { try { return this.storage?.getItem(key) ?? null; } catch { return null; } }
    load(fallback) {
        for (const key of [LAYOUT_KEY, BACKUP_KEY]) {
            const raw = this.read(key);
            if (raw === null) continue;
            try { return { document: parseLayoutDocument(raw), source: key === LAYOUT_KEY ? 'saved' : 'backup' }; }
            catch {
                if (key === LAYOUT_KEY) {
                    try { this.storage?.setItem(RECOVERY_KEY, raw); } catch { /* Preserve primary if storage is unavailable. */ }
                }
            }
        }
        return { document: parseLayoutDocument(fallback), source: this.read(LAYOUT_KEY) === null ? 'default' : 'recovered-default' };
    }
    save(input) {
        const document = parseLayoutDocument(input);
        const json = JSON.stringify(document);
        const previous = this.read(LAYOUT_KEY);
        if (!this.storage) throw new Error('El almacenamiento local no está disponible. Exporta el layout para conservarlo.');
        if (previous !== null && previous !== json) {
            let valid = true;
            try { parseLayoutDocument(previous); } catch { valid = false; }
            this.storage.setItem(valid ? BACKUP_KEY : RECOVERY_KEY, previous);
        }
        this.storage.setItem(LAYOUT_KEY, json);
        return document;
    }
    backup() {
        const raw = this.read(BACKUP_KEY);
        if (raw === null) throw new Error('Todavía no hay una copia anterior.');
        return parseLayoutDocument(raw);
    }
}
