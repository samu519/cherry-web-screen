/* =========================================================
   CHERRY EDITOR — SELECTION MANAGER
   Gestiona la visualización y estados de selección
   ===================================================== */

export class SelectionManager {

    constructor(editorState, canvasElement) {

        this.state = editorState;
        this.canvas = canvasElement;
        this.selectionOverlay = null;
        this.resizeHandles = [];

        this.subscribe();
    }


    /* =====================================================
       SUSCRIBIR A CAMBIOS DE ESTADO
       ===================================================== */

    subscribe() {

        this.state.subscribe(() => {
            this.updateSelection();
        });
    }


    /* =====================================================
       ACTUALIZAR VISUALIZACIÓN DE SELECCIÓN
       ===================================================== */

    updateSelection() {

        // Limpiar selecciones anteriores
        this.clearSelection();

        // Si hay widgets seleccionados, mostrar selección
        if (this.state.selectedWidgets.length > 0) {

            this.state.selectedWidgets.forEach(widgetId => {
                this.highlightWidget(widgetId);
            });

            // Si hay múltiples widgets, mostrar bounding box
            if (this.state.isMultiSelected()) {
                this.showMultiSelectionBox();
            }
        }
    }


    /* =====================================================
       DESTACAR WIDGET
       ===================================================== */

