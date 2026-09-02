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

import { ClockWidget } from '../widgets/clock/ClockWidget.js';
import { MediaWidget } from '../widgets/media/mediawidget.js';
import { SystemWidget } from '../widgets/system/systemwidget.js';
import { ControlsWidget } from '../widgets/controls/controlswidget.js';
import { TextWidget } from '../widgets/text/textwidget.js';
import { ToggleWidget } from '../widgets/controls/togglewidget.js';
import { SliderWidget } from '../widgets/controls/sliderwidget.js';
import { MediaVisualWidget } from '../widgets/visual/mediavisualwidget.js';

export class Editor {

    constructor(canvas, options = {}) {

        this.canvas = canvas;
        this.canvasElement = this.canvas.element;
        
        this.originalParent = this.canvasElement.parentNode;
        this.originalNextSibling = this.canvasElement.nextSibling;

        this._boundHandlers = [];

        /* -------------------------------------------------
           ESTADO
           ------------------------------------------------- */

        this.state = new EditorState();


        /* -------------------------------------------------
           MANAGERS
           ------------------------------------------------- */

        this.overlayManager = new OverlayManager(document.body);
        this.selectionManager = new SelectionManager(this.state, this.canvasElement);
        this.snapManager = new SnapManager(this.state, 12);
        this.canvasAdapter = new CanvasAdapter(this.canvas, this.state);
        this.history = new EditorHistory(80);


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

        this.createEditorLayout();
        this.bindStateToCanvas();
        this.setupCanvasInteractions();
        this.setupSelectionInteractions();
        this.setupToolbarInteractions();
        this.recordHistory('Estado inicial del editor');

        console.log('✓ Cherry Editor initialized');
    }


_onDocument(event, handler) {
    this._onDocument(event, handler);
    this._boundHandlers.push({ event, handler });
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
            (color) => this.state.setAccentColor(color)
        );

        const themeControl = this.createButtonGroup(
            'Tema',
            ['Light', 'Dark'],
            this.state.themeMode === 'dark' ? 1 : 0,
            (idx) => this.state.setThemeMode(idx === 0 ? 'light' : 'dark')
        );

