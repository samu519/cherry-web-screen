/* =========================================================
   CHERRY EDITOR — ENTRY BUTTON
   Botón para acceder al editor desde la interfaz normal
   ========================================================= */

export class EditorEntryButton {

    constructor(canvasElement, onEditClick) {

        this.canvas = canvasElement;
        this.onEditClick = onEditClick;
        this.button = null;

        this.create();
    }


    /* =====================================================
       CREAR BOTÓN
       ===================================================== */

    create() {

        this.button = document.createElement('button');
        this.button.className = 'cherry-editor-entry-button';
        this.button.innerHTML = `
            <span class="cherry-editor-entry-button__icon">✎</span>
            <span class="cherry-editor-entry-button__label">Editar</span>
        `;
        this.button.title = 'Abrir editor visual';

        this.button.addEventListener('click', () => {
            this.onEditClick();
        });

        // Posicionar en la esquina superior derecha del canvas
        this.canvas.parentNode.style.position = 'relative';
        this.canvas.parentNode.appendChild(this.button);
    }


    /* =====================================================
       MOSTRAR / OCULTAR
       ===================================================== */

    show() {
        this.button.style.display = 'flex';
    }

    hide() {
        this.button.style.display = 'none';
    }

    remove() {
        if (this.button && this.button.parentNode) {
            this.button.remove();
        }
    }
}
