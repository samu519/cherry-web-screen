import { ClockWidget } from '../../widgets/clock/clockwidget.js';
import { MediaWidget } from '../../widgets/media/mediawidget.js';
import { SystemWidget } from '../../widgets/system/systemwidget.js';
import { ControlsWidget } from '../../widgets/controls/controlswidget.js';
import { TextWidget } from '../../widgets/text/textwidget.js';
import { ToggleWidget } from '../../widgets/controls/togglewidget.js';
import { SliderWidget } from '../../widgets/controls/sliderwidget.js';
import { MediaVisualWidget } from '../../widgets/visual/mediavisualwidget.js';
import { WIDGET_CATALOG, canonicalWidgetType } from './widgetCatalog.js';

const constructors = { clock: ClockWidget, media: MediaWidget, system: SystemWidget,
    controls: ControlsWidget, text: TextWidget, toggle: ToggleWidget, slider: SliderWidget, mediaVisual: MediaVisualWidget };

export const widgetRegistry = {
    create(descriptor) {
        const type = canonicalWidgetType(descriptor.type);
        const defaults = Object.hasOwn(WIDGET_CATALOG, type) ? WIDGET_CATALOG[type] : null;
        if (!defaults) throw new Error(`Tipo de widget desconocido: ${descriptor.type}`);
        const config = { size: defaults.size, style: defaults.style, variant: 'translucid', ...descriptor, type };
        const widget = new constructors[type](config);
        widget.style = config.style;
        widget.setStyle?.(config.style);
        // Restore layout last: constructors may apply size presets before user geometry.
        widget.layout = { ...widget.layout, ...config.layout };
        widget.flags = { hidden: false, locked: false, zIndex: 1, ...config.flags };
        if (config.geometry) widget.setGeometry(config.geometry);
        return widget;
    },

    serialize(widget) {
        const descriptor = {
            id: widget.id, type: canonicalWidgetType(widget.type), size: widget.size,
            variant: widget.variant, style: widget.style,
            layout: { ...widget.layout }, geometry: { ...widget.geometry },
            settings: { ...widget.settings }, state: { ...widget.state },
            flags: { hidden: false, locked: false, zIndex: 1, ...widget.flags }
        };
        if (widget.control) descriptor.control = { ...widget.control };
        return JSON.parse(JSON.stringify(descriptor));
    },

    applyFlags(widget) {
        if (!widget.element) return;
        const { hidden = false, locked = false, zIndex = 1 } = widget.flags || {};
        widget.element.hidden = hidden;
        widget.element.classList.toggle('cherry-widget--hidden', hidden);
        widget.element.classList.toggle('cherry-widget--locked', locked);
        widget.element.dataset.locked = String(locked);
        widget.element.style.zIndex = String(zIndex);
    }
};
