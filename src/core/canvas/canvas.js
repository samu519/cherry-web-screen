export class Canvas {
    constructor(container, config = {}) {
        if (!container) {
            throw new Error("Canvas: no se proporcionó un contenedor.");
        }

        this.container = container;

        this.width = config.width ?? 480;
        this.height = config.height ?? 1920;

        this.widgets = new Map();

        this.setup();
    }

    setup() {
        this.container.classList.add("cherry-canvas");

        this.container.style.position = "relative";
        this.container.style.width = `${this.width}px`;
        this.container.style.height = `${this.height}px`;
    }

    addWidget(widget) {
        if (!widget) {
            throw new Error("Canvas: se intentó añadir un widget inválido.");
        }

        if (this.widgets.has(widget.id)) {
            throw new Error(
                `Canvas: ya existe un widget con el ID "${widget.id}".`
            );
        }

        this.widgets.set(widget.id, widget);

        widget.mount(this.container);
    }

    removeWidget(widgetId) {
        const widget = this.widgets.get(widgetId);

        if (!widget) {
            return;
        }

        widget.destroy();

        this.widgets.delete(widgetId);
    }

    getWidget(widgetId) {
        return this.widgets.get(widgetId);
    }

    hasWidget(widgetId) {
        return this.widgets.has(widgetId);
    }

    clear() {
        for (const widget of this.widgets.values()) {
            widget.destroy();
        }

        this.widgets.clear();
    }

    resize(width, height) {
        this.width = width;
        this.height = height;

        this.container.style.width = `${width}px`;
        this.container.style.height = `${height}px`;
    }

    getWidgetCount() {
        return this.widgets.size;
    }

    destroy() {
        this.clear();

        this.container.classList.remove("cherry-canvas");

        this.container.innerHTML = "";
    }
}