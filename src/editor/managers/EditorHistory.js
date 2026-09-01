/* =========================================================
   CHERRY EDITOR — HISTORY MANAGER
   Sistema de Undo/Redo
   ========================================================= */

export class EditorHistory {

    constructor(maxStates = 50) {

        this.history = [];
        this.currentIndex = -1;
        this.maxStates = maxStates;
        this.listeners = [];
    }


    /* =====================================================
       SUBSCRIBE A CAMBIOS
       ===================================================== */

    subscribe(callback) {

        this.listeners.push(callback);

        return () => {
            this.listeners = this.listeners.filter(c => c !== callback);
        };
    }


    notify() {

        this.listeners.forEach(cb => cb({
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            current: this.currentIndex,
            total: this.history.length
        }));
    }


    /* =====================================================
       AGREGAR ESTADO AL HISTORIAL
       ===================================================== */

    addState(state, description = '') {

        const snapshot = JSON.parse(JSON.stringify(state));

        this.history = this.history.slice(0, this.currentIndex + 1);
        this.history.push({
            state: snapshot,
            description,
            timestamp: Date.now()
        });

        if (this.history.length > this.maxStates) {
            this.history.shift();
        }

        this.currentIndex = this.history.length - 1;
        this.notify();
    }


    /* =====================================================
       UNDO
       ===================================================== */

    undo() {

        if (!this.canUndo()) return null;

        this.currentIndex--;
        this.notify();

        return this.history[this.currentIndex].state;
    }


    /* =====================================================
       REDO
       ===================================================== */

    redo() {

        if (!this.canRedo()) return null;

        this.currentIndex++;
        this.notify();

        return this.history[this.currentIndex].state;
    }


    /* =====================================================
       VERIFICAR DISPONIBILIDAD
       ===================================================== */

    canUndo() {

        return this.currentIndex > 0;
    }


    canRedo() {

        return this.currentIndex < this.history.length - 1;
    }


    /* =====================================================
       OBTENER ESTADO ACTUAL
       ===================================================== */

    getCurrentState() {

        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            return this.history[this.currentIndex].state;
        }

        return null;
    }


    /* =====================================================
       LIMPIAR HISTORIAL
       ===================================================== */

    clear() {

        this.history = [];
        this.currentIndex = -1;
        this.notify();
    }


    /* =====================================================
       OBTENER INFORMACIÓN
       ===================================================== */

    getInfo() {

        return {
            total: this.history.length,
            current: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            history: this.history.map(item => ({
                description: item.description,
                timestamp: item.timestamp
            }))
        };
    }
}
