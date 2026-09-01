/* =========================================================
   CHERRY EDITOR — PREVIEW MANAGER
   Maneja el modo preview
   ========================================================= */

export class PreviewManager {

    constructor(editorState, editorContainer) {

        this.state = editorState;
        this.container = editorContainer;
        this.previousMode = null;
    }


    /* =====================================================
       ACTIVAR PREVIEW
       ===================================================== */

    enterPreview() {

        this.previousMode = this.state.mode;

        this.state.subscribe((state) => {
            if (state.mode === 'preview') {
                this.applyPreviewMode();
            } else {
                this.exitPreview();
            }
        });

        this.applyPreviewMode();
    }


    /* =====================================================
       APLICAR ESTILOS DE PREVIEW
       ===================================================== */

    applyPreviewMode() {

        // Crear botón de salida rápida
        const exitButton = document.createElement('button');
        exitButton.className = 'cherry-preview-exit';
        exitButton.textContent = '← Volver al editor';
        exitButton.addEventListener('click', () => {
            this.state.setMode('edit');
        });

        document.body.appendChild(exitButton);

        // Agregar clase
        this.container.classList.add('cherry-editor--preview');
    }


    /* =====================================================
       SALIR DE PREVIEW
       ===================================================== */

    exitPreview() {

        this.container.classList.remove('cherry-editor--preview');

        // Remover botón de salida
        const exitBtn = document.querySelector('.cherry-preview-exit');
        if (exitBtn) {
            exitBtn.remove();
        }
    }


    /* =====================================================
       OBTENER INFORMACIÓN
       ===================================================== */

    getPreviewData() {

        return {
            mode: this.state.mode,
            zoom: this.state.zoom,
            canvasVisible: this.container.querySelector('#cherry-canvas') !== null
        };
    }
}
