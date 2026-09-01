/* =========================================================
   CHERRY EDITOR — CANVAS ADAPTER
   Puente entre el Editor y el Canvas del core
   ========================================================= */

export class CanvasAdapter {

    constructor(canvas, editorState) {

        this.canvas = canvas;
        this.state = editorState;
    }


    /* =====================================================
       OBTENER REFERENCIA DE WIDGET
       ===================================================== */

    getWidget(widgetId) {

        return this.canvas.widgets.find(w => w.id === widgetId);
    }


    /* =====================================================
       MOVER WIDGET (en términos de layout)
       ===================================================== */

    moveWidget(widgetId, deltaX, deltaY) {

        const widget = this.getWidget(widgetId);

        if (!widget) return null;

        // Obtener geometría actual
        const currentGeometry = widget.geometry;

        // Calcular nueva posición
        const newX = currentGeometry.x + deltaX;
        const newY = currentGeometry.y + deltaY;

        // Actualizar geometría
        widget.setGeometry({
            x: newX,
            y: newY
        });

        return {
            x: newX,
            y: newY,
            width: currentGeometry.width,
            height: currentGeometry.height
        };
    }


    /* =====================================================
       REDIMENSIONAR WIDGET
       ===================================================== */

    resizeWidget(widgetId, width, height) {

        const widget = this.getWidget(widgetId);

        if (!widget) return null;

        // Actualizar geometría
        widget.setGeometry({
            width: Math.max(50, width),
            height: Math.max(50, height)
        });

        return {
            width: widget.geometry.width,
            height: widget.geometry.height
        };
    }


    /* =====================================================
       CAMBIAR TAMAÑO DE WIDGET (preset)
       ===================================================== */

    setWidgetSize(widgetId, size) {

        const widget = this.getWidget(widgetId);

        if (!widget) return null;

        widget.size = size;

        if (typeof widget.setSizePreset === 'function' && widget.sizePresets?.[size]) {
            widget.setSizePreset(size);
        } else if (typeof widget.setSize === 'function') {
            widget.setSize(size);
        }

        if (widget.element) {
            widget.element.dataset.size = widget.size;
            widget.element.dataset.widgetSize = widget.size;
        }

        if (this.canvas && typeof this.canvas.updateWidgetLayout === 'function') {
            this.canvas.updateWidgetLayout(widget);
        }

        if (widget && typeof widget.render === 'function') {
            widget.render();
        }

        if (window.cherryApp && typeof window.cherryApp.saveLayout === 'function') {
            window.cherryApp.saveLayout();
        }

        return widget;
    }


    /* =====================================================
       CAMBIAR VARIANTE DEL WIDGET
       ===================================================== */

    setWidgetVariant(widgetId, variant) {

        const widget = this.getWidget(widgetId);

        if (!widget) return null;

        widget.variant = variant;

        if (typeof widget.setVariant === 'function') {
            widget.setVariant(variant);
        }

        if (widget.element) {
            widget.element.dataset.widgetVariant = widget.variant;
        }

        if (window.cherryApp && typeof window.cherryApp.saveLayout === 'function') {
            window.cherryApp.saveLayout();
        }

        return widget;
    }


    /* =====================================================
       CAMBIAR ESTILO DEL WIDGET
       ===================================================== */

    setWidgetStyle(widgetId, style) {

        const widget = this.getWidget(widgetId);

        if (!widget) return null;

        // Sincronizamos la propiedad base ANTES de llamar al override del widget,
        // igual que ya se hace con setWidgetSize()
        widget.style = style;

        if (typeof widget.setStyle === 'function') {
            widget.setStyle(style);
        }

        if (widget.element) {
            widget.element.dataset.widgetStyle = widget.style;
        }

        if (typeof widget.render === 'function') {
            widget.render();
        }

        if (window.cherryApp && typeof window.cherryApp.saveLayout === 'function') {
            window.cherryApp.saveLayout();
        }

        return widget;
    }

    /* =====================================================
       DUPLICAR WIDGET
       ===================================================== */

