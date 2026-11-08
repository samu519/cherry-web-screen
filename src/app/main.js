import { Canvas } from '../core/canvas/canvas.js';
import { nativeService } from '../services/nativeService.js';
import { initializeEditor } from '../editor/index.js';
import { EditorEntryButton } from '../editor/ui/EditorEntryButton.js';
import { LayoutControls } from '../editor/ui/LayoutControls.js';
import { captureLayout, restoreLayout } from '../core/storage/layoutRuntime.js';
import { parseLayoutDocument } from '../core/storage/layoutDocument.js';
import { LayoutRepository, BACKUP_KEY, RECOVERY_KEY } from '../core/storage/layoutRepository.js';
import { createLayoutPreset } from '../core/layouts/layoutPresets.js';
import { changeDocumentProfile } from '../core/layouts/displayProfiles.js';
import { Grid } from '../core/layouts/grid.js';
import { linkLayoutFile, reconnectWithPermission, tryReconnect, readLayoutFile,
    writeLayoutFile, isFileStorageSupported } from '../core/storage/layoutFileStorage.js';

const canvas = new Canvas({ width: 480, height: 1920, columns: 4, rows: 16, gap: 12 });
let storage;
try { storage = window.localStorage; } catch { /* Export remains available without browser storage. */ }
const repository = new LayoutRepository(storage);
let editor = null;
let fileSyncEnabled = false;
let fileWrites = Promise.resolve();
let statusTimer;
const status = document.createElement('div');
status.className = 'cherry-layout-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
status.hidden = true; document.body.appendChild(status);
function notify(message, error = false) {
    clearTimeout(statusTimer); status.textContent = message; status.hidden = false;
    status.dataset.error = String(error);
    statusTimer = setTimeout(() => { status.hidden = true; }, 7000);
}

async function saveCurrentLayout() {
    const document = captureLayout(canvas);
    try { repository.save(document); }
    catch (error) { notify(`No se pudo guardar en el navegador: ${error.message}`, true); }
    if (window.cherryApp) window.cherryApp.layoutState = document.widgets;
    if (fileSyncEnabled) {
        fileWrites = fileWrites.catch(() => false).then(() => writeLayoutFile(document));
        if (!await fileWrites) notify('Guardado en el navegador. El archivo vinculado no se pudo actualizar.', true);
    }
    return document;
}

const fallback = createLayoutPreset();
let loaded = repository.load(fallback);
if (await tryReconnect()) {
    try {
        const file = await readLayoutFile();
        if (!file) throw new Error('El archivo vinculado está vacío o no contiene JSON válido.');
        loaded = { document: parseLayoutDocument(file), source: 'file' };
        fileSyncEnabled = true;
    } catch (error) { notify(`${error.message} Se abrió la copia del navegador.`, true); }
}
restoreLayout(canvas, loaded.document);
if (loaded.source === 'backup' || loaded.source === 'recovered-default') notify('El layout guardado no era válido. Se abrió una copia recuperada; el documento rechazado se conserva.', true);
try { repository.save(captureLayout(canvas)); } catch { notify('Sin almacenamiento local. Exporta tu layout para conservarlo.', true); }