    highlightWidget(widgetId) {

        const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`);

        if (!widgetElement) return;

        // Marcar como seleccionado
        widgetElement.classList.add('cherry-widget--selected');

        // Crear outline
        const outline = document.createElement('div');
        outline.className = 'cherry-selection-outline';
        outline.dataset.selectionFor = widgetId;

        const rect = widgetElement.getBoundingClientRect();
        outline.style.position = 'fixed';
        outline.style.left = rect.left + 'px';
        outline.style.top = rect.top + 'px';
        outline.style.width = rect.width + 'px';
        outline.style.height = rect.height + 'px';
        outline.style.zIndex = '1000';

        document.body.appendChild(outline);
        this.resizeHandles.push(outline);

        // Crear handles de redimensionamiento
        this.createResizeHandles(widgetId, rect, outline);

        // Crear botón de menú contextual
        this.createContextMenuButton(widgetId, rect, outline);
    }


    /* =====================================================
       CREAR HANDLES DE REDIMENSIONAMIENTO
       ===================================================== */

    createResizeHandles(widgetId, rect, outlineElement) {

        const positions = [
            { name: 'nw', x: 0, y: 0 },
            { name: 'n', x: 50, y: 0 },
            { name: 'ne', x: 100, y: 0 },
            { name: 'w', x: 0, y: 50 },
            { name: 'e', x: 100, y: 50 },
            { name: 'sw', x: 0, y: 100 },
            { name: 's', x: 50, y: 100 },
            { name: 'se', x: 100, y: 100 }
        ];

        positions.forEach(pos => {

            const handle = document.createElement('div');
            handle.className = `cherry-resize-handle cherry-resize-handle--${pos.name}`;
            handle.dataset.widgetId = widgetId;
            handle.dataset.direction = pos.name;

            const offsetX = (rect.width * pos.x) / 100;
            const offsetY = (rect.height * pos.y) / 100;

            handle.style.position = 'fixed';
            handle.style.left = (rect.left + offsetX) + 'px';
            handle.style.top = (rect.top + offsetY) + 'px';
            handle.style.zIndex = '1001';

            document.body.appendChild(handle);
            this.resizeHandles.push(handle);
        });
    }


    /* =====================================================
       CREAR BOTÓN DE MENÚ CONTEXTUAL
       ===================================================== */

    createContextMenuButton(widgetId, rect, outlineElement) {

        const button = document.createElement('button');
        button.className = 'cherry-widget-menu-button';
        button.innerHTML = '⋯';
        button.dataset.widgetId = widgetId;
        button.title = 'Opciones del widget';

        button.style.position = 'fixed';
        button.style.right = (window.innerWidth - rect.right + 8) + 'px';
        button.style.top = (rect.top - 8) + 'px';
        button.style.zIndex = '1001';

        document.body.appendChild(button);
        this.resizeHandles.push(button);
    }


    /* =====================================================
       MOSTRAR BOUNDING BOX DE MÚLTIPLES WIDGETS
       ===================================================== */

    showMultiSelectionBox() {

        const widgets = this.state.selectedWidgets
            .map(id => document.querySelector(`[data-widget-id="${id}"]`))
            .filter(el => el);

        if (widgets.length < 2) return;

        // Calcular bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        widgets.forEach(widget => {
            const rect = widget.getBoundingClientRect();
            minX = Math.min(minX, rect.left);
            minY = Math.min(minY, rect.top);
            maxX = Math.max(maxX, rect.right);
            maxY = Math.max(maxY, rect.bottom);
        });

        const box = document.createElement('div');
        box.className = 'cherry-multi-selection-box';

        box.style.position = 'fixed';
        box.style.left = minX + 'px';
        box.style.top = minY + 'px';
        box.style.width = (maxX - minX) + 'px';
        box.style.height = (maxY - minY) + 'px';
        box.style.zIndex = '999';
        box.style.pointerEvents = 'none';

        document.body.appendChild(box);
        this.resizeHandles.push(box);
    }


    /* =====================================================
       LIMPIAR SELECCIÓN
       ===================================================== */

    clearSelection() {

        // Remover highlighting
        document.querySelectorAll('.cherry-widget--selected').forEach(el => {
            el.classList.remove('cherry-widget--selected');
        });

        // Remover outlines, handles, botones
        this.resizeHandles.forEach(handle => {
            if (handle && handle.parentNode) {
                handle.remove();
            }
        });

        this.resizeHandles = [];
        document.querySelectorAll('.cherry-selection-outline').forEach(el => el.remove());
        document.querySelectorAll('.cherry-resize-handle').forEach(el => el.remove());
        document.querySelectorAll('.cherry-widget-menu-button').forEach(el => el.remove());
    }


    /* =====================================================
       ACTUALIZAR POSICIÓN DE HANDLES (cuando se mueve)
       ===================================================== */

    updateHandlePositions() {

        this.state.selectedWidgets.forEach(widgetId => {
            const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);
            if (!widget) return;

            const rect = widget.getBoundingClientRect();
            const outline = document.querySelector(`[data-selection-for="${widgetId}"]`);
            if (outline) {
                outline.style.left = rect.left + 'px';
                outline.style.top = rect.top + 'px';
                outline.style.width = rect.width + 'px';
                outline.style.height = rect.height + 'px';
            }

            const handles = document.querySelectorAll(`.cherry-resize-handle[data-widget-id="${widgetId}"]`);
            handles.forEach(handle => {
                const direction = handle.dataset.direction || '';
                const percentMap = {
                    nw: { x: 0, y: 0 },
                    n: { x: 50, y: 0 },
                    ne: { x: 100, y: 0 },
                    w: { x: 0, y: 50 },
                    e: { x: 100, y: 50 },
                    sw: { x: 0, y: 100 },
                    s: { x: 50, y: 100 },
                    se: { x: 100, y: 100 }
                };

                const pos = percentMap[direction] || { x: 50, y: 50 };
                const offsetX = (rect.width * pos.x) / 100;
                const offsetY = (rect.height * pos.y) / 100;

                handle.style.left = (rect.left + offsetX) + 'px';
                handle.style.top = (rect.top + offsetY) + 'px';
            });

            const menuButton = document.querySelector(`.cherry-widget-menu-button[data-widget-id="${widgetId}"]`);
            if (menuButton) {
                menuButton.style.left = (rect.right - 22) + 'px';
                menuButton.style.top = (rect.top - 8) + 'px';
            }
        });
    }
}