        appearanceSection.appendChild(appearanceTitle);
        appearanceSection.appendChild(accentControl);
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
            const variantOptions = ['translucid', 'solid', 'glass', 'dark', 'light'];

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
        return this.canvas.widgets.map(widget => ({
            id: widget.id,
            type: widget.type,
            size: widget.size,
            variant: widget.variant,
            style: widget.style,
            layout: { ...widget.layout },
            geometry: { ...widget.geometry },
            settings: { ...widget.settings },
            state: { ...widget.state }
        }));
    }

    recordHistory(description = 'Cambio del editor') {
        const snapshot = this.captureCanvasState();
        this.history.addState(snapshot, description);
        return snapshot;
    }

    restoreCanvasState(snapshot = []) {
        if (!Array.isArray(snapshot) || snapshot.length === 0) return;

        const snapshotMap = new Map(snapshot.map(item => [item.id, item]));

        this.canvas.widgets.forEach(widget => {
            if (!snapshotMap.has(widget.id)) {
                this.canvas.removeWidget(widget);
            }
        });

        snapshot.forEach(saved => {
            const existing = this.canvas.widgets.find(widget => widget.id === saved.id);

            if (existing) {
                existing.size = saved.size;
                existing.variant = saved.variant;
                existing.style = saved.style;
                existing.layout = { ...saved.layout };
                existing.settings = { ...saved.settings };
                existing.state = { ...saved.state };
                if (typeof existing.setSize === 'function') {
                    existing.setSize(saved.size);
                }
                if (typeof existing.setVariant === 'function') {
                    existing.setVariant(saved.variant);
                }
                if (typeof existing.setStyle === 'function') {
                    existing.setStyle(saved.style);
                }
                existing.setGeometry({ ...saved.geometry });
                if (existing.element) {
                    existing.render();
                }
                return;
            }

            const widget = this.createWidgetFromType(saved.type, {
                id: saved.id,
                size: saved.size,
                variant: saved.variant,
                style: saved.style,
                layout: { ...saved.layout },
                settings: { ...saved.settings },
                state: { ...saved.state }
            });

            if (widget) {
                this.canvas.addWidget(widget);
            }
        });

        this.selectionManager.updateHandlePositions();
    }

    createWidgetFromType(type, config = {}) {
        const widgetName = String(type || '').toLowerCase();

        const factoryMap = {
            clock: () => new ClockWidget({ ...config, size: config.size || 'medium', style: config.style || 'onlyclock', variant: config.variant || 'translucid' }),
            media: () => new MediaWidget({ ...config, size: config.size || 'large', style: config.style || 'artworkProtagonist', variant: config.variant || 'translucid' }),
            system: () => new SystemWidget({ ...config, size: config.size || 'cardhorizontal', style: config.style || 'circular', variant: config.variant || 'translucid' }),
            controls: () => new ControlsWidget({ ...config, size: config.size || 'medium', style: config.style || 'buttons', variant: config.variant || 'translucid' }),
            text: () => new TextWidget({ ...config, size: config.size || 'small', style: config.style || 'default', variant: config.variant || 'translucid' }),
            toggle: () => new ToggleWidget({ ...config, size: config.size || 'small', style: config.style || 'widget', variant: config.variant || 'translucid' }),
            slider: () => new SliderWidget({ ...config, size: config.size || 'mini', style: config.style || 'bar', variant: config.variant || 'translucid' }),
            mediavisual: () => new MediaVisualWidget({ ...config, size: config.size || 'medium', style: config.style || 'visualizer', variant: config.variant || 'translucid' }),
            mediavisual: () => new MediaVisualWidget({ ...config, size: config.size || 'medium', style: config.style || 'visualizer', variant: config.variant || 'translucid' })
        };

        const factory = factoryMap[widgetName];
        if (!factory) {
            console.warn(`Widget type no soportado: ${type}`);
            return null;
        }

        return factory();
    }

    findAvailableLayoutSlot() {
        const occupied = this.canvas.widgets.map(widget => ({
            column: widget.layout.column ?? 0,
            row: widget.layout.row ?? 0,
            columns: widget.layout.columns ?? 1,
            rows: widget.layout.rows ?? 1
        }));

        for (let row = 0; row < this.canvas.grid.rows; row++) {
            for (let column = 0; column < this.canvas.grid.columns; column++) {
                const overlaps = occupied.some(item => {
                    const endCol = item.column + item.columns;
                    const endRow = item.row + item.rows;
                    const targetEndCol = column + 1;
                    const targetEndRow = row + 1;
                    return column < endCol && targetEndCol > item.column && row < endRow && targetEndRow > item.row;
                });

                if (!overlaps) {
                    return { column, row, columns: 1, rows: 1 };
                }
            }
        }

        return { column: 0, row: 0, columns: 1, rows: 1 };
    }

    addWidgetFromLibrary(type) {
        const widget = this.createWidgetFromType(type, {
            layout: this.findAvailableLayoutSlot()
        });

        if (!widget) return null;

        this.canvas.addWidget(widget);
        this.recordHistory(`Añadido ${type}`);
        this.state.selectWidget(widget.id, false);

        return widget;
    }

    /* =====================================================
       CREAR WIDGET LIBRARY
       ===================================================== */

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

            const card = document.createElement('div');
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

        this.canvasElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.canvasElement.addEventListener('drop', (e) => {
            e.preventDefault();
            const widgetType = e.dataTransfer.getData('widget-type');
            if (!widgetType) return;

            const rect = this.canvasElement.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            const column = Math.max(0, Math.min(this.canvas.grid.columns - 1, Math.floor(offsetX / (this.canvas.grid.getColumnWidth() + this.canvas.grid.gap))));
            const row = Math.max(0, Math.min(this.canvas.grid.rows - 1, Math.floor(offsetY / (this.canvas.grid.getRowHeight() + this.canvas.grid.gap))));

            const widget = this.createWidgetFromType(widgetType, {
                layout: { column, row, columns: 1, rows: 1 }
            });

            if (!widget) return;

            this.canvas.addWidget(widget);
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
            undoBtn.disabled = !this.history.canUndo();
            redoBtn.disabled = !this.history.canRedo();
        };

        this.history.subscribe(updateHistoryButtons);
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

            if (e.key === 'ArrowUp') dy = -step;
            if (e.key === 'ArrowDown') dy = step;
            if (e.key === 'ArrowLeft') dx = -step;
            if (e.key === 'ArrowRight') dx = step;

            this.state.selectedWidgets.forEach(id => {

                const w = this.canvasAdapter.getWidget(id);
                if (!w) return;

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
        this.canvasElement.addEventListener('click', (e) => {

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
        this.canvasElement.addEventListener('contextmenu', (e) => {

            const widget = e.target.closest('.cherry-widget');

            if (widget) {
                e.preventDefault();
                const widgetId = widget.dataset.widgetId;
                this.openWidgetContextMenu(widgetId, e.clientX, e.clientY);
            }
        });

        // Drag para mover widgets
        this.canvasElement.addEventListener('mousedown', (e) => {

            const widget = e.target.closest('.cherry-widget');
            const isMenuButton = e.target.closest('.cherry-widget-menu-button');

            if (widget && !isMenuButton && e.button === 0) {

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

                const dx = e.clientX - this.dragStartPos.x;
                const dy = e.clientY - this.dragStartPos.y;

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
                    const dx = e.clientX - this.resizeStartPos.x;
                    const dy = e.clientY - this.resizeStartPos.y;
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

            if (e.target.classList.contains('cherry-resize-handle')) {
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
            { label: 'Bloquear', action: 'lock' },
            { label: 'Ocultar', action: 'hide' }
        ];

        if (widgetObject) {
            const sizeOptions = widgetObject.sizePresets ? Object.keys(widgetObject.sizePresets) : ['mini', 'small', 'medium', 'large'];
            const styleOptions = widgetObject.styles ? Object.keys(widgetObject.styles) : ['default', 'widget', 'bar', 'buttons'];
            const variantOptions = ['translucid', 'solid', 'glass', 'dark', 'light'];

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
                widget.remove();
                this.canvas.widgets = this.canvas.widgets.filter(item => item.id !== widgetId);
                this.state.clearSelection();
                this.recordHistory('Eliminar widget');
                this.deleteWidgets([widgetId]);
                break;

            case 'duplicate':
                const config = this.canvasAdapter.duplicateWidget(widgetId);
                if (config) {
                    const clone = widget.cloneNode(true);
                    clone.dataset.widgetId = config.id;
                    clone.style.transform = 'translateX(16px) translateY(16px)';
                    this.canvasElement.appendChild(clone);
                    this.recordHistory('Duplicar widget');
                }
                break;

            case 'bringFront':
                this.canvasAdapter.bringToFront(widgetId);
                break;

            case 'sendBack':
                this.canvasAdapter.sendToBack(widgetId);
                break;

            case 'lock':
                widget.classList.add('cherry-widget--locked');
                widget.dataset.locked = 'true';
                break;

            case 'hide':
                widget.classList.add('cherry-widget--hidden');
                widget.style.display = 'none';
                this.state.clearSelection();
                break;

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
    }

    deleteWidgets(widgetIds = []) {

        if (!widgetIds.length) return;

        widgetIds.forEach(id => {
            const element = document.querySelector(`[data-widget-id="${id}"]`);
            if (element) element.remove();
            this.canvas.widgets = this.canvas.widgets.filter(item => item.id !== id);
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

        this.state.setMode(this.state.mode === 'edit' ? 'preview' : 'edit');

        if (this.state.mode === 'preview') {
            this.editorContainer.classList.add('cherry-editor--preview');
        } else {
            this.editorContainer.classList.remove('cherry-editor--preview');
        }
    }


    /* =====================================================
       CREAR CONTROLES DE PROPIEDADES
       ===================================================== */

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

    // Limpiar overlays
    this.overlayManager.closeAll();

    // Devolver el canvas a su ubicación ORIGINAL antes de destruir
    // el contenedor del editor (evita que quede huérfano/detached)
    if (this.originalParent) {
        if (this.originalNextSibling && this.originalNextSibling.parentNode === this.originalParent) {
            this.originalParent.insertBefore(this.canvasElement, this.originalNextSibling);
        } else {
            this.originalParent.appendChild(this.canvasElement);
        }
    }

    // Remover container del editor (ya sin el canvas adentro)
    if (this.editorContainer && this.editorContainer.parentNode) {
        this.editorContainer.remove();
    }

    // Quitar TODOS los listeners de document que esta instancia registró
    this._boundHandlers.forEach(({ event, handler }) => {
        document.removeEventListener(event, handler);
    });
    this._boundHandlers = [];

    // Destruir el overlay manager (sus propios listeners de document)
    if (typeof this.overlayManager.destroy === 'function') {
        this.overlayManager.destroy();
    }

    // Llamar callback de salida si existe
    if (window.cherryApp && window.cherryApp.exitEditor) {
        window.cherryApp.exitEditor();
    }
}
}
