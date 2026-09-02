import { Canvas } from "../core/canvas/canvas.js";
import { initializeEditor } from "../editor/index.js";
import { EditorEntryButton } from "../editor/ui/EditorEntryButton.js";

import { ClockWidget }
    from "../widgets/clock/clockwidget.js";

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

import { ToggleWidget }
    from "../widgets/controls/togglewidget.js";

import { SliderWidget }
    from "../widgets/controls/sliderwidget.js";

import {
    linkLayoutFile,
    reconnectWithPermission,
    tryReconnect,
    readLayoutFile,
    writeLayoutFile,
    isFileStorageSupported,
    hasLinkedFile
} from "../core/storage/layoutFileStorage.js";


// =====================================================
// ESTADO DEL EDITOR
// =====================================================

let editorMode = false;
let editor = null;
let editorEntryButton = null;
let currentLayoutState = [];
const LAYOUT_STORAGE_KEY = 'cherry-layout-state-v1';


// =====================================================
// GUARDAR LAYOUT (archivo real + respaldo localStorage)
// =====================================================
async function saveCurrentLayout() {

    console.log('[Cherry] saveCurrentLayout() llamado');

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

    console.log('[Cherry] layout capturado:', currentLayoutState);

    try {
        window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(currentLayoutState));
        console.log('[Cherry] ✅ respaldo guardado en localStorage');
    } catch (error) {
        console.warn('Cherry: no se pudo guardar el respaldo en localStorage', error);
    }

    console.log('[Cherry] intentando escribir en archivo...');
    const wrote = await writeLayoutFile(currentLayoutState);
    console.log('[Cherry] resultado de writeLayoutFile:', wrote);

    if (window.cherryApp) {
        window.cherryApp.layoutState = currentLayoutState;
        window.cherryApp.fileLinked = wrote;
    }

    return currentLayoutState;
}


// =====================================================
// CARGAR LAYOUT DESDE LOCALSTORAGE (fallback)
// =====================================================

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


// =====================================================
// APLICAR LAYOUT GUARDADO A LOS WIDGETS EXISTENTES
// =====================================================

