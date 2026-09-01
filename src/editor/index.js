/* =========================================================
   CHERRY EDITOR — INITIALIZATION
   Punto de entrada del editor
   ========================================================= */

import { Editor } from './Editor.js';

export function initializeEditor(canvas, options = {}) {

    const editor = new Editor(canvas, options);

    console.log('✓ Cherry Editor started');

    return editor;
}

export { Editor } from './Editor.js';
export { EditorState } from './EditorState.js';
export { OverlayManager } from './managers/OverlayManager.js';
export { SelectionManager } from './managers/SelectionManager.js';
export { CanvasAdapter } from './CanvasAdapter.js';
export { EditorHistory } from './managers/EditorHistory.js';
export { SnapManager } from './managers/SnapManager.js';
export { PreviewManager } from './managers/PreviewManager.js';
export { EditorEntryButton } from './ui/EditorEntryButton.js';
