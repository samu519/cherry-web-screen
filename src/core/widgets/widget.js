export class Widget {
    constructor(config = {}) {
        // Identidad
        this.id = config.id ?? crypto.randomUUID();
        this.type = config.type ?? "widget";

        // Geometría
        this.geometry = {
            x: config.geometry?.x ?? 0,
            y: config.geometry?.y ?? 0,
            width: config.geometry?.width ?? 200,
            height: config.geometry?.height ?? 200,

            minWidth: config.geometry?.minWidth ?? 50,
            minHeight: config.geometry?.minHeight ?? 50,

            maxWidth: config.geometry?.maxWidth ?? Infinity,
            maxHeight: config.geometry?.maxHeight ?? Infinity
        };

        // Estado visual
        this.visible = config.visible ?? true;
        this.enabled = config.enabled ?? true;
        this.zIndex = config.zIndex ?? 1;

        // Configuración específica del widget
        this.settings = config.settings ?? {};

        // Estado interno del widget
        this.state = {};

        // Elemento HTML asociado al widget
        this.element = null;

        // Estado de montaje
        this.mounted = false;
    }

    createElement() {
        const element = document.createElement("div");

        element.classList.add("cherry-widget");
        element.dataset.widgetId = this.id;
        element.dataset.widgetType = this.type;

        return element;
    }

    /** funciones basicas del widget */

    mount(container) {
        if (!container) {
            throw new Error("Widget: no se proporcionó un contenedor.");
        }

        if (this.mounted) {
            return;
        }

        this.element = this.createElement();

        this.updateGeometry();

        this.updateVisibility();

        container.appendChild(this.element);

        this.mounted = true;

        this.render();
    }

    unmount() {
        if (!this.element) {
            return;
        }

        this.element.remove();

        this.element = null;
        this.mounted = false;
    }


    render() {
        // Implementado por cada widget hijo.
    }

    update() {
        if (!this.mounted || !this.element) {
            return;
        }

        this.updateGeometry();
        this.updateVisibility();
    }

    updateGeometry() {
        if (!this.element) {
            return;
        }

        const {
            x,
            y,
            width,
            height
        } = this.geometry;

        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;

        this.element.style.zIndex = this.zIndex;
    }

    
    updateVisibility() {
        if (!this.element) {
            return;
        }

        this.element.style.display =
            this.visible && this.enabled
                ? ""
                : "none";
    }

    
    setPosition(x, y) {
        this.geometry.x = x;
        this.geometry.y = y;

        this.updateGeometry();
    }

    
    setSize(width, height) {
        const {
            minWidth,
            minHeight,
            maxWidth,
            maxHeight
        } = this.geometry;

        this.geometry.width = Math.min(
            Math.max(width, minWidth),
            maxWidth
        );

        this.geometry.height = Math.min(
            Math.max(height, minHeight),
            maxHeight
        );

        this.updateGeometry();
    }

    setSetting(key, value) {
        this.settings[key] = value;
        this.update();
    }

    setState(key, value) {
        this.state[key] = value;
        this.update();
    }

   
    setVisible(visible) {
        this.visible = Boolean(visible);

        this.updateVisibility();
    }

    
    setEnabled(enabled) {
        this.enabled = Boolean(enabled);

        this.updateVisibility();
    }

    
    destroy() {
        this.unmount();

        this.settings = {};
        this.state = {};
    }
}