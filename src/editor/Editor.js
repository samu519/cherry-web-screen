/* =========================================================
   CHERRY EDITOR — MAIN MANAGER
   Orquesta la experiencia completa del editor
   ========================================================= */

import { EditorState } from './EditorState.js';
import { OverlayManager } from './managers/OverlayManager.js';
import { SelectionManager } from './managers/SelectionManager.js';
import { SnapManager } from './managers/SnapManager.js';
import { CanvasAdapter } from './CanvasAdapter.js';
import { EditorHistory } from './managers/EditorHistory.js';
import { LongPressManager } from '../core/interaction/LongPressManager.js';
import { widgetRegistry } from '../core/widgets/widgetRegistry.js';
import { restoreLayout } from '../core/storage/layoutRuntime.js';
import { WIDGET_CATALOG, canonicalWidgetType } from '../core/widgets/widgetCatalog.js';


export class Editor {

    constructor(canvas, options = {}) {

        this.canvas = canvas;
        this.canvasElement = this.canvas.element;
        
        this.originalParent = this.canvasElement.parentNode;
        this.originalNextSibling = this.canvasElement.nextSibling;

        this._boundHandlers = [];
        this._boundElementHandlers = [];

        /* -------------------------------------------------
           ESTADO
           ------------------------------------------------- */

        this.state = new EditorState();


        /* -------------------------------------------------
           MANAGERS
           ------------------------------------------------- */

        this.overlayManager = null;
        this.selectionManager = new SelectionManager(this.state, this.canvasElement);
        this.snapManager = new SnapManager(this.state, 12);
        this.canvasAdapter = new CanvasAdapter(this.canvas, this.state);
        this.history = new EditorHistory(80);
        this.longPressManager = null;


        /* -------------------------------------------------
           ELEMENTOS DE UI
           ------------------------------------------------- */

        this.editorContainer = null;
        this.inspector = null;
        this.widgetLibrary = null;
        this.canvasViewport = null;
        this.canvasGrid = null;
        this.canvasGuides = null;
        this.toolbar = null;

        this.backgroundMode = 'static';


        /* -------------------------------------------------
           EVENTO DE INTERACCIÓN
           ------------------------------------------------- */

        this.isDragging = false;
        this.isResizing = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.draggedWidgetId = null;


        this.initialize();
    }


    /* =====================================================
       INICIALIZAR EDITOR
       ===================================================== */

    initialize() {

        this.history = this.history || new EditorHistory(80);

        this.createEditorLayout();

        this.overlayManager = new OverlayManager(this.canvasViewport || document.body);
        this.selectionManager = new SelectionManager(this.state, this.canvasElement);
        this.snapManager = new SnapManager(this.state, 12);
        this.canvasAdapter = new CanvasAdapter(this.canvas, this.state);

        this.longPressManager = new LongPressManager({
            root: this.editorContainer,
            overlayManager: this.overlayManager,
            threshold: 500,
            onOpen: ({ target, title, actions }) => {
                this.state.notify();
                if (target && target.classList) {
                    target.classList.add('cherry-widget--long-press-active');
                }
            },
            onClose: () => {
                document.querySelectorAll('.cherry-widget--long-press-active').forEach(el => {
                    el.classList.remove('cherry-widget--long-press-active');
                });
            }
        });

        this.registerLongPressTargets();
        this.bindStateToCanvas();
        this.setupCanvasInteractions();
        this.setupSelectionInteractions();
        this.setupToolbarInteractions();
        this.recordHistory('Estado inicial del editor');

        console.log('✓ Cherry Editor initialized');
    }


    _onDocument(event, handler) {
        document.addEventListener(event, handler);   // ✅ llama al DOM real, no a sí mismo
        this._boundHandlers.push({ event, handler });
    }

    _onElement(element, event, handler) {
        if (!element) return;

        element.addEventListener(event, handler);

        this._boundElementHandlers.push({
            element,
            event,
            handler
        });
    }


    /* =====================================================
       CREAR LAYOUT DEL EDITOR
       ===================================================== */

    createEditorLayout() {

        // Contenedor principal
        this.editorContainer = document.createElement('div');
        this.editorContainer.className = 'cherry-editor';
        this.editorContainer.id = 'cherry-editor';

        // Panel Inspector (izquierda)
        this.inspector = this.createInspectorPanel();

        // Area de Canvas (centro)
        this.canvasViewport = this.createCanvasViewport();

        // Panel Widget Library (derecha)
        this.widgetLibrary = this.createWidgetLibrary();

        // Toolbar (arriba)
        this.toolbar = this.createToolbar();

        // Ensamblar layout
        const leftPanel = document.createElement('div');
        leftPanel.className = 'cherry-editor__left';
        leftPanel.appendChild(this.inspector);

        const centerPanel = document.createElement('div');
        centerPanel.className = 'cherry-editor__center';
        centerPanel.appendChild(this.toolbar);
        centerPanel.appendChild(this.canvasViewport);

        const rightPanel = document.createElement('div');
        rightPanel.className = 'cherry-editor__right';
        rightPanel.appendChild(this.widgetLibrary);

        this.editorContainer.appendChild(leftPanel);
        this.editorContainer.appendChild(centerPanel);
        this.editorContainer.appendChild(rightPanel);

        // Reemplazar el elemento original del canvas
        const parentElement = this.canvasElement.parentNode;
        parentElement.replaceChild(this.editorContainer, this.canvasElement);

        // Mover canvas al viewport
        this.canvasViewport.appendChild(this.canvasElement);
    }


    /* =====================================================
       CREAR PANEL INSPECTOR
       ===================================================== */

