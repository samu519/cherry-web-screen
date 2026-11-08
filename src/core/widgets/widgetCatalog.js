export const WIDGET_CATALOG = {
    clock: { size: 'medium', style: 'onlyclock', sizes: ['small', 'medium', 'large'], styles: ['onlyclock', 'clockdate'] },
    media: { size: 'large', style: 'artworkProtagonist', sizes: ['small', 'card', 'medium', 'large', 'giant'], styles: ['default', 'artworkProtagonist'] },
    system: { size: 'cardhorizontal', style: 'circular', sizes: ['small', 'medium', 'cardvertical', 'cardhorizontal', 'large'], styles: ['default', 'compact', 'circular'] },
    controls: { size: 'medium', style: 'buttons', sizes: ['mini', 'small', 'medium', 'card', 'large', 'giant'], styles: ['buttons', 'compact'] },
    text: { size: 'small', style: 'default', sizes: ['mini', 'small', 'medium', 'large', 'cardvertical', 'cardhorizontal', 'card', 'giant'], styles: ['default'] },
    toggle: { size: 'small', style: 'widget', sizes: ['mini', 'small', 'medium'], styles: ['button', 'widget'] },
    slider: { size: 'mini', style: 'bar', sizes: ['mini', 'medium', 'large'], styles: ['bar', 'default'] },
    mediaVisual: { size: 'medium', style: 'visualizer', sizes: ['mini', 'small', 'medium', 'large', 'giant'], styles: ['default', 'slideshow', 'gallery', 'visualizer'] }
};

export function canonicalWidgetType(type) {
    const name = String(type || '').toLowerCase().replace(/[-_\s]/g, '');
    return name === 'mediavisual' ? 'mediaVisual' : name;
}