    duplicateWidget(widgetId) {

        const widget = this.getWidget(widgetId);

        if (!widget) return null;

        // Crear clone del widget
        const config = {
            id: `widget-${crypto.randomUUID()}`,
            type: widget.type,
            size: widget.size,
            variant: widget.variant,
            style: widget.style,
            layout: {
                column: widget.layout.column + 1,
                row: widget.layout.row,
                columns: widget.layout.columns,
                rows: widget.layout.rows
            },
            settings: { ...widget.settings },
            state: { ...widget.state }
        };

        // Aquí necesitaríamos la clase del widget para poder instanciarlo
        // Por ahora, solo retornamos la configuración
        return config;
    }


    /* =====================================================
       CAMBIAR Z-INDEX (ORDEN)
       ===================================================== */

    bringToFront(widgetId) {

        const widget = this.getWidget(widgetId);

        if (!widget) return null;

        const maxZ = Math.max(
            ...this.canvas.widgets.map(w => w.element?.style.zIndex || 0)
        );

        widget.element.style.zIndex = maxZ + 1;

        return widget;
    }


    sendToBack(widgetId) {

        const widget = this.getWidget(widgetId);

        if (!widget) return null;

        const minZ = Math.min(
            ...this.canvas.widgets.map(w => w.element?.style.zIndex || 0)
        );

        widget.element.style.zIndex = minZ - 1;

        return widget;
    }


    /* =====================================================
       ALINEACIÓN
       ===================================================== */

    alignWidgets(widgetIds, alignment) {

        const widgets = widgetIds
            .map(id => this.getWidget(id))
            .filter(w => w !== null);

        if (widgets.length < 2) return;

        // Calcular bounds
        const positions = widgets.map(w => ({
            widget: w,
            ...w.geometry
        }));

        const minX = Math.min(...positions.map(p => p.x));
        const maxX = Math.max(...positions.map(p => p.x + p.width));
        const minY = Math.min(...positions.map(p => p.y));
        const maxY = Math.max(...positions.map(p => p.y + p.height));

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Aplicar alineación
        positions.forEach(pos => {

            let newX = pos.x;
            let newY = pos.y;

            if (alignment === 'left') {
                newX = minX;
            } else if (alignment === 'center') {
                newX = centerX - pos.width / 2;
            } else if (alignment === 'right') {
                newX = maxX - pos.width;
            } else if (alignment === 'top') {
                newY = minY;
            } else if (alignment === 'middle') {
                newY = centerY - pos.height / 2;
            } else if (alignment === 'bottom') {
                newY = maxY - pos.height;
            }

            pos.widget.setGeometry({
                x: newX,
                y: newY
            });
        });

        return widgets;
    }


    /* =====================================================
       DISTRIBUIR WIDGETS
       ===================================================== */

    distributeWidgets(widgetIds, distribution) {

        const widgets = widgetIds
            .map(id => this.getWidget(id))
            .filter(w => w !== null)
            .sort((a, b) => a.geometry.x - b.geometry.x);

        if (widgets.length < 3) return;

        const positions = widgets.map(w => ({ widget: w, ...w.geometry }));

        const minX = Math.min(...positions.map(p => p.x));
        const maxX = Math.max(...positions.map(p => p.x + p.width));

        const totalSpace = maxX - minX;
        const totalWidgetWidth = positions.reduce((sum, p) => sum + p.width, 0);
        const gapSize = (totalSpace - totalWidgetWidth) / (widgets.length - 1);

        let currentX = minX;

        positions.forEach((pos, idx) => {

            if (idx > 0) {
                currentX += gapSize + positions[idx - 1].width;
            }

            pos.widget.setGeometry({
                x: currentX,
                y: pos.y
            });
        });

        return widgets;
    }


    /* =====================================================
       OBTENER INFO DEL WIDGET
       ===================================================== */

    getWidgetInfo(widgetId) {

        const widget = this.getWidget(widgetId);

        if (!widget) return null;

        return {
            id: widget.id,
            type: widget.type,
            size: widget.size,
            variant: widget.variant,
            style: widget.style,
            layout: { ...widget.layout },
            geometry: { ...widget.geometry },
            element: widget.element
        };
    }


    /* =====================================================
       OBTENER TODOS LOS WIDGETS
       ===================================================== */

    getAllWidgets() {

        return this.canvas.widgets.map(w => this.getWidgetInfo(w.id));
    }


    /* =====================================================
       VALIDAR WIDGET EXISTE
       ===================================================== */

    widgetExists(widgetId) {

        return this.canvas.widgets.some(w => w.id === widgetId);
    }
}
