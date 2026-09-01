import { Canvas } from "../core/canvas/Canvas.js";
import { initializeEditor } from "../editor/index.js";
import { EditorEntryButton } from "../editor/ui/EditorEntryButton.js";

import { ClockWidget }
    from "../widgets/clock/ClockWidget.js";

import { MediaWidget }
    from "../widgets/media/mediawidget.js";

import { SystemWidget }
    from "../widgets/system/systemwidget.js";

import { ControlsWidget }
    from "../widgets/controls/controlswidget.js";

import { MediaVisualWidget }
    from "../widgets/visual/mediavisualwidget.js";    

import { TextWidget }
    from "../widgets/text/textwidget.js";

import {ToggleWidget}
    from "../widgets/controls/togglewidget.js";

import { SliderWidget } 
    from "../widgets/controls/sliderwidget.js";


// =====================================================
// ESTADO DEL EDITOR
// =====================================================

let editorMode = false;
let editor = null;
let editorEntryButton = null;
let currentLayoutState = [];
const LAYOUT_STORAGE_KEY = 'cherry-layout-state-v1';

function saveCurrentLayout() {
    currentLayoutState = canvas.widgets.map(widget => ({
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

    try {
        window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(currentLayoutState));
    } catch (error) {
        console.warn('Cherry: no se pudo guardar el layout persistente', error);
    }

    if (window.cherryApp) {
        window.cherryApp.layoutState = currentLayoutState;
    }

    return currentLayoutState;
}

function loadSavedLayout() {
    try {
        const saved = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
        if (!saved) return [];

        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('Cherry: no se pudo cargar el layout persistente', error);
        return [];
    }
}

function applySavedLayout(layoutState = []) {
    if (!Array.isArray(layoutState) || !layoutState.length) return;

    layoutState.forEach(saved => {
        const widget = canvas.widgets.find(item => item.id === saved.id);
        if (!widget) return;

        widget.size = saved.size;
        widget.variant = saved.variant;
        widget.style = saved.style;
        widget.layout = { ...saved.layout };
        widget.geometry = { ...saved.geometry };
        widget.settings = { ...saved.settings };
        widget.state = { ...saved.state };

        if (typeof widget.setSize === 'function') {
            widget.setSize(saved.size);
        }
        if (typeof widget.setVariant === 'function') {
            widget.setVariant(saved.variant);
        }
        if (typeof widget.setStyle === 'function') {
            widget.setStyle(saved.style);
        }

        canvas.updateWidgetLayout(widget);
        if (widget.element) {
            widget.render();
        }
    });

    currentLayoutState = layoutState;
    if (window.cherryApp) {
        window.cherryApp.layoutState = currentLayoutState;
    }
}


// =====================================================
// CREAR CANVAS
// =====================================================

const canvas = new Canvas({
    width: 480,
    height: 1920,
    columns: 4,
    rows: 16,
    gap: 12
});


// =====================================================
// CREAR WIDGETS
// =====================================================

const clock = new ClockWidget({
    size: "medium",
    style: "onlyclock",
    variant: "translucid",
    layout: {
        column: 0,
        row: 0,
    }
});


const media = new MediaWidget({
    size: "large",
    style: "artworkProtagonist",
    layout: {
        row: 2,
    }
});


const system = new SystemWidget({
    size: "cardhorizontal",
    style: "circular",
    layout: {
        row: 9,
    }
});


const controls = new ControlsWidget({
    size: "mini",
    style: "buttons",
    layout: {
        row: 6,
    }
});

const mediaVisual = new MediaVisualWidget({
    size: "medium",
    style: "visualizer",
    layout: {
        column: 0,
        row: 11,
    },

});

const text = new TextWidget({
    size: "small",
    layout: {
        column: 2,
        row: 14,
    }
});

const wifi1 =
    new ToggleWidget({
        id: "wifi",
        label: "Wi-Fi",
        style: "widget",
        size: "small",
        layout: {
            column: 2,
            row: 6
        }
    });

const wifi2 =
    new ToggleWidget({
        id: "bluetooth",
        label: "Bluetooth",
        style: "widget",
        size: "medium",
        layout: {
            column: 2,
            row: 7
        }
    });

const sliderA  =
    new SliderWidget({

        id: "volume-slider-a",
        style: "bar",
        size: "mini",
        layout: {
            row: 8
        },

        control: {

            id: "volume",

            label: "Volume",

            min: 0,
            max: 100,
            step: 1,
            value: 50

        }

    });


const sliderB =
    new SliderWidget({

        id: "brightness",

        size: "mini",

        layout: {
            column: 0,
            row: 14
        },

        control: {

            id: "brightness",

            label: "brightness",

            min: 0,
            max: 100,
            step: 1,
            value: 50

        }

    });


// =====================================================
// AGREGAR WIDGETS AL CANVAS
// =====================================================

canvas.addWidget(sliderA);
canvas.addWidget(sliderB);
canvas.addWidget(wifi1);
canvas.addWidget(wifi2);
canvas.addWidget(mediaVisual);
canvas.addWidget(clock);
canvas.addWidget(media);
canvas.addWidget(system);
canvas.addWidget(controls);
canvas.addWidget(text);

const savedLayout = loadSavedLayout();
if (savedLayout.length) {
    applySavedLayout(savedLayout);
} else {
    saveCurrentLayout();
}

// =====================================================
// CREAR BOTÓN DE ENTRADA AL EDITOR
// =====================================================

editorEntryButton = new EditorEntryButton(
    canvas.element,
    enterEditorMode
);


// =====================================================
// FUNCIÓN: ENTRAR AL MODO EDITOR
// =====================================================

function enterEditorMode() {

    if (editorMode) return;

    console.log('✓ Entering editor mode...');

    editorMode = true;

    // Inicializar editor
    editor = initializeEditor(canvas, {});

    // Ocultar botón de entrada
    editorEntryButton.hide();

    // Exponer editor en window para debugging
    window.cherryEditor = editor;

    console.log('✓ Editor mode active');
}


// =====================================================
// FUNCIÓN: SALIR DEL MODO EDITOR
// =====================================================

function restoreCanvasToPage() {
    if (!canvas || !canvas.element) return;

    let mainCanvas = document.querySelector('main#cherry-canvas');
    if (!mainCanvas) {
        mainCanvas = document.createElement('main');
        mainCanvas.id = 'cherry-canvas';
        document.body.appendChild(mainCanvas);
    }

    mainCanvas.style.position = 'relative';

    if (canvas.element.parentNode !== mainCanvas) {
        mainCanvas.innerHTML = '';
        mainCanvas.appendChild(canvas.element);
    }

    if (!editorEntryButton || !editorEntryButton.button || !editorEntryButton.button.isConnected) {
        editorEntryButton = new EditorEntryButton(canvas.element, enterEditorMode);
    } else if (editorEntryButton.button.parentNode !== mainCanvas) {
        mainCanvas.appendChild(editorEntryButton.button);
    }

    editorEntryButton.show();
    canvas.element.style.display = 'block';

    canvas.widgets.forEach(widget => {
        if (widget && typeof widget.render === 'function') {
            widget.render();
        }
    });
}

function exitEditorMode() {

    if (!editorMode || !editor) return;

    console.log('✓ Exiting editor mode...');

    saveCurrentLayout();
    editorMode = false;

    // Destruir editor y restaurar canvas visible
    const editorContainer = document.getElementById('cherry-editor');
    if (editorContainer && editorContainer.parentNode) {
        editorContainer.remove();
    }

    restoreCanvasToPage();

    editor = null;
    window.cherryEditor = null;

    // Mostrar botón de entrada
    editorEntryButton.show();

    console.log('✓ Back to normal mode');
}


// =====================================================
// EXPOSER FUNCIONES GLOBALES PARA DEBUGGING
// =====================================================

window.cherryApp = {
    canvas,
    layoutState: currentLayoutState,
    saveLayout: saveCurrentLayout,
    restoreLayout: () => {
        const saved = loadSavedLayout();
        if (!saved.length) return;
        applySavedLayout(saved);
    },
    enterEditor: enterEditorMode,
    exitEditor: exitEditorMode,
    isEditing: () => editorMode
};