import { Grid } from './grid.js';

export const DISPLAY_PROFILES = [
    { id: 'cherry-portrait', name: 'Cherry · 480 × 1920', width: 480, height: 1920, columns: 4, rows: 16, gap: 12, padding: 16 },
    { id: 'compact-portrait', name: 'Vertical · 480 × 1280', width: 480, height: 1280, columns: 4, rows: 12, gap: 12, padding: 16 },
    { id: 'wide', name: 'Horizontal · 1920 × 480', width: 1920, height: 480, columns: 16, rows: 4, gap: 12, padding: 16 },
    { id: 'desktop', name: 'Escritorio · 1280 × 720', width: 1280, height: 720, columns: 12, rows: 8, gap: 12, padding: 16 }
];

export const DEFAULT_PROFILE = DISPLAY_PROFILES[0];

export function changeDocumentProfile(document, profile) {
    const next = structuredClone(document);
    const before = next.profile;
    next.profile = { ...profile };
    const grid = new Grid(profile);
    const transpose = (before.width > before.height) !== (profile.width > profile.height);
    next.widgets.forEach(widget => {
        const rect = widget.geometry || new Grid(before).getGeometry(widget.layout);
        const geometry = transpose ? {
            x: rect.y / before.height * profile.width, y: rect.x / before.width * profile.height,
            width: rect.height / before.height * profile.width, height: rect.width / before.width * profile.height
        } : {
            x: rect.x / before.width * profile.width, y: rect.y / before.height * profile.height,
            width: rect.width / before.width * profile.width, height: rect.height / before.height * profile.height
        };
        widget.layout = grid.getLayoutFromGeometry(geometry);
        widget.geometry = next.layoutMode === 'grid' ? grid.getGeometry(widget.layout) : grid.constrainGeometry(geometry);
    });
    return next;
}