    createInspectorPanel() {

        const panel = document.createElement('div');
        panel.className = 'cherry-inspector';

        // Título
        const title = document.createElement('h2');
        title.className = 'cherry-inspector__title';
        title.textContent = 'Inspector';

        // Sección de apariencia global
        const appearanceSection = document.createElement('div');
        appearanceSection.className = 'cherry-inspector__section';

        const appearanceTitle = document.createElement('h3');
        appearanceTitle.className = 'cherry-inspector__section-title';
        appearanceTitle.textContent = 'Apariencia';

        const accentControl = this.createColorControl(
            'Accent',
            this.state.accentColor,
            (color) => {
                this.state.setAccentColor(color);
                if (window.cherryApp && typeof window.cherryApp.saveLayout === 'function') {
                    window.cherryApp.saveLayout();
                }
            }
        );

        const themeControl = this.createButtonGroup(
            'Tema',
            ['Light', 'Dark'],
            this.state.themeMode === 'dark' ? 1 : 0,
            (idx) => {
                this.state.setThemeMode(idx === 0 ? 'light' : 'dark');
                if (window.cherryApp && typeof window.cherryApp.saveLayout === 'function') {
                    window.cherryApp.saveLayout();
                }
            }
        );

        const backgroundControl = this.createPropertyControl(
            'Fondo',
            ['static', 'dynamic'],
            this.state.backgroundMode,
            (mode) => {
                this.state.setBackgroundMode(mode);

                if (
                    window.cherryApp &&
                    typeof window.cherryApp.saveLayout === 'function'
                ) {
                    window.cherryApp.saveLayout();
                }
            }
        );

        appearanceSection.appendChild(appearanceTitle);
        appearanceSection.appendChild(accentControl);
        appearanceSection.appendChild(backgroundControl);
        appearanceSection.appendChild(themeControl);

        // Sección de propiedades del widget
        const propertiesSection = document.createElement('div');
        propertiesSection.className = 'cherry-inspector__section cherry-inspector__properties';
        propertiesSection.dataset.section = 'properties';

        const propertiesTitle = document.createElement('h3');
        propertiesTitle.className = 'cherry-inspector__section-title';
        propertiesTitle.textContent = 'Widget';

        const emptyState = document.createElement('p');
        emptyState.className = 'cherry-inspector__empty-state';
        emptyState.textContent = 'Selecciona un widget para ver sus propiedades';

        propertiesSection.appendChild(propertiesTitle);
        propertiesSection.appendChild(emptyState);

        panel.appendChild(title);
        panel.appendChild(appearanceSection);
        panel.appendChild(propertiesSection);

        // Actualizar panel cuando cambia la selección
        this.state.subscribe((state) => {
            this.updateInspectorProperties();
        });

        return panel;
    }


    /* =====================================================
       ACTUALIZAR PROPIEDADES EN INSPECTOR
       ===================================================== */

