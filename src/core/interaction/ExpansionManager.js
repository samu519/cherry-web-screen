import { OverlayManager } from "./OverlayManager.js";
import { ExpandablePanel } from "./ExpandablePanel.js";

export class ExpansionManager {

    constructor({
        root = document.body,
        threshold = 500,
        animationDuration = 250
    } = {}) {

        this.root = root || document.body;

        this.threshold = threshold;
        this.animationDuration = animationDuration;

        this.isExpanded = false;
        this.expandedControlId = null;
        this.expandedElement = null;

        this.activePanel = null;
        this.activeOverlay = null;

        this.handlers = new Map();

        this.overlayManager =
            new OverlayManager(this.root);

        this.panel =
            new ExpandablePanel({
                root: this.root,
                overlayManager: this.overlayManager,
                animationDuration: this.animationDuration
            });

        this.pressTimer = null;
        this.activePress = null;

        /*
         * Elemento cuyo siguiente click debe ignorarse
         * porque acaba de producir un long press.
         */
        this.suppressClickTarget = null;

        this._handleDocumentClick =
            this._handleDocumentClick.bind(this);

        document.addEventListener(
            "click",
            this._handleDocumentClick,
            true
        );
    }


    // =========================================================
    // REGISTER
    // =========================================================

    register(element, config = {}) {
        console.log(
        "[ExpansionManager] Registrando:",
        config.id,
        element
    );

        if (!element) {
            return null;
        }

        const payload = {
            element,
            id: config.id ?? element.dataset.control,
            label: config.label ?? "",
            getContent:
                typeof config.getContent === "function"
                    ? config.getContent
                    : () => null,
            onAction:
                typeof config.onAction === "function"
                    ? config.onAction
                    : null,
            threshold:
                config.threshold ?? this.threshold
        };

        /*
         * Si este elemento ya estaba registrado,
         * quitamos sus listeners anteriores.
         */
        this.unregister(element);

        this.handlers.set(
            payload.id,
            payload
        );

        const pointerDown = event => {

            console.log(
        "[ExpansionManager] Registrando:",
        config.id,
        element
    );
            if (
                event.button !== undefined &&
                event.button !== 0
            ) {
                return;
            }

            this._startPress(
                element,
                payload,
                event
            );
        };

        const pointerMove = event => {

            const press = this.activePress;

            if (!press) {
                return;
            }

            if (press.element !== element) {
                return;
            }

            const deltaX =
                event.clientX - press.startX;

            const deltaY =
                event.clientY - press.startY;

            const distance =
                Math.sqrt(
                    deltaX * deltaX +
                    deltaY * deltaY
                );

            /*
             * Si el usuario mueve demasiado el dedo/mouse,
             * dejamos de considerar esto un long press.
             */
            if (distance > 12) {
                this._cancelPress();
            }
        };

        const pointerUp = () => {

            this._finishPress(element);
        };

        const pointerCancel = () => {

            this._cancelPress();
        };

        element.addEventListener(
            "pointerdown",
            pointerDown
        );

        element.addEventListener(
            "pointermove",
            pointerMove
        );

        element.addEventListener(
            "pointerup",
            pointerUp
        );

        element.addEventListener(
            "pointercancel",
            pointerCancel
        );

        element.__cherryExpansionHandlers = {
            pointerDown,
            pointerMove,
            pointerUp,
            pointerCancel
        };

        return payload;
    }


    // =========================================================
    // UNREGISTER
    // =========================================================

    unregister(element) {

        if (!element) {
            return;
        }

        const handlers =
            element.__cherryExpansionHandlers;

        if (!handlers) {
            return;
        }

        element.removeEventListener(
            "pointerdown",
            handlers.pointerDown
        );

        element.removeEventListener(
            "pointermove",
            handlers.pointerMove
        );

        element.removeEventListener(
            "pointerup",
            handlers.pointerUp
        );

        element.removeEventListener(
            "pointercancel",
            handlers.pointerCancel
        );

        delete element.__cherryExpansionHandlers;
    }


    // =========================================================
    // START PRESS
    // =========================================================

    _startPress(element, payload, event) {

    console.log(
        "[ExpansionManager] Iniciando press:",
        payload.id
    );

    this._cancelPress();

    this.activePress = {
        element,
        payload,
        startX: event.clientX,
        startY: event.clientY,
        startedAt: Date.now(),
        triggered: false
    };

    this.pressTimer = setTimeout(() => {

        console.log(
            "[ExpansionManager] LONG PRESS DETECTADO:",
            payload.id
        );

        if (!this.activePress) {
            console.log(
                "[ExpansionManager] No hay activePress"
            );
            return;
        }

        if (
            this.activePress.element !== element
        ) {
            console.log(
                "[ExpansionManager] El elemento cambió"
            );
            return;
        }

        this.activePress.triggered = true;

        
        this.suppressNextClick = true;

        console.log(
            "[ExpansionManager] LONG PRESS CONFIRMADO:",
            payload.id
        );

        this._expand(payload);

    }, payload.threshold);
}


    // =========================================================
    // FINISH PRESS
    // =========================================================

