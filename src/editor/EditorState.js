/* =========================================================
   CHERRY EDITOR — STATE MANAGER
   Gestiona el estado global del editor
   ========================================================= */

export class EditorState {

    constructor() {

        /* -------------------------------------------------
           MODO DEL EDITOR
           ------------------------------------------------- */

        this.mode = "edit"; // "edit" | "preview"


        /* -------------------------------------------------
           SELECCIÓN
           ------------------------------------------------- */

        this.selectedWidgets = []; // Array de IDs
        this.focusedWidget = null; // ID del widget enfocado


        /* -------------------------------------------------
           ZOOM Y PAN
           ------------------------------------------------- */

        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;


        /* -------------------------------------------------
           HERRAMIENTAS
           ------------------------------------------------- */

        this.gridVisible = true;
        this.snapEnabled = true;
        this.guidesVisible = false;
        this.distancesVisible = false;


        /* -------------------------------------------------
           APARIENCIA GLOBAL
           ------------------------------------------------- */

        this.accentColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--cherry-accent')
            .trim();

        this.themeMode = document.documentElement.getAttribute('data-theme') || 'dark';


        /* -------------------------------------------------
           LISTENERS
           ------------------------------------------------- */

        this.listeners = [];
    }


    /* =====================================================
       OBSERVABLES
       ===================================================== */

    subscribe(callback) {

        this.listeners.push(callback);

        return () => {
            this.listeners = this.listeners.filter(c => c !== callback);
        };
    }


    notify() {

        this.listeners.forEach(callback => callback(this));
    }


    /* =====================================================
       SELECCIÓN
       ===================================================== */

    selectWidget(widgetId, multiSelect = false) {

        if (!multiSelect) {
            this.selectedWidgets = [widgetId];
        } else {
            if (this.selectedWidgets.includes(widgetId)) {
                this.selectedWidgets = this.selectedWidgets.filter(id => id !== widgetId);
            } else {
                this.selectedWidgets.push(widgetId);
            }
        }

        this.focusedWidget = widgetId;
        this.notify();
    }


    clearSelection() {

        this.selectedWidgets = [];
        this.focusedWidget = null;
        this.notify();
    }


    getSelectedCount() {

        return this.selectedWidgets.length;
    }


    isSingleSelected() {

        return this.selectedWidgets.length === 1;
    }


    isMultiSelected() {

        return this.selectedWidgets.length > 1;
    }


    /* =====================================================
       MODO
       ===================================================== */

    setMode(mode) {

        if (['edit', 'preview'].includes(mode)) {
            this.mode = mode;
            this.notify();
        }
    }


    /* =====================================================
       ZOOM Y PAN
       ===================================================== */

    setZoom(zoom) {

        this.zoom = Math.max(0.5, Math.min(2, zoom));
        this.notify();
    }


    setPan(x, y) {

        this.panX = x;
        this.panY = y;
        this.notify();
    }


    resetView() {

        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.notify();
    }


    /* =====================================================
       HERRAMIENTAS
       ===================================================== */

    toggleGrid() {

        this.gridVisible = !this.gridVisible;
        this.notify();
    }


    toggleSnap() {

        this.snapEnabled = !this.snapEnabled;
        this.notify();
    }


    toggleGuides() {

        this.guidesVisible = !this.guidesVisible;
        this.notify();
    }


    /* =====================================================
       APARIENCIA
       ===================================================== */

    setAccentColor(color) {

        this.accentColor = color;
        document.documentElement.style.setProperty('--cherry-accent', color);
        this.notify();
    }


    setThemeMode(mode) {

        if (['light', 'dark'].includes(mode)) {
            this.themeMode = mode;
            document.documentElement.setAttribute('data-theme', mode);
            this.notify();
        }
    }


    toggleThemeMode() {

        this.setThemeMode(this.themeMode === 'dark' ? 'light' : 'dark');
    }


    getState() {

        return {
            mode: this.mode,
            selectedWidgets: [...this.selectedWidgets],
            focusedWidget: this.focusedWidget,
            zoom: this.zoom,
            panX: this.panX,
            panY: this.panY,
            gridVisible: this.gridVisible,
            snapEnabled: this.snapEnabled,
            guidesVisible: this.guidesVisible,
            accentColor: this.accentColor,
            themeMode: this.themeMode
        };
    }
}