const entry = new EditorEntryButton(canvas.element, enterEditorMode);
function enterEditorMode() {
    if (editor) return;
    setDisplayMode(false);
    editor = initializeEditor(canvas, {});
    entry.hide(); window.cherryEditor = editor;
}
// Called by Editor after it restores the canvas and removes its listeners.
async function finishEditorExit() {
    editor = null; window.cherryEditor = null;
    canvas.element.style.display = 'block'; entry.show();
    canvas.element.style.transform = '';
    canvas.element.style.transformOrigin = '';
    canvas.element.style.transition = '';
    await saveCurrentLayout();
}
async function applyDocument(input) {
    const document = parseLayoutDocument(input); // Validate before touching the live dashboard.
    const editing = Boolean(editor);
    if (editor) await editor.exitEditor();
    restoreLayout(canvas, document);
    await saveCurrentLayout();
    if (editing) enterEditorMode();
    return document;
}
function download(text, name) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
    anchor.hidden = true; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function setDisplayMode(clean) {
    if (clean && editor) await editor.exitEditor();
    document.body.dataset.displayMode = clean ? 'clean' : 'dashboard';
    const url = new URL(location.href);
    if (clean) url.searchParams.set('display', '1'); else url.searchParams.delete('display');
    history.replaceState(null, '', url);
}
const displayExit = document.createElement('button'); displayExit.type = 'button';
displayExit.className = 'cherry-display-exit'; displayExit.textContent = 'Mostrar controles';
displayExit.setAttribute('aria-label', 'Salir del modo pantalla y mostrar controles');
displayExit.addEventListener('click', () => setDisplayMode(false)); document.body.appendChild(displayExit);
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.dataset.displayMode === 'clean') setDisplayMode(false);
});

const app = {
    canvas, layoutState: loaded.document.widgets,
    saveLayout: saveCurrentLayout, getDocument: () => captureLayout(canvas),
    restoreLayout: () => applyDocument(repository.load(fallback).document),
    enterEditor: enterEditorMode, exitEditor: finishEditorExit, isEditing: () => Boolean(editor),
    notify, setDisplayMode,
    async importLayout(input) { await applyDocument(input); notify('Layout importado y guardado.'); },
    exportLayout() { download(JSON.stringify(captureLayout(canvas), null, 2), 'cherry-layout.json'); },
    async recoverLayout() { const backup = repository.backup(); await applyDocument(backup); notify('Copia anterior recuperada.'); },
    hasBackup: () => repository.read(BACKUP_KEY) !== null,
    hasRejected: () => repository.read(RECOVERY_KEY) !== null,
    exportRejected() { download(repository.read(RECOVERY_KEY), 'cherry-documento-rechazado.json'); },
    async setProfile(profile) { await applyDocument(changeDocumentProfile(captureLayout(canvas), profile)); notify(`Perfil aplicado: ${profile.name}`); },
    async setLayoutMode(mode) {
        const document = captureLayout(canvas); document.layoutMode = mode;
        if (mode === 'grid') {
            const grid = new Grid(document.profile);
            document.widgets.forEach(widget => { widget.layout = grid.getLayoutFromGeometry(widget.geometry); widget.geometry = grid.getGeometry(widget.layout); });
        }
        await applyDocument(document); notify(mode === 'grid' ? 'Grid activo: mover y redimensionar ajusta a celdas.' : 'Modo libre activo.');
    },
    async applyPreset(name) { await applyDocument(createLayoutPreset(name, captureLayout(canvas))); notify('Preset aplicado. La copia anterior está disponible en recuperación.'); },
    async showWidget(id) {
        const document = captureLayout(canvas); const widget = document.widgets.find(item => item.id === id);
        if (widget) { widget.flags.hidden = false; await applyDocument(document); }
    },
    supportsLinkedFile: isFileStorageSupported,
    async linkFile() {
        if (await linkLayoutFile()) {
            fileSyncEnabled = true; await saveCurrentLayout();
            if (await fileWrites) notify('Archivo vinculado y actualizado.');
        }
    },
    async reconnectFile() {
        const { ok, layout } = await reconnectWithPermission();
        if (!ok) throw new Error('No se pudo abrir el archivo vinculado.');
        const document = parseLayoutDocument(layout);
        fileSyncEnabled = false;
        await applyDocument(document);
        fileSyncEnabled = true; await saveCurrentLayout();
        if (await fileWrites) notify('Archivo vinculado cargado y actualizado.');
    }
};
window.cherryApp = app;
app.native = nativeService;
nativeService.onError = message => notify(message, true);
nativeService.start();
const controls = new LayoutControls(app);
app.openLayouts = anchor => controls.open(anchor);
setDisplayMode(new URL(location.href).searchParams.get('display') === '1');