    _finishPress(element) {

    if (!this.activePress) {
        return;
    }

    if (
        this.activePress.element !== element
    ) {
        return;
    }

    const wasTriggered =
        this.activePress.triggered;

    this._clearPressTimer();

    /*
     * Si el long press ya ocurrió,
     * mantenemos la protección contra el click
     * que pueda llegar inmediatamente después.
     */
    if (wasTriggered) {

        console.log(
            "[ExpansionManager] Long press terminado:",
            this.activePress.payload.id
        );

        this.activePress = null;

        return;
    }

    /*
     * Fue solamente un tap.
     */
    console.log(
        "[ExpansionManager] Press cancelado antes del threshold"
    );

    this.activePress = null;
}


    // =========================================================
    // CANCEL PRESS
    // =========================================================

    _cancelPress() {

        this._clearPressTimer();

        this.activePress = null;
    }


    // =========================================================
    // CLEAR TIMER
    // =========================================================

    _clearPressTimer() {

        if (this.pressTimer) {

            clearTimeout(
                this.pressTimer
            );

            this.pressTimer = null;
        }
    }


    // =========================================================
    // EXPAND
    // =========================================================

    _expand(payload) {

        if (!payload) {
            return;
        }

        if (
            this.isExpanded &&
            this.expandedControlId === payload.id
        ) {
            return;
        }

        /*
         * Si otro control estaba expandido,
         * lo cerramos primero.
         */
        if (this.isExpanded) {
            this.collapse();
        }

        this.isExpanded = true;
        this.expandedControlId = payload.id;
        this.expandedElement = payload.element;

        let content = null;

        try {

            content =
                payload.getContent({
                    controlId: payload.id,
                    controlLabel: payload.label
                });

        } catch (error) {

            console.error(
                "Cherry ExpansionManager: error creando contenido:",
                error
            );

            content = {
                title: payload.label,
                items: []
            };
        }

        this.panel.open({

            id: payload.id,

            label: payload.label,

            content,

            element: payload.element,

            container: this.root,

            onAction: payload.onAction,

            onClose: () => {

                this.isExpanded = false;
                this.expandedControlId = null;
                this.expandedElement = null;
            }
        });

        this.activePanel = this.panel;

    }


    // =========================================================
    // DOCUMENT CLICK
    // =========================================================

    _handleDocumentClick(event) {

        console.log(
            "[ExpansionManager] CLICK DOCUMENT:",
            event.target
        );


        // =========================================================
        // 1. CONSUMIR CLICK POST-LONG-PRESS
        // =========================================================

        if (this.suppressNextClick) {

            console.log(
                "[ExpansionManager] Click consumido después de long press"
            );

            this.suppressNextClick = false;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            return;
        }


        // =========================================================
        // 2. SI NO HAY EXPANSIÓN, NO HACER NADA
        // =========================================================

        if (!this.isExpanded) {
            return;
        }


        // =========================================================
        // 3. DETECTAR CLICK DENTRO DEL PANEL
        // =========================================================

        const panelElement =
            this.panel?.panelElement;

        const expandedElement =
            this.expandedElement;

        const clickedInsidePanel =
            panelElement &&
            (
                event.target === panelElement ||
                panelElement.contains(event.target)
            );

        const clickedExpandedControl =
            expandedElement &&
            (
                event.target === expandedElement ||
                expandedElement.contains(event.target)
            );


        // =========================================================
        // 4. CLICK FUERA → CERRAR
        // =========================================================

        if (
            !clickedInsidePanel &&
            !clickedExpandedControl
        ) {

            console.log(
                "[ExpansionManager] Click fuera → collapse"
            );

            this.collapse();
        }
    }


    // =========================================================
    // COLLAPSE
    // =========================================================

    collapse() {

        if (!this.isExpanded) {
            return;
        }

        this.isExpanded = false;
        this.expandedControlId = null;
        this.expandedElement = null;

        this.suppressNextClick = false;

        this.panel.close();

        this.activePanel = null;
        this.activeOverlay = null;
    }


    // =========================================================
    // TOGGLE
    // =========================================================

    toggle(elementOrId) {

        let id = null;

        if (typeof elementOrId === "string") {
            id = elementOrId;
        } else if (elementOrId) {
            id =
                elementOrId.dataset.control;
        }

        if (!id) {
            return;
        }

        if (
            this.isExpanded &&
            this.expandedControlId === id
        ) {
            this.collapse();
            return;
        }

        const payload =
            this.handlers.get(id);

        if (!payload) {
            return;
        }

        this._expand(payload);
    }


    // =========================================================
    // IS CONTROL EXPANDED
    // =========================================================

    isControlExpanded(controlId) {

        return (
            this.isExpanded &&
            this.expandedControlId === controlId
        );
    }


    // =========================================================
    // DESTROY
    // =========================================================

    destroy() {

        this._cancelPress();

        document.removeEventListener(
            "click",
            this._handleDocumentClick,
            true
        );

        this.handlers.forEach(
            payload => {
                this.unregister(
                    payload.element
                );
            }
        );

        this.handlers.clear();

        this.collapse();

        if (this.overlayManager) {
            this.overlayManager.close();
        }
    }
}