function applySavedLayout(layoutState = []) {
    if (!Array.isArray(layoutState) || !layoutState.length) return;

    layoutState.forEach(saved => {
        const widget = canvas.widgets.find(item => item.id === saved.id);
        if (!widget) return;

        widget.size = saved.size;
        widget.variant = saved.variant;
        widget.style = saved.style;
        widget.layout = { ...saved.layout };
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

        // Restauramos la posición EXACTA en píxeles, sin recalcular
        // desde la grilla (eso descartaría los movimientos libres del editor).
        widget.setGeometry({ ...saved.geometry });

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
    id: "clock-main",
    size: "medium",
    style: "onlyclock",
    variant: "translucid",
    layout: {
        column: 0,
        row: 0,
    }
});


const media = new MediaWidget({
    id: "media-main",
    size: "large",
    style: "artworkProtagonist",
    layout: {
        row: 2,
    }
});


const system = new SystemWidget({
    id: "system-main",
    size: "cardhorizontal",
    style: "circular",
    layout: {
        row: 9,
    }
});


const controls = new ControlsWidget({
    id: "controls-main",
    size: "mini",
    style: "buttons",
    layout: {
        row: 6,
    }
});

const mediaVisual = new MediaVisualWidget({
    id: "media-visual-main",
    size: "medium",
    style: "visualizer",
    layout: {
        column: 0,
        row: 11,
    },

});

const text = new TextWidget({
    id: "text-main",
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

const sliderA =
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


// =====================================================
// BOOT: CARGAR LAYOUT GUARDADO (archivo o localStorage)
// =====================================================

    async function bootLayout() {

        console.log('[Cherry] bootLayout() iniciando...');

        let layout = null;

        const reconnected = await tryReconnect();
        console.log('[Cherry] tryReconnect() resultado:', reconnected);

        if (reconnected) {
            layout = await readLayoutFile();
            console.log('[Cherry] layout leído del archivo:', layout);
        }

        if (!layout || !layout.length) {
            console.log('[Cherry] archivo vacío/sin reconexión, usando fallback localStorage');
            layout = loadSavedLayout();
            console.log('[Cherry] layout desde localStorage:', layout);
        }

        if (layout && layout.length) {
            console.log('[Cherry] aplicando layout con', layout.length, 'widgets');
            applySavedLayout(layout);
        } else {
            console.log('[Cherry] ❌ no hay ningún layout disponible, guardando estado inicial');
            await saveCurrentLayout();
        }
    }

await bootLayout();


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

    editor = initializeEditor(canvas, {});

    editorEntryButton.hide();

    window.cherryEditor = editor;

    console.log('✓ Editor mode active');
}


    // =====================================================
    // FUNCIÓN: SALIR DEL MODO EDITOR
    // =====================================================

    function restoreCanvasToPage() {
        if (!canvas || !canvas.element) return;

        // El canvas ya fue reinsertado en su lugar original por Editor.exitEditor().
        // Solo nos aseguramos de que el botón de entrada exista y sea visible.
        canvas.element.style.display = 'block';

        if (!editorEntryButton || !editorEntryButton.button || !editorEntryButton.button.isConnected) {
            editorEntryButton = new EditorEntryButton(canvas.element, enterEditorMode);
        }

        editorEntryButton.show();

        canvas.widgets.forEach(widget => {
            if (widget && typeof widget.render === 'function') {
                widget.render();
            }
        });
    }

async function exitEditorMode() {

    if (!editorMode || !editor) return;

    console.log('✓ Exiting editor mode...');

    await saveCurrentLayout();
    editorMode = false;

    const editorContainer = document.getElementById('cherry-editor');
    if (editorContainer && editorContainer.parentNode) {
        editorContainer.remove();
    }

    restoreCanvasToPage();

    editor = null;
    window.cherryEditor = null;

    editorEntryButton.show();

    console.log('✓ Back to normal mode');
}


// =====================================================
// BOTÓN: VINCULAR ARCHIVO DE LAYOUT
// =====================================================

    function createLinkFileButton() {

        if (!isFileStorageSupported()) {
            console.warn('Cherry: este navegador no soporta guardar en archivo. Usa Chrome o Edge.');
            return;
        }

        const button = document.createElement('button');
        button.className = 'cherry-editor-entry-button';
        button.style.top = '56px';
        button.innerHTML = `
            <span class="cherry-editor-entry-button__icon">💾</span>
            <span class="cherry-editor-entry-button__label">Vincular archivo</span>
        `;

        const labelEl = () => button.querySelector('.cherry-editor-entry-button__label');

        const refreshState = async () => {

            const linked = await hasLinkedFile();

            if (!linked) {
                labelEl().textContent = 'Vincular archivo';
                button.title = 'Elegir o crear el archivo donde se guarda el layout';
                return 'none';
            }

            const silentlyOk = await tryReconnect();

            if (silentlyOk) {
                labelEl().textContent = 'Archivo vinculado ✓';
                button.title = 'El layout se guarda en tu archivo automáticamente';
                return 'granted';
            }

            labelEl().textContent = 'Reconectar archivo';
            button.title = 'Haz click para volver a dar permiso y cargar tus datos guardados';
            return 'needs-permission';
        };

        button.addEventListener('click', async () => {

            const linked = await hasLinkedFile();

            if (!linked) {
                const ok = await linkLayoutFile();
                if (ok) {
                    await saveCurrentLayout();
                }
                await refreshState();
                return;
            }

            // Ya hay un archivo vinculado, pero el permiso se perdió
            // (típico tras un reload) — este click SÍ cuenta como
            // "user activation", así que aquí sí podemos pedirlo.
            const { ok, layout } = await reconnectWithPermission();

            if (ok && layout && layout.length) {
                applySavedLayout(layout);
            }

            await refreshState();
        });

        canvas.element.parentNode.appendChild(button);
        refreshState();
    }

createLinkFileButton();


// =====================================================
// EXPONER FUNCIONES GLOBALES PARA DEBUGGING
// =====================================================

window.cherryApp = {
    canvas,
    layoutState: currentLayoutState,
    saveLayout: saveCurrentLayout,
    restoreLayout: async () => {
        const saved = loadSavedLayout();
        if (!saved.length) return;
        applySavedLayout(saved);
    },
    enterEditor: enterEditorMode,
    exitEditor: exitEditorMode,
    isEditing: () => editorMode
};