    updateInspectorProperties() {

        const propertiesSection = this.inspector.querySelector('[data-section="properties"]');
        const titleElement = propertiesSection.querySelector('.cherry-inspector__section-title');

        // Limpiar propiedades previas
        propertiesSection.querySelectorAll(':not(.cherry-inspector__section-title)').forEach(el => {
            if (!el.classList.contains('cherry-inspector__section-title')) {
                el.remove();
            }
        });

        if (this.state.isSingleSelected()) {

            const widgetId = this.state.focusedWidget;
            const widget = this.canvasAdapter.getWidget(widgetId);
            const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`);
            const widgetType = widgetElement?.dataset.widgetType || widget?.type || 'unknown';
            const widgetSize = widget?.size || widgetElement?.dataset.widgetSize || 'unknown';
            const widgetVariant = widget?.variant || widgetElement?.dataset.widgetVariant || 'unknown';
            const widgetStyle = widget?.style || widgetElement?.dataset.widgetStyle || 'default';

            // Mostrar información del widget
            const widgetInfo = document.createElement('div');
            widgetInfo.className = 'cherry-inspector__widget-info';
            widgetInfo.innerHTML = `
                <p><strong>ID:</strong> ${widgetId.substring(0, 12)}...</p>
                <p><strong>Tipo:</strong> ${widgetType}</p>
                <p><strong>Tamaño:</strong> ${widgetSize}</p>
                <p><strong>Variante:</strong> ${widgetVariant}</p>
                <p><strong>Estilo:</strong> ${widgetStyle}</p>
            `;

            propertiesSection.appendChild(widgetInfo);

            const sizeOptions = widget?.sizePresets ? Object.keys(widget.sizePresets) : ['mini', 'small', 'medium', 'large'];
            const styleOptions = widget?.styles ? Object.keys(widget.styles) : ['default', 'widget', 'bar', 'buttons', 'visualizer'];
            const variantOptions = ['translucid', 'solid', 'glass'];

            const textControl = widgetType === 'text'
                ? this.createTextPropertyControl(
                    'Texto',
                    widget?.state?.text ?? '',
                    (value) => {
                        if (typeof widget?.setText === 'function') {
                            widget.setText(value);
                        }
                    },
                    () => {
                        this.recordHistory('Cambio de texto');
                        if (
                            window.cherryApp &&
                            typeof window.cherryApp.saveLayout === 'function'
                        ) {
                            window.cherryApp.saveLayout();
                        }
                    }
                )
                : null;

            const sizeControl = this.createPropertyControl('Tamaño', sizeOptions, widgetSize, (value) => {
                const updated = this.canvasAdapter.setWidgetSize(widgetId, value);
                if (updated && updated.element) {
                    updated.element.dataset.widgetSize = updated.size;
                }
                this.selectionManager.updateHandlePositions();
                this.recordHistory('Cambio de tamaño desde inspector');
            });

            const variantControl = this.createPropertyControl('Variante', variantOptions, widgetVariant, (value) => {
                const updated = this.canvasAdapter.setWidgetVariant(widgetId, value);
                if (updated && updated.element) {
                    updated.element.dataset.widgetVariant = updated.variant;
                }
                this.recordHistory('Cambio de variante desde inspector');
            });

            const styleControl = this.createPropertyControl('Estilo', styleOptions, widgetStyle, (value) => {
                const updated = this.canvasAdapter.setWidgetStyle(widgetId, value);
                if (updated && updated.element) {
                    updated.element.dataset.widgetStyle = updated.style;
                }
                this.recordHistory('Cambio de estilo desde inspector');
            });
            if (textControl) {
                propertiesSection.appendChild(textControl);
            }

            propertiesSection.appendChild(sizeControl);
            propertiesSection.appendChild(variantControl);
            propertiesSection.appendChild(styleControl);

        } else if (this.state.isMultiSelected()) {

            const multiInfo = document.createElement('p');
            multiInfo.className = 'cherry-inspector__multi-select';
            multiInfo.textContent = `${this.state.selectedWidgets.length} widgets seleccionados`;

            propertiesSection.appendChild(multiInfo);

        } else {

            const emptyState = document.createElement('p');
            emptyState.className = 'cherry-inspector__empty-state';
            emptyState.textContent = 'Selecciona un widget para ver sus propiedades';

            propertiesSection.appendChild(emptyState);
        }
    }

    createTextPropertyControl(label, value, onInput, onCommit) {
        const control = document.createElement('div');
        control.className = 'cherry-property-control';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;

        const textarea = document.createElement('textarea');
        textarea.className = 'cherry-property-control__textarea';
        textarea.value = value;

        textarea.rows = 4;

        textarea.addEventListener('input', (e) => {
            if (onInput) {
                onInput(e.target.value);
            }
        });

        textarea.addEventListener('change', () => {
            if (onCommit) {
                onCommit();
            }
        });

        control.appendChild(labelEl);
        control.appendChild(textarea);

        return control;
    }


    /* =====================================================
       CREAR CANVAS VIEWPORT
       ===================================================== */

    createCanvasViewport() {

        const viewport = document.createElement('div');
        viewport.className = 'cherry-canvas-viewport';

        // Grid visual
        const grid = document.createElement('div');
        grid.className = 'cherry-canvas-grid';

        const guides = document.createElement('div');
        guides.className = 'cherry-canvas-guides';

        this.canvasGrid = grid;
        this.canvasGuides = guides;

        viewport.appendChild(grid);
        viewport.appendChild(guides);

        return viewport;
    }


    /* =====================================================
       VINCULAR ESTADO AL CANVAS
       ===================================================== */

    bindStateToCanvas() {

        this.state.subscribe(() => {
            if (!this.canvasElement) return;

            this.canvasElement.style.transform = `translate(${this.state.panX}px, ${this.state.panY}px) scale(${this.state.zoom})`;
            this.canvasElement.style.transformOrigin = 'center center';
            this.canvasElement.style.transition = 'transform 0.15s ease';

            if (this.canvasGrid) {
                this.canvasElement.dataset.gridVisible = String(this.state.gridVisible);
                this.canvasGrid.style.display = this.state.gridVisible ? 'block' : 'none';
            }

            if (this.canvasGuides) {
                this.canvasGuides.style.display = this.state.guidesVisible ? 'block' : 'none';
            }
        });

        this.state.notify();
    }


    /* =====================================================
       MOSTRAR GUÍAS DE ALINEACIÓN
       ===================================================== */

    renderGuides(guides = []) {

        if (!this.canvasGuides) return;

        this.canvasGuides.innerHTML = '';

        if (!this.state.guidesVisible || guides.length === 0) {
            return;
        }

        guides.forEach(guide => {
            const line = document.createElement('div');
            line.className = `cherry-guide-line cherry-guide-line--${guide.type}`;

            if (guide.type === 'vertical') {
                line.style.left = `${guide.position}px`;
                line.style.top = '0px';
                line.style.height = '100%';
            } else {
                line.style.top = `${guide.position}px`;
                line.style.left = '0px';
                line.style.width = '100%';
            }

            this.canvasGuides.appendChild(line);
        });
    }

    clearGuides() {
        if (this.canvasGuides) {
            this.canvasGuides.innerHTML = '';
        }
    }


    /* =====================================================
       SERIALIZAR Y RESTAURAR ESTADO DEL CANVAS
       ===================================================== */

    captureCanvasState() {
        return this.canvas.widgets.map(widget => widgetRegistry.serialize(widget));
    }

    recordHistory(description = 'Cambio del editor') {
        const snapshot = this.captureCanvasState();
        this.history.addState(snapshot, description);
        return snapshot;
    }

    restoreCanvasState(snapshot = []) {
        if (!Array.isArray(snapshot)) return;
        const document = window.cherryApp.getDocument();
        document.widgets = snapshot;
        for (const widget of this.canvas.widgets) this.longPressManager.unregister(widget.element);
        restoreLayout(this.canvas, document);
        this.selectionManager.clearSelection();
        this.selectionManager.updateHandlePositions();
        window.cherryApp.saveLayout();
    }

    createWidgetFromType(type, config = {}) {
        return widgetRegistry.create({ ...config, type });
    }

    findAvailableLayoutSlot(columns = 1, rows = 1) {
        columns = Math.min(columns, this.canvas.grid.columns);
        rows = Math.min(rows, this.canvas.grid.rows);
        const occupied = this.canvas.widgets.filter(widget => !widget.flags?.hidden)
            .map(widget => this.canvas.grid.getLayoutFromGeometry(widget.geometry));
        for (let row = 0; row <= this.canvas.grid.rows - rows; row++) {
            for (let column = 0; column <= this.canvas.grid.columns - columns; column++) {
                if (!occupied.some(item => column < item.column + item.columns && column + columns > item.column &&
                    row < item.row + item.rows && row + rows > item.row)) return { column, row, columns, rows };
            }
        }
        return null;
    }

    addWidgetFromLibrary(type) {
        const widget = this.createWidgetFromType(type);
        const slot = this.findAvailableLayoutSlot(widget.layout.columns, widget.layout.rows);
        if (!slot && this.canvas.layoutMode === 'grid') {
            widget.destroy();
            window.cherryApp.notify('No hay espacio libre para ese tamaño. Reduce o elimina un widget, o usa modo libre.', true);
            return null;
        }
        widget.layout = { ...widget.layout, ...(slot || { column: 0, row: 0 }) };
        this.canvas.addWidget(widget);
        widgetRegistry.applyFlags(widget);
        this.recordHistory('Añadido ' + type);
        this.state.selectWidget(widget.id, false);
        window.cherryApp.saveLayout();
        return widget;
    }

    /* Widget library */

    createWidgetLibrary() {

        const panel = document.createElement('div');
        panel.className = 'cherry-widget-library';

        const title = document.createElement('h2');
        title.className = 'cherry-widget-library__title';
        title.textContent = 'Widgets';

        const list = document.createElement('div');
        list.className = 'cherry-widget-library__list';

        // Tipos de widgets disponibles
        const widgetTypes = [
            { name: 'Clock', icon: '🕐', category: 'Display' },
            { name: 'Media', icon: '🎵', category: 'Display' },
            { name: 'System', icon: '⚙️', category: 'Info' },
            { name: 'Controls', icon: '🎚️', category: 'Interaction' },
            { name: 'Text', icon: '📝', category: 'Display' },
            { name: 'Toggle', icon: '🔘', category: 'Interaction' },
            { name: 'Slider', icon: '🎚️', category: 'Interaction' },
            { name: 'MediaVisual', icon: '🎨', category: 'Display' }
        ];

        widgetTypes.forEach(widget => {

            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'cherry-widget-card';
            card.draggable = true;
            card.dataset.widgetType = widget.name;

            card.innerHTML = `
                <div class="cherry-widget-card__icon">${widget.icon}</div>
                <div class="cherry-widget-card__name">${widget.name}</div>
                <div class="cherry-widget-card__category">${widget.category}</div>
            `;

            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('widget-type', widget.name);
            });

            card.addEventListener('click', () => {
                this.addWidgetFromLibrary(widget.name);
            });

            list.appendChild(card);
        });

        this._onElement(this.canvasElement, 'dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this._onElement(this.canvasElement, 'drop', (e) => {
            e.preventDefault();
            const widgetType = e.dataTransfer.getData('widget-type');
            if (!widgetType) return;

            const rect = this.canvasElement.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            const column = Math.max(0, Math.min(this.canvas.grid.columns - 1, Math.floor(offsetX / (this.canvas.grid.getColumnWidth() + this.canvas.grid.gap))));
            const row = Math.max(0, Math.min(this.canvas.grid.rows - 1, Math.floor(offsetY / (this.canvas.grid.getRowHeight() + this.canvas.grid.gap))));

            const widget = this.createWidgetFromType(widgetType, {
                layout: { column, row }
            });

            if (!widget) return;

            this.canvas.addWidget(widget);
            window.cherryApp.saveLayout();
            this.recordHistory(`Añadido ${widgetType} desde drag & drop`);
            this.state.selectWidget(widget.id, false);
        });

        panel.appendChild(title);
        panel.appendChild(list);

        return panel;
    }


    /* =====================================================
       CREAR TOOLBAR
       ===================================================== */

    createToolbar() {

        const toolbar = document.createElement('div');
        toolbar.className = 'cherry-toolbar';

        // Grupo de salida (primero, a la izquierda)
        const exitGroup = document.createElement('div');
        exitGroup.className = 'cherry-toolbar__group';

        const exitBtn = document.createElement('button');
        exitBtn.className = 'cherry-toolbar__button cherry-toolbar__button--exit';
        exitBtn.title = 'Salir del editor (Esc)';
        exitBtn.innerHTML = '← Volver';

        exitBtn.addEventListener('click', () => {
            this.exitEditor();
        });

        exitGroup.appendChild(exitBtn);

        // Grupo de navegación
        const navGroup = document.createElement('div');
        navGroup.className = 'cherry-toolbar__group';

        const undoBtn = document.createElement('button');
        undoBtn.className = 'cherry-toolbar__button';
        undoBtn.title = 'Undo (Ctrl+Z)';
        undoBtn.innerHTML = '↶';
        undoBtn.disabled = true;

        const redoBtn = document.createElement('button');
        redoBtn.className = 'cherry-toolbar__button';
        redoBtn.title = 'Redo (Ctrl+Y)';
        redoBtn.innerHTML = '↷';
        redoBtn.disabled = true;

        const updateHistoryButtons = () => {
            if (!this.history || typeof this.history.canUndo !== 'function') {
                undoBtn.disabled = true;
                redoBtn.disabled = true;
                return;
            }

            undoBtn.disabled = !this.history.canUndo();
            redoBtn.disabled = !this.history.canRedo();
        };

        if (this.history && typeof this.history.subscribe === 'function') {
            this.history.subscribe(updateHistoryButtons);
        }
        updateHistoryButtons();

        undoBtn.addEventListener('click', () => {
            const previousState = this.history.undo();
            if (!previousState) return;
            this.restoreCanvasState(previousState);
            this.state.clearSelection();
        });

        redoBtn.addEventListener('click', () => {
            const nextState = this.history.redo();
            if (!nextState) return;
            this.restoreCanvasState(nextState);
            this.state.clearSelection();
        });

        navGroup.appendChild(undoBtn);
        navGroup.appendChild(redoBtn);

        // Grupo de vista
        const viewGroup = document.createElement('div');
        viewGroup.className = 'cherry-toolbar__group';

        const gridToggle = document.createElement('button');
        gridToggle.className = 'cherry-toolbar__button';
        gridToggle.title = 'Mostrar/Ocultar Grid';
        gridToggle.innerHTML = '⊞';
        gridToggle.dataset.active = 'true';

        const snapToggle = document.createElement('button');
        snapToggle.className = 'cherry-toolbar__button';
        snapToggle.title = 'Activar/Desactivar Snap';
        snapToggle.innerHTML = '▦';
        snapToggle.dataset.active = 'true';

        const previewBtn = document.createElement('button');
        previewBtn.className = 'cherry-toolbar__button';
        previewBtn.title = 'Preview Mode';
        previewBtn.innerHTML = '👁️';

        const guidesToggle = document.createElement('button');
        guidesToggle.className = 'cherry-toolbar__button';
        guidesToggle.title = 'Mostrar/Ocultar guías';
        guidesToggle.innerHTML = '⌁';
        guidesToggle.dataset.active = this.state.guidesVisible;

        viewGroup.appendChild(gridToggle);
        viewGroup.appendChild(snapToggle);
        viewGroup.appendChild(guidesToggle);
        viewGroup.appendChild(previewBtn);

        // Grupo de zoom
        const zoomGroup = document.createElement('div');
        zoomGroup.className = 'cherry-toolbar__group';

        const zoomOut = document.createElement('button');
        zoomOut.className = 'cherry-toolbar__button';
        zoomOut.title = 'Zoom Out';
        zoomOut.innerHTML = '−';

        const zoomReset = document.createElement('button');
        zoomReset.className = 'cherry-toolbar__button';
        zoomReset.title = 'Reset Zoom';
        zoomReset.innerHTML = '1:1';

        const zoomIn = document.createElement('button');
        zoomIn.className = 'cherry-toolbar__button';
        zoomIn.title = 'Zoom In';
        zoomIn.innerHTML = '+';

        zoomGroup.appendChild(zoomOut);
        zoomGroup.appendChild(zoomReset);
        zoomGroup.appendChild(zoomIn);

        toolbar.appendChild(exitGroup);
        toolbar.appendChild(navGroup);
        toolbar.appendChild(viewGroup);
        toolbar.appendChild(zoomGroup);
        const layoutButton = document.createElement('button');
        layoutButton.type = 'button'; layoutButton.className = 'cherry-toolbar__button';
        layoutButton.textContent = 'Diseño'; layoutButton.title = 'Perfiles, layouts y archivos';
        layoutButton.style.width = 'auto'; layoutButton.style.padding = '0 12px';
        layoutButton.addEventListener('click', () => window.cherryApp.openLayouts(layoutButton));
        toolbar.appendChild(layoutButton);

        // Event listeners
        gridToggle.addEventListener('click', () => {
            this.state.toggleGrid();
            gridToggle.dataset.active = this.state.gridVisible;
        });

        snapToggle.addEventListener('click', () => {
            this.state.toggleSnap();
            snapToggle.dataset.active = this.state.snapEnabled;
        });

        guidesToggle.addEventListener('click', () => {
            this.state.toggleGuides();
            guidesToggle.dataset.active = this.state.guidesVisible;
        });

        // Pan con arrastre del viewport
        let panStart = null;

        this.canvasViewport.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
                panStart = {
                    x: e.clientX - this.state.panX,
                    y: e.clientY - this.state.panY
                };
                this.canvasViewport.style.cursor = 'grabbing';
            }
        });

        this.canvasViewport.addEventListener('mousemove', (e) => {
            if (!panStart) return;
            this.state.setPan(e.clientX - panStart.x, e.clientY - panStart.y);
        });

        this.canvasViewport.addEventListener('mouseup', () => {
            panStart = null;
            this.canvasViewport.style.cursor = 'default';
        });

        this.canvasViewport.addEventListener('mouseleave', () => {
            panStart = null;
            this.canvasViewport.style.cursor = 'default';
        });

        previewBtn.addEventListener('click', () => {
            this.togglePreviewMode();
        });

        zoomOut.addEventListener('click', () => {
            this.state.setZoom(this.state.zoom - 0.1);
        });

        zoomReset.addEventListener('click', () => {
            this.state.resetView();
        });

        zoomIn.addEventListener('click', () => {
            this.state.setZoom(this.state.zoom + 0.1);
        });

        // Keyboard shortcut para salir
        this._onDocument('keydown', (e) => {

    if (e.key === 'Escape' && !this.overlayManager.getActive()) {
        this.exitEditor();
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        const previousState = this.history.undo();
        if (previousState) {
            this.restoreCanvasState(previousState);
            this.state.clearSelection();
        }
    }

    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        const nextState = this.history.redo();
        if (nextState) {
            this.restoreCanvasState(nextState);
            this.state.clearSelection();
        }
    }

    const activeEl = document.activeElement;
    const isTyping = activeEl && ['INPUT', 'SELECT', 'TEXTAREA'].includes(activeEl.tagName);

    // Eliminar con Delete / Backspace
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping && this.state.selectedWidgets.length > 0) {
        e.preventDefault();
        this.deleteWidgets([...this.state.selectedWidgets]);
    }

    // Mover con flechas (Shift = pasos de 12px, sin Shift = 1px)
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

        if (arrowKeys.includes(e.key) && !isTyping && this.state.selectedWidgets.length > 0) {

            e.preventDefault();

            const step = e.shiftKey ? 12 : 1;
            let dx = 0, dy = 0;

            if (e.key === 'ArrowUp') dy = this.canvas.layoutMode === 'grid' ? -(this.canvas.grid.getRowHeight() + this.canvas.grid.gap) : -step;
            if (e.key === 'ArrowDown') dy = this.canvas.layoutMode === 'grid' ? this.canvas.grid.getRowHeight() + this.canvas.grid.gap : step;
            if (e.key === 'ArrowLeft') dx = this.canvas.layoutMode === 'grid' ? -(this.canvas.grid.getColumnWidth() + this.canvas.grid.gap) : -step;
            if (e.key === 'ArrowRight') dx = this.canvas.layoutMode === 'grid' ? this.canvas.grid.getColumnWidth() + this.canvas.grid.gap : step;

            this.state.selectedWidgets.forEach(id => {

                const w = this.canvasAdapter.getWidget(id);
                if (!w || w.flags?.locked) return;

                const maxX = Math.max(0, this.canvas.width - w.geometry.width);
                const maxY = Math.max(0, this.canvas.height - w.geometry.height);

                w.setGeometry({
                    x: Math.min(Math.max(w.geometry.x + dx, 0), maxX),
                    y: Math.min(Math.max(w.geometry.y + dy, 0), maxY)
                });
            });

            this.selectionManager.updateHandlePositions();
            this.recordHistory('Mover con teclado');

            if (window.cherryApp && typeof window.cherryApp.saveLayout === 'function') {
                window.cherryApp.saveLayout();
            }
        }
    });

        return toolbar;
    }


    /* =====================================================
       SETUP INTERACCIONES DEL CANVAS
       ===================================================== */

    setupCanvasInteractions() {

        // Click en widget para seleccionar
        this._onElement(this.canvasElement, 'click', (e) => {

            if (e.target === this.canvasElement) {
                this.state.clearSelection();
                return;
            }

            const widget = e.target.closest('.cherry-widget');

            if (widget) {
                const widgetId = widget.dataset.widgetId;
                const multiSelect = e.ctrlKey || e.metaKey;
                this.state.selectWidget(widgetId, multiSelect);
                e.stopPropagation();
            }
        });

        this._onDocument('click', (e) => {
            const clickedInsideEditor = e.target.closest('#cherry-editor');
            const clickedInsideWidget = e.target.closest('.cherry-widget');
            const clickedInSelectionHandle = e.target.closest('.cherry-resize-handle, .cherry-widget-menu-button, .cherry-selection-outline');

            if (!clickedInsideEditor && !clickedInsideWidget && !clickedInSelectionHandle) {
                this.state.clearSelection();
            }
        });

        // Right-click para menú contextual
        this._onElement(this.canvasElement, 'contextmenu', (e) => {

            const widget = e.target.closest('.cherry-widget');

            if (widget) {
                e.preventDefault();
                const widgetId = widget.dataset.widgetId;
                this.openWidgetContextMenu(widgetId, e.clientX, e.clientY);
            }
        });

        // Drag para mover widgets
        this._onElement(this.canvasElement, 'mousedown', (e) => {

            const widget = e.target.closest('.cherry-widget');
            const isMenuButton = e.target.closest('.cherry-widget-menu-button');

            if (widget && !isMenuButton && widget.dataset.locked !== 'true' && e.button === 0 && !e.target.closest('button, input, select, textarea')) {

                const widgetId = widget.dataset.widgetId;

                // Si haces click en un widget que NO está seleccionado,
                // lo seleccionamos (respetando Ctrl/Cmd para multi-select)
                if (!this.state.selectedWidgets.includes(widgetId)) {
                    const multiSelect = e.ctrlKey || e.metaKey;
                    this.state.selectWidget(widgetId, multiSelect);
                }

                this.isDragging = true;
                this.draggedWidgetId = widgetId;
                this.dragStartPos = { x: e.clientX, y: e.clientY };

                // Capturamos la geometría inicial de TODOS los widgets
                // que van a moverse juntos
                const idsToMove = this.state.selectedWidgets.includes(widgetId)
                    ? this.state.selectedWidgets
                    : [widgetId];

                this.dragGroupStartGeometry = new Map();

                idsToMove.forEach(id => {
                    const w = this.canvasAdapter.getWidget(id);
                    if (w) {
                        this.dragGroupStartGeometry.set(id, { ...w.geometry });
                    }
                });

                idsToMove.forEach(id => {
                    const el = document.querySelector(`[data-widget-id="${id}"]`);
                    if (el) el.classList.add('cherry-widget--dragging');
                });
            }
        });

        this._onDocument('mousemove', (e) => {

            if (this.isDragging && this.dragGroupStartGeometry && this.dragGroupStartGeometry.size > 0) {

                const dx = (e.clientX - this.dragStartPos.x) / this.state.zoom;
                const dy = (e.clientY - this.dragStartPos.y) / this.state.zoom;

                // El widget "líder" (el que originó el drag) es quien decide el snap
                const leaderStart = this.dragGroupStartGeometry.get(this.draggedWidgetId);
                const leaderWidget = this.canvasAdapter.getWidget(this.draggedWidgetId);

                let appliedDx = dx;
                let appliedDy = dy;

                if (leaderStart && leaderWidget) {

                    const rawX = leaderStart.x + dx;
                    const rawY = leaderStart.y + dy;

                    const otherElements = this.canvas.widgets
                        .filter(w => !this.dragGroupStartGeometry.has(w.id))
                        .map(w => w.element);

                    const snapped = this.snapManager.snapPosition(rawX, rawY, null, otherElements);

                    // El delta ya snapeado se replica al resto del grupo
                    appliedDx = snapped.x - leaderStart.x;
                    appliedDy = snapped.y - leaderStart.y;

                    const guides = this.snapManager.calculateGuides(
                        leaderWidget.element.getBoundingClientRect(),
                        otherElements
                    );
                    this.renderGuides(guides);
                }

                this.dragGroupStartGeometry.forEach((startGeo, id) => {

                    const w = this.canvasAdapter.getWidget(id);
                    if (!w) return;

                    const maxX = Math.max(0, this.canvas.width - startGeo.width);
                    const maxY = Math.max(0, this.canvas.height - startGeo.height);

                    const clampedX = Math.min(Math.max(startGeo.x + appliedDx, 0), maxX);
                    const clampedY = Math.min(Math.max(startGeo.y + appliedDy, 0), maxY);

                    w.setGeometry({ x: clampedX, y: clampedY });
                });

                this.selectionManager.updateHandlePositions();
            }

            if (this.isResizing && this.resizedWidgetId && this.resizeStartGeometry) {
                const widget = this.canvasAdapter.getWidget(this.resizedWidgetId);
                if (widget) {
                    const dx = (e.clientX - this.resizeStartPos.x) / this.state.zoom;
                    const dy = (e.clientY - this.resizeStartPos.y) / this.state.zoom;
                    const start = this.resizeStartGeometry;
                    let next = { ...start };

                    if (this.resizeDirection.includes('e')) {
                        next.width = Math.max(50, start.width + dx);
                    }

                    if (this.resizeDirection.includes('s')) {
                        next.height = Math.max(50, start.height + dy);
                    }

                    if (this.resizeDirection.includes('w')) {
                        const candidateWidth = Math.max(50, start.width - dx);
                        next.x = start.x + (start.width - candidateWidth);
                        next.width = candidateWidth;
                    }

                    if (this.resizeDirection.includes('n')) {
                        const candidateHeight = Math.max(50, start.height - dy);
                        next.y = start.y + (start.height - candidateHeight);
                        next.height = candidateHeight;
                    }

                    const snappedSize = this.snapManager.snapSize(next.width, next.height, []);
                    next.width = snappedSize.width;
                    next.height = snappedSize.height;

                    const maxWidth = Math.max(50, this.canvas.width - next.x);
                    const maxHeight = Math.max(50, this.canvas.height - next.y);
                    next.width = Math.min(next.width, maxWidth);
                    next.height = Math.min(next.height, maxHeight);

                    if (next.x < 0) {
                        next.width += next.x;
                        next.x = 0;
                    }

                    if (next.y < 0) {
                        next.height += next.y;
                        next.y = 0;
                    }

                    widget.setGeometry(next);
                    const guides = this.snapManager.calculateGuides(
                        widget.element.getBoundingClientRect(),
                        this.canvas.widgets.filter(w => w.id !== widget.id).map(w => w.element)
                    );
                    this.renderGuides(guides);
                    this.selectionManager.updateHandlePositions();
                }
            }
        });

        this._onDocument('mouseup', (e) => {

            if (this.isDragging && this.dragGroupStartGeometry) {

                this.dragGroupStartGeometry.forEach((_, id) => {
                    const el = document.querySelector(`[data-widget-id="${id}"]`);
                    if (el) el.classList.remove('cherry-widget--dragging');
                });

                this.recordHistory(
                    this.dragGroupStartGeometry.size > 1
                        ? 'Movimiento de múltiples widgets'
                        : 'Movimiento de widget'
                );

                if (window.cherryApp && typeof window.cherryApp.saveLayout === 'function') {
                    window.cherryApp.saveLayout();
                }
            }

            if (this.isResizing && this.resizedWidgetId) {
                this.selectionManager.updateHandlePositions();
                this.recordHistory('Redimensión de widget');
                if (window.cherryApp && typeof window.cherryApp.saveLayout === 'function') {
                    window.cherryApp.saveLayout();
                }
            }

            this.clearGuides();

            this.isDragging = false;
            this.draggedWidgetId = null;
            this.dragGroupStartGeometry = null;
            this.dragStartPos = null;

            this.isResizing = false;
            this.resizedWidgetId = null;
            this.resizeDirection = null;
            this.resizeStartPos = null;
            this.resizeStartGeometry = null;
        });
    }


    /* =====================================================
       SETUP INTERACCIONES DE SELECCIÓN
       ===================================================== */

    setupSelectionInteractions() {

        // Botón de menú contextual
        this._onDocument('click', (e) => {

            if (e.target.classList.contains('cherry-widget-menu-button')) {
                const widgetId = e.target.dataset.widgetId;
                const rect = e.target.getBoundingClientRect();
                this.openWidgetContextMenu(widgetId, rect.left, rect.bottom);
                e.stopPropagation();
            }
        });

        // Resize handles
        this._onDocument('mousedown', (e) => {

            if (e.target.classList.contains('cherry-resize-handle') && !this.canvasAdapter.getWidget(e.target.dataset.widgetId)?.flags?.locked) {
                this.isResizing = true;
                this.resizedWidgetId = e.target.dataset.widgetId;
                this.resizeDirection = e.target.dataset.direction || '';
                this.resizeStartPos = { x: e.clientX, y: e.clientY };
                const widget = this.canvasAdapter.getWidget(this.resizedWidgetId);
                this.resizeStartGeometry = widget ? { ...widget.geometry } : null;
                e.preventDefault();
            }
        });
    }


    /* =====================================================
       REGISTRAR CONTROLES QUE SOPORTAN LONG PRESS
       ===================================================== */

    registerLongPressTargets() {
        if (!this.canvasElement || !this.longPressManager) {
            return;
        }

        const registerWidget = (widgetEl) => {
            if (!widgetEl || widgetEl.dataset.longPressRegistered === 'true') {
                return;
            }

            const widgetId = widgetEl.dataset.widgetId;
            widgetEl.tabIndex = 0;
            widgetEl.setAttribute('aria-label', 'Acciones del widget: Alt+flecha abajo');
            const widgetObject = this.canvasAdapter?.getWidget(widgetId);
            const actions = this.getWidgetContextActions(widgetId, widgetObject).map((action) => ({
                ...action,
                callback: (event, item) => {
                    if (item && item.action) {
                        this.executeWidgetAction(widgetId, item.action, item.value);
                    }
                }
            }));

            this.longPressManager.register(widgetEl, {
                title: widgetObject?.type || 'Control',
                actions,
                onAction: () => {
                    if (this.overlayManager && typeof this.overlayManager.closeAll === 'function') {
                        this.overlayManager.closeAll();
                        this.selectionManager.clearSelection();
                        this.state.clearSelection();
                    }
                }
            });

            widgetEl.dataset.longPressRegistered = 'true';
        };

        this.canvasElement.querySelectorAll('.cherry-widget').forEach(registerWidget);
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) {
                        return;
                    }
                    if (node.matches?.('.cherry-widget')) {
                        registerWidget(node);
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('.cherry-widget').forEach(registerWidget);
                    }
                });
            });
        });

        this.longPressObserver = observer;
        observer.observe(this.canvasElement, { childList: true, subtree: true });
    }

    /* =====================================================
       SETUP TOOLBAR INTERACTIONS
       ===================================================== */

    setupToolbarInteractions() {

        // Ya configurado en createToolbar
    }


    /* =====================================================
       ABRIR MENÚ CONTEXTUAL DEL WIDGET
       ===================================================== */

    openWidgetContextMenu(widgetId, x, y) {

        const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);
        const widgetObject = this.canvasAdapter.getWidget(widgetId);
        const widgetType = widget?.dataset.widgetType || widgetObject?.type || 'unknown';

        const menuContent = document.createElement('div');
        menuContent.className = 'cherry-context-menu';

        const actions = this.getWidgetContextActions(widgetId, widgetObject);

        actions.forEach(item => {

            if (item.divider) {
                const divider = document.createElement('div');
                divider.className = 'cherry-context-menu__divider';
                menuContent.appendChild(divider);
            } else {
                const menuItem = document.createElement('button');
                menuItem.className = 'cherry-context-menu__item';
                menuItem.textContent = item.label;

                menuItem.addEventListener('click', () => {
                    if (item.action) {
                        this.executeWidgetAction(widgetId, item.action, item.value);
                    }
                    this.overlayManager.close('widget-context-menu');
                });

                menuContent.appendChild(menuItem);
            }
        });

        this.overlayManager.create('widget-context-menu', {
            content: menuContent,
            position: { x, y },
            anchor: widget
        });
    }


    /* =====================================================
       OBTENER ACCIONES DINÁMICAS DEL MENÚ
       ===================================================== */

    getWidgetContextActions(widgetId, widgetObject) {

        const actions = [
            { label: 'Duplicar', action: 'duplicate' },
            { label: 'Eliminar', action: 'delete' },
            { divider: true },
            { label: 'Traer al frente', action: 'bringFront' },
            { label: 'Enviar atrás', action: 'sendBack' },
            { divider: true },
            { label: 'Bloquear / desbloquear', action: 'lock' },
            { label: 'Ocultar', action: 'hide' }
        ];

        if (widgetObject) {
            const sizeOptions = widgetObject.sizePresets ? Object.keys(widgetObject.sizePresets) : ['mini', 'small', 'medium', 'large'];
            const styleOptions = widgetObject.styles ? Object.keys(widgetObject.styles) : WIDGET_CATALOG[canonicalWidgetType(widgetObject.type)].styles;
            const variantOptions = ['translucid', 'solid', 'glass'];

            actions.push({ divider: true });
            actions.push({ label: `Tamaño: ${widgetObject.size || 'small'}`, action: 'size', value: sizeOptions[0] });

            sizeOptions.forEach(size => {
                actions.push({ label: `  • ${size}`, action: 'size', value: size });
            });

            actions.push({ divider: true });
            variantOptions.forEach(variant => {
                actions.push({ label: `Variante: ${variant}`, action: 'variant', value: variant });
            });

            actions.push({ divider: true });
            styleOptions.forEach(style => {
                actions.push({ label: `Estilo: ${style}`, action: 'style', value: style });
            });
        }

        return actions;
    }


    /* =====================================================
       EJECUTAR ACCIONES DEL WIDGET
       ===================================================== */

    executeWidgetAction(widgetId, action, value = null) {

        const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);

        if (!widget) return;

        switch (action) {

            case 'delete':
                this.deleteWidgets([widgetId]);
                return;

            case 'duplicate': {
                const clone = this.canvasAdapter.duplicateWidget(widgetId);
                if (clone) { this.recordHistory('Duplicar widget'); this.state.selectWidget(clone.id, false); }
                break;
            }

            case 'bringFront':
                this.canvasAdapter.bringToFront(widgetId);
                this.recordHistory('Orden del widget');
                break;

            case 'sendBack':
                this.canvasAdapter.sendToBack(widgetId);
                this.recordHistory('Orden del widget');
                break;

            case 'lock': {
                const instance = this.canvasAdapter.getWidget(widgetId);
                instance.flags.locked = !instance.flags.locked;
                widgetRegistry.applyFlags(instance);
                this.recordHistory('Bloqueo de widget');
                break;
            }
            case 'hide': {
                const instance = this.canvasAdapter.getWidget(widgetId);
                instance.flags.hidden = !instance.flags.hidden;
                widgetRegistry.applyFlags(instance);
                this.state.clearSelection(); this.recordHistory('Visibilidad de widget');
                break;
            }

            case 'size':
                if (value) {
                    this.canvasAdapter.setWidgetSize(widgetId, value);
                    this.state.notify();
                    this.recordHistory('Cambio de tamaño');
                }
                break;

            case 'variant':
                if (value) {
                    this.canvasAdapter.setWidgetVariant(widgetId, value);
                    this.state.notify();
                    this.recordHistory('Cambio de variante');
                }
                break;

            case 'style':
                if (value) {
                    this.canvasAdapter.setWidgetStyle(widgetId, value);
                    this.state.notify();
                    this.recordHistory('Cambio de estilo');
                }
                break;

            default:
                console.log(`Action ${action} not implemented`);
        }
        window.cherryApp.saveLayout();
    }

    deleteWidgets(widgetIds = []) {

        if (!widgetIds.length) return;

        widgetIds.forEach(id => {
            const instance = this.canvasAdapter.getWidget(id);
            if (instance) { this.longPressManager.unregister(instance.element); this.canvas.removeWidget(instance); }
        });

        this.state.clearSelection();

        this.recordHistory(
            widgetIds.length > 1
                ? `Eliminar ${widgetIds.length} widgets`
                : 'Eliminar widget'
        );

        if (window.cherryApp && typeof window.cherryApp.saveLayout === 'function') {
            window.cherryApp.saveLayout();
        }
    }


    /* =====================================================
       TOGGLE PREVIEW MODE
       ===================================================== */

    togglePreviewMode() {
        const finished = this.exitEditor();
        Promise.resolve(finished).then(() => window.cherryApp.setDisplayMode(true));
    }

    createColorControl(label, value, onChange) {

        const control = document.createElement('div');
        control.className = 'cherry-property-control';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;

        const input = document.createElement('input');
        input.type = 'color';
        input.value = value;
        input.className = 'cherry-property-control__input';

        input.addEventListener('input', (e) => {
            onChange(e.target.value);
        });

        control.appendChild(labelEl);
        control.appendChild(input);

        return control;
    }


    createButtonGroup(label, options, selectedIndex, onChange) {

        const control = document.createElement('div');
        control.className = 'cherry-property-control';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;

        const group = document.createElement('div');
        group.className = 'cherry-property-control__group';

        options.forEach((option, idx) => {

            const btn = document.createElement('button');
            btn.className = 'cherry-property-control__option';
            if (idx === selectedIndex) btn.classList.add('active');
            btn.textContent = option;

            btn.addEventListener('click', () => {
                group.querySelectorAll('.active').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                onChange(idx);
            });

            group.appendChild(btn);
        });

        control.appendChild(labelEl);
        control.appendChild(group);

        return control;
    }


    createPropertyControl(label, options, selectedValue, onChange) {

        const control = document.createElement('div');
        control.className = 'cherry-property-control';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;

        const select = document.createElement('select');
        select.className = 'cherry-property-control__select';

        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option.charAt(0).toUpperCase() + option.slice(1);
            if (option === selectedValue) opt.selected = true;
            select.appendChild(opt);
        });

        select.addEventListener('change', (e) => {
            if (onChange) {
                onChange(e.target.value);
            }
        });

        control.appendChild(labelEl);
        control.appendChild(select);

        return control;
    }


    /* =====================================================
       OBTENER REFERENCIA DEL ESTADO
       ===================================================== */

    getState() {

        return this.state.getState();
    }


    /* =====================================================
   SALIR DEL EDITOR
   ===================================================== */

    exitEditor() {
        console.log('✓ Exiting editor...');

        this.longPressObserver?.disconnect();
        this.longPressManager?.destroy();
        this.canvasElement.querySelectorAll('.cherry-widget').forEach(element => {
            delete element.dataset.longPressRegistered;
            element.removeAttribute('tabindex');
            element.removeAttribute('aria-label');
        });

        // Limpiar overlays
        this.overlayManager.closeAll();

        // Limpiar completamente la selección
        this.selectionManager.clearSelection();
        this.state.clearSelection();

        // Devolver el canvas a su ubicación ORIGINAL antes de destruir
        if (this.originalParent) {
            if (
                this.originalNextSibling &&
                this.originalNextSibling.parentNode === this.originalParent
            ) {
                this.originalParent.insertBefore(
                    this.canvasElement,
                    this.originalNextSibling
                );
            } else {
                this.originalParent.appendChild(this.canvasElement);
            }
        }

        // Remover container del editor
        if (this.editorContainer && this.editorContainer.parentNode) {
            this.editorContainer.remove();
        }

        // Quitar TODOS los listeners de document que esta instancia registró
        this._boundHandlers.forEach(({ event, handler }) => {
            document.removeEventListener(event, handler);
        });

        this._boundHandlers = [];
        this._boundElementHandlers.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });

        this._boundElementHandlers = [];

        // Destruir overlay manager
        if (typeof this.overlayManager.destroy === 'function') {
            this.overlayManager.destroy();
        }

        // Llamar callback de salida
        if (window.cherryApp && window.cherryApp.exitEditor) {
            return window.cherryApp.exitEditor();
        }
    }
}
