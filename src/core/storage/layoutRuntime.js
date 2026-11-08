import { parseLayoutDocument } from './layoutDocument.js';
import { widgetRegistry } from '../widgets/widgetRegistry.js';

export function captureLayout(canvas) {
    return parseLayoutDocument({ kind: 'cherry-layout', schemaVersion: 2,
        profile: { ...canvas.profile }, layoutMode: canvas.layoutMode,
        appearance: {
            accentColor: getComputedStyle(document.documentElement).getPropertyValue('--cherry-accent').trim(),
            themeMode: document.documentElement.getAttribute('data-theme') || 'dark',
            backgroundMode: canvas.element.dataset.backgroundMode || 'static'
        }, widgets: canvas.widgets.map(widget => widgetRegistry.serialize(widget)) });
}

export function restoreLayout(canvas, input) {
    const document = parseLayoutDocument(input);
    const prepared = [];
    try {
        for (const descriptor of document.widgets) {
            const widget = widgetRegistry.create(descriptor);
            prepared.push(widget);
            widget.render();
        }
    } catch (error) {
        prepared.forEach(widget => widget.destroy());
        throw error;
    }
    // Only replace the running dashboard once every new instance is ready.
    [...canvas.widgets].forEach(widget => canvas.removeWidget(widget));
    canvas.configure(document.profile, document.layoutMode);
    prepared.forEach((widget, index) => {
        canvas.addWidget(widget, { geometry: document.widgets[index].geometry, render: false });
        widgetRegistry.applyFlags(widget);
    });
    globalThis.document.documentElement.style.setProperty('--cherry-accent', document.appearance.accentColor);
    globalThis.document.documentElement.setAttribute('data-theme', document.appearance.themeMode);
    canvas.element.dataset.backgroundMode = document.appearance.backgroundMode;
    return document;
}
