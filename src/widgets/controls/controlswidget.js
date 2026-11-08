import { nativeService } from '../../services/nativeService.js';
import { Widget } from "../../core/widgets/widget.js";
import { ExpansionManager } from "../../core/interaction/ExpansionManager.js";
import { appState } from "../../core/state/appState.js";
import { setControlIcon } from '../../core/interaction/controlIcon.js';

export class ControlsWidget extends Widget {

    constructor(config = {}) {

        super({
            ...config,
            type: "controls"
        });

        this.expansionManager = null;


        // =====================================================
        // SETTINGS
        // =====================================================

        this.settings = {

            sizePreset: "medium",

            style: "buttons",

            ...this.settings,

            ...(config.style && {
                style: config.style
            })

        };


        // =====================================================
        // STATE
        // =====================================================

        this.state = {

            controls: [
                {
                    type: "toggle",
                    id: "wifi",
                    label: "Wi-Fi",
                    value: true,
                    visible: true,
                    span: 1,
                    expandable: true
                },
                {
                    type: "toggle",
                    id: "bluetooth",
                    label: "Bluetooth",
                    value: true,
                    visible: true,
                    span: 1,
                    expandable: true
                },
                {
                    type: "toggle",
                    id: "darkMode",
                    label: "Dark Mode",
                    value: false,
                    visible: true,
                    span: 1,
                    expandable: true
                },
                {
                    type: "toggle",
                    id: "colorMode",
                    label: "Color Mode",
                    value: true,
                    visible: true,
                    span: 1,
                    expandable: true
                },
                {
                    type: "toggle",
                    id: "doNotDisturb",
                    label: "Do Not Disturb",
                    value: false,
                    visible: true,
                    span: 1,
                    expandable: true
                },

                {
                    type: "slider",
                    id: "brightness",
                    label: "Brightness",
                    value: 72,
                    min: 0,
                    max: 100,
                    visible: true,
                    span: 2
                },
                {
                    type: "slider",
                    id: "volume",
                    label: "Volume",
                    value: 58,
                    min: 0,
                    max: 100,
                    visible: true,
                    span: 2
                },
                {
                    type: "slider",
                    id: "microphone",
                    label: "Microphone",
                    value: 80,
                    min: 0,
                    max: 100,
                    visible: true,
                    span: 2
                }
            ],

            ...this.state

        };


        // =====================================================
        // SIZE PRESETS
        // =====================================================

    this.sizePresets = {
        mini: {
            columns: 2,
            rows: 2,

            buttonColumns: 2,

            capacity: {
                toggles: 3,
                sliders: 0
            }
        },

        small: {
            columns: 2,
            rows: 3,

            buttonColumns: 2,

            capacity: {
                toggles: 3,
                sliders: 1
            }
        },

        medium: {
            columns: 4,
            rows: 3,

            buttonColumns: 3,

            capacity: {
                toggles: 8,
                sliders: 1
            }
        },

        card: {
            columns: 2,
            rows: 4,

            buttonColumns: 3,

            capacity: {
                toggles: 5,
                sliders: 1
            }
        },

        large: {
            columns: 4,
            rows: 5,

            buttonColumns: 4,

            capacity: {
                toggles: 7,
                sliders: 3
            }
        },

        giant: {
            columns: 4,
            rows: 7,

            buttonColumns: 5,

            capacity: {
                toggles: 14,
                sliders: 3
            }
        }

        };


        // =====================================================
        // STYLES
        // =====================================================

        this.styles = {

            buttons: {
                name: "Buttons"
            },

            compact: {
                name: "Compact"
            }

        };


        // =====================================================
        // APPLY SIZE
        // =====================================================

        const selectedSize =
            config.size ?? "medium";

        const sizeConfig =
            this.sizePresets[selectedSize];

        if (sizeConfig) {

            this.settings.sizePreset =
                selectedSize;

            this.setLayout({

                columns:
                    sizeConfig.columns,

                rows:
                    sizeConfig.rows,

                ...config.layout

            });

        }

    }


    // =========================================================
    // CREATE ELEMENT
    // =========================================================

    createElement() {

        const element =
            super.createElement();

        element.classList.add(
            "cherry-controls"
        );

        this.expansionManager =
            new ExpansionManager({
                root: document.getElementById('cherry-canvas') || document.body,
                threshold: 500,
                animationDuration: 250
            });

        return element;
    }


    // =========================================================
    // SET SIZE
    // =========================================================

    setSizePreset(size) {

        const sizeConfig =
            this.sizePresets[size];

        if (!sizeConfig) {

            console.warn(
                `ControlsWidget: size "${size}" no está definido.`
            );

            return false;

        }

        this.settings.sizePreset =
            size;

        this.setLayout({

            columns:
                sizeConfig.columns,

            rows:
                sizeConfig.rows

        });

        this.updateAttributes();

        this.render();

        return true;

    }


    // =========================================================
    // SET STYLE
    // =========================================================

    setStyle(style) {

        if (!this.styles[style]) {

            console.warn(
                `ControlsWidget: style "${style}" no está definido.`
            );

            return false;

        }

        this.settings.style =
            style;

        this.updateAttributes();

        this.render();

        return true;

    }


    // =========================================================
    // UPDATE ATTRIBUTES
    // =========================================================

    updateAttributes() {

        if (!this.element) {
            return;
        }

        this.element.dataset.size =
            this.settings.sizePreset;

        this.element.dataset.style =
            this.settings.style;

    }


    // =========================================================
    // GET SIZE CONFIG
    // =========================================================

    getSizeConfig() {

        return (
            this.sizePresets[
                this.settings.sizePreset
            ] ??
            this.sizePresets.medium
        );

    }


    // =========================================================
    // GET CONTROL SPAN
    // =========================================================

    getControlSpan(control) {

        if (!control) {
            return 1;
        }

        if (control.type === "slider") {

            return control.span ?? 2;

        }

        return 1;

    }

    // =========================================================
    // GET VISIBLE CONTROLS
    // =========================================================
    getVisibleControls() {

        const size =
            this.sizePresets[
                this.settings.sizePreset
            ];

        if (!size || !size.capacity) {

            return {
                toggles: [],
                sliders: [],
                hasMore: false
            };

        }


        // =====================================================
        // ALL VISIBLE
        // =====================================================

        const toggles =
            this.state.controls.filter(
                control =>
                    control.type === "toggle" &&
                    control.visible !== false
            );


        const sliders =
            this.state.controls.filter(
                control =>
                    control.type === "slider" &&
                    control.visible !== false
            );


        // =====================================================
        // CAPACITY
        // =====================================================

        const visibleToggles =
            toggles.slice(
                0,
                size.capacity.toggles
            );


        const visibleSliders =
            sliders.slice(
                0,
                size.capacity.sliders
            );


        // =====================================================
        // MORE
        // =====================================================

        const hiddenToggles =
            toggles.length >
            visibleToggles.length;


        const hiddenSliders =
            sliders.length >
            visibleSliders.length;


        return {

            toggles:
                visibleToggles,

            sliders:
                visibleSliders,

            hasMore:
                hiddenToggles ||
                hiddenSliders

        };

    }



        


    // =========================================================
    // GET ALL VISIBLE CONTROLS
    // =========================================================

    getAllVisibleControls() {

        return this.state.controls.filter(
            control =>
                control.visible !== false
        );

    }


    // =========================================================
    // GET HIDDEN CONTROLS
    // =========================================================

    getHiddenControls() {

        const visible =
            this.getVisibleControls();

        const visibleList = [
            ...(visible.toggles || []),
            ...(visible.sliders || [])
        ];

        const visibleIds =
            new Set(
                visibleList.map(
                    control =>
                        control.id
                )
            );


        return this.getAllVisibleControls()
            .filter(
                control =>
                    !visibleIds.has(
                        control.id
                    )
            );

    }


    // =========================================================
// RENDER
// =========================================================

render() {

    if (this.expansionManager) {

        this.expansionManager.destroy();

        this.expansionManager = null;
    }

    if (!this.element) {

        this.createElement();
    }

    this.expansionManager =
        new ExpansionManager({
            root: document.getElementById('cherry-canvas') || document.body,
            threshold: 500,
            animationDuration: 250
        });



    // =====================================================
    // UPDATE ATTRIBUTES
    // =====================================================

    this.updateAttributes();


    // =====================================================
    // CLEAR
    // =====================================================

    this.element.innerHTML = "";


    // =====================================================
    // CONTAINER
    // =====================================================

    const container =
        document.createElement("div");

    container.classList.add(
        "cherry-controls-container"
    );


    // =====================================================
    // MAIN GRID
    // =====================================================

    const grid =
        document.createElement("div");

    grid.classList.add(
        "cherry-controls-grid"
    );


    // =====================================================
    // SIZE CONFIG
    // =====================================================

    const sizeConfig =
        this.sizePresets[
            this.settings.sizePreset
        ];


    if (sizeConfig) {

        grid.style.setProperty(
            "--controls-columns",
            sizeConfig.columns
        );

        grid.style.setProperty(
            "--controls-rows",
            sizeConfig.rows
        );


    }



    // =====================================================
    // GET VISIBLE CONTROLS
    // =====================================================

    const visible =
        this.getVisibleControls();


    // =====================================================
    // BUTTONS AREA
    // =====================================================

    const buttonGroup =
        document.createElement("div");

    buttonGroup.classList.add(
        "cherry-controls-buttons"
    );

    if (sizeConfig) {

    buttonGroup.style.setProperty(
        "--controls-button-columns",
        sizeConfig.buttonColumns
    );

}


    // =====================================================
    // TOGGLES / ACTIONS
    // =====================================================

    visible.toggles.forEach(
        control => {

            const element =
                this.createControl(
                    control
                );

            if (element) {

                element.classList.add(
                    "cherry-control-button"
                );

                buttonGroup.appendChild(
                    element
                );

            }

        }
    );


    // =====================================================
    // MORE BUTTON
    // =====================================================

    if (visible.hasMore) {

        const more =
            this.createMoreButton();


        more.classList.add(
            "cherry-control-button"
        );


        more.style.setProperty(
            "--control-span",
            "1"
        );


        buttonGroup.appendChild(
            more
        );

    }


    // =====================================================
    // SLIDERS AREA
    // =====================================================

    const sliderGroup =
        document.createElement("div");

    sliderGroup.classList.add(
        "cherry-controls-sliders"
    );


    // =====================================================
    // SLIDERS
    // =====================================================

    visible.sliders.forEach(
        control => {

            const element =
                this.createControl(
                    control
                );

            if (element) {

                sliderGroup.appendChild(
                    element
                );

            }

        }
    );


    // =====================================================
    // ADD BUTTON GROUP
    // =====================================================

    grid.appendChild(
        buttonGroup
    );


    // =====================================================
    // ADD SLIDER GROUP
    // =====================================================

    grid.appendChild(
        sliderGroup
    );


    // =====================================================
    // ADD GRID TO CONTAINER
    // =====================================================

    container.appendChild(
        grid
    );


    // =====================================================
    // ADD CONTAINER TO WIDGET
    // =====================================================

    this.element.appendChild(
        container
    );

    this.connectState();

}

getExpansionConfig(control) {

    if (!control || control.expandable === false) {
        return null;
    }

    const configs = {

        wifi: {
            title: "Wi-Fi",

            getContent: () => ({
                title: "Wi-Fi",

                items: [
                    {
                        label: "Red actual",
                        secondary: "Conectado",
                        selected: true
                    },
                    {
                        label: "Red disponible",
                        secondary: "Disponible"
                    },
                    {
                        label: "Otra red",
                        secondary: "Disponible"
                    }
                ],

                actions: [
                    {
                        label: "More Settings",
                        callback: () => {
                            console.log(
                                "Wi-Fi More Settings"
                            );
                        }
                    }
                ]
            })
        },


        bluetooth: {
            title: "Bluetooth",

            getContent: () => ({
                title: "Bluetooth",

                items: [
                    {
                        label: "Auriculares",
                        secondary: "Conectado",
                        selected: true
                    },
                    {
                        label: "Mouse",
                        secondary: "Disponible"
                    },
                    {
                        label: "Teclado",
                        secondary: "Disponible"
                    }
                ],

                actions: [
                    {
                        label: "More Settings",
                        callback: () => {
                            console.log(
                                "Bluetooth More Settings"
                            );
                        }
                    }
                ]
            })
        },


        darkMode: {
            title: "Dark Mode",

            getContent: () => {

                const current =
                    this.getControlValue("darkMode");

                return {
                    title: "Dark Mode",

                    items: [
                        {
                            label: "Dark Mode",

                            secondary:
                                current
                                    ? "Activado"
                                    : "Desactivado",

                            selected: current
                        }
                    ]
                };
            }
        },


        colorMode: {
            title: "Color Mode",

            getContent: () => {

                const current =
                    this.getControlValue("colorMode");

                return {
                    title: "Color Mode",

                    items: [
                        {
                            label: "Color Mode",

                            secondary:
                                current
                                    ? "Activado"
                                    : "Desactivado",

                            selected: current
                        }
                    ]
                };
            }
        },


        doNotDisturb: {
            title: "Do Not Disturb",

            getContent: () => {

                const current =
                    this.getControlValue(
                        "doNotDisturb"
                    );

                return {
                    title: "Do Not Disturb",

                    items: [
                        {
                            label: "Do Not Disturb",

                            secondary:
                                current
                                    ? "Activado"
                                    : "Desactivado",

                            selected: current
                        }
                    ]
                };
            }
        }
    };

    const config = configs[control.id] ?? null;
    if (config && control.expandable === undefined) {
        control.expandable = true;
    }

    return config;
}

    // =========================================================
    // CREATE CONTROL
    // =========================================================

    createControl(control) {

        if (!control) {
            return null;
        }


        const element = (() => {

            switch (control.type) {

                case "toggle":
                    return this.createToggle(control);

                case "slider":
                    return this.createSlider(control);

                case "action":
                    return this.createAction(control);

                default:

                    console.warn(
                        `ControlsWidget: tipo "${control.type}" no soportado.`
                    );

                    return null;

            }

        })();


        if (!element) {
            return null;
        }


        // =====================================================
        // GRID SPAN
        // =====================================================

        const span =
            this.getControlSpan(
                control
            );


        element.style.setProperty(
            "--control-span",
            span
        );


        return element;

    }

    // =========================================================
    // CREATE TOGGLE
    // =========================================================

    createToggle(control) {

        const element =
            document.createElement("button");

        element.type =
            "button";

        element.classList.add(
            "cherry-control",
            "cherry-control-toggle"
        );

        element.dataset.control =
            control.id;

        const val =
            this.getControlValue(control.id);

        const isActive =
            val !== undefined
                ? Boolean(val)
                : Boolean(control.value);

        element.setAttribute('aria-label', control.label);
        element.setAttribute('aria-pressed', String(isActive));

        if (isActive) {
            element.classList.add("active");
            element.dataset.active = "true";
        }




        // =====================================================
        // ICON
        // =====================================================

        const icon =
            document.createElement("div");

        icon.classList.add(
            "cherry-control-icon"
        );

        icon.textContent =
            this.getControlIcon(
                control.id
            );
        setControlIcon(icon, control.id);


        // =====================================================
        // LABEL
        // =====================================================

        const label =
            document.createElement("div");

        label.classList.add(
            "cherry-control-label"
        );

        label.textContent =
            control.label;


        // =====================================================
        // STRUCTURE
        // =====================================================

        element.appendChild(
            icon
        );

        element.appendChild(
            label
        );


        // =====================================================
        // INTERACTION
        // =====================================================

        element.addEventListener(
            "click",
            () => {

                this.handleToggle(
                    control.id
                );

            }
        );


        const expansionConfig =
            this.getExpansionConfig(control);

        console.log(
            "EXPANSION CHECK:",
            control.id,
            control.expandable,
            expansionConfig
        );

        if (
            expansionConfig &&
            this.expansionManager
        ) {
            console.log(
                "REGISTRANDO LONG PRESS:",
                control.id
            );

            this.expansionManager.register(element, {
                id: control.id,
                label: control.label,
                getContent: expansionConfig.getContent,
                onAction: (action, newValue) => {
                    if (typeof expansionConfig.onAction === "function") {
                        expansionConfig.onAction(action, newValue);
                    } else if (newValue !== undefined) {
                        if (nativeService.isSystemControl(control.id)) nativeService.requestFromUI(control.id, newValue);
                        else appState.set(control.id, newValue, this.id);
                    }
                }
            });

        }

        


        return element;

    }
    handleToggle(controlId) {

        const control =
            this.state.controls.find(
                control =>
                    control.id === controlId
            );


        if (!control) {

            console.warn(
                `ControlsWidget: toggle "${controlId}" no encontrado.`
            );

            return;

        }


        if (control.type !== "toggle") {

            console.warn(
                `ControlsWidget: "${controlId}" no es un toggle.`
            );

            return;

        }


        // =====================================================
        // TOGGLE STATE
        // =====================================================

        const current =
            this.getControlValue(control.id);

        const currentBool =
            current !== undefined
                ? Boolean(current)
                : Boolean(control.value);

        const newValue =
            !currentBool;

        if (nativeService.isSystemControl(control.id)) { nativeService.requestFromUI(control.id, newValue); return; }
        control.value = newValue;

        appState.set(
            control.id,
            newValue,
            this.id
        );

        this.updateControlState(
            control.id,
            newValue
        );

        console.log(
            `Toggle ${control.id}:`,
            newValue
        );

    }


    // =========================================================
    // CREATE SLIDER
    // =========================================================

    createSlider(control) {

        const element =
            document.createElement(
                "div"
            );


        element.classList.add(
            "cherry-control",
            "cherry-control-slider"
        );


        element.dataset.control =
            control.id;


        // =====================================================
        // HEADER
        // =====================================================

        const header =
            document.createElement(
                "div"
            );


        header.classList.add(
            "cherry-control-slider-header"
        );


        // =====================================================
        // ICON
        // =====================================================

        const icon =
            document.createElement(
                "div"
            );


        icon.classList.add(
            "cherry-control-icon"
        );


        icon.textContent =
            this.getControlIcon(
                control.id
            );
        setControlIcon(icon, control.id);


        // =====================================================
        // LABEL
        // =====================================================

        const label =
            document.createElement(
                "div"
            );


        label.classList.add(
            "cherry-control-label"
        );


        label.textContent =
            control.label;


        // =====================================================
        // VALUE
        // =====================================================

        const value =
            document.createElement(
                "div"
            );


        value.classList.add(
            "cherry-control-value"
        );


        value.textContent =
            `${control.value}%`;


        // =====================================================
        // HEADER STRUCTURE
        // =====================================================

        header.appendChild(
            icon
        );

        header.appendChild(
            label
        );

        header.appendChild(
            value
        );


        // =====================================================
        // RANGE
        // =====================================================

        const range =
            document.createElement(
                "input"
            );


        range.type =
            "range";

        range.setAttribute('aria-label', control.label);


        range.classList.add(
            "cherry-control-range"
        );


        range.min =
            control.min ?? 0;


        range.max =
            control.max ?? 100;


        range.value =
            control.value;


        range.addEventListener(
            "input",
            event => {
                const requested = Number(event.target.value);
                if (nativeService.isSystemControl(control.id)) {
                    range.value = control.value ?? 0;
                    nativeService.requestFromUI(control.id, requested);
                    return;
                }
                control.value =
                    Number(
                        event.target.value
                    );


                value.textContent =
                    `${control.value}%`;
                appState.set(control.id, requested, this.id);

            }
        );



        // =====================================================
        // STRUCTURE
        // =====================================================

        element.appendChild(
            header
        );


        element.appendChild(
            range
        );


        return element;

    }


    // =========================================================
    // CREATE ACTION
    // =========================================================

    createAction(control) {

        const element =
            document.createElement(
                "button"
            );


        element.type =
            "button";


        element.classList.add(
            "cherry-control",
            "cherry-control-action"
        );


        element.dataset.control =
            control.id;


        const icon =
            document.createElement(
                "div"
            );


        icon.classList.add(
            "cherry-control-icon"
        );


        icon.textContent =
            this.getControlIcon(
                control.id
            );
        setControlIcon(icon, control.id);


        const label =
            document.createElement(
                "div"
            );


        label.classList.add(
            "cherry-control-label"
        );


        label.textContent =
            control.label;


        element.appendChild(
            icon
        );


        element.appendChild(
            label
        );


        element.addEventListener(
            "click",
            () => {

                console.log(
                    `Action: ${control.id}`
                );

            }
        );


        return element;

    }


    // =========================================================
    // CREATE MORE BUTTON
    // =========================================================

    createMoreButton() {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";
        button.style.setProperty(
            "--control-span",
            "1"
        );
        


        button.classList.add(
            "cherry-controls-more"
        );


        button.dataset.control =
            "more";


        const label =
            document.createElement(
                "span"
            );


        label.classList.add(
            "cherry-controls-more-label"
        );


        label.textContent =
            "More";


        button.appendChild(
            label
        );


        button.addEventListener(
            "click",
            (e) => {
                e.stopPropagation();
                this.openControlsPanel(button);
            }
        );

        return button;

    }
    

    // =========================================================
    // GET CONTROL VALUE
    // =========================================================

    getControlValue(id) {

        const fromState =
            appState.get(id);

        if (fromState !== undefined) {
            return fromState;
        }

        const control =
            this.state.controls.find(
                c => c.id === id
            );

        return control ? control.value : undefined;

    }


    // =========================================================
    // TOGGLE HIDDEN CONTROL
    // =========================================================

    toggleHiddenControl(controlId) {

        const control =
            this.state.controls.find(
                c => c.id === controlId
            );

        if (!control) {
            return;
        }

        if (control.type === "toggle") {
            const current =
                this.getControlValue(control.id);

            const currentBool =
                current !== undefined
                    ? Boolean(current)
                    : Boolean(control.value);

            const newValue =
                !currentBool;

            if (nativeService.isSystemControl(control.id)) { nativeService.requestFromUI(control.id, newValue); return; }
            control.value = newValue;

            appState.set(
                control.id,
                newValue,
                this.id
            );

            this.updateControlState(
                control.id,
                newValue
            );
        }

        if (
            this.expansionManager?.isExpanded &&
            this.expansionManager.expandedControlId === "more"
        ) {
            const content =
                this._getHiddenControlsPanelContent();

            this.expansionManager.panel.updateContent(content);
        }

    }


    // =========================================================
    // UPDATE CONTROL DOM STATE
    // =========================================================

    updateControlState(controlId, value) {

        if (!this.element) {
            return;
        }

        const btn =
            this.element.querySelector(
                `[data-control="${controlId}"]`
            );

        if (btn) {
            const range = btn.querySelector('input[type="range"]');
            if (range) {
                range.value = value ?? 0;
                const display = btn.querySelector('.cherry-control-value');
                if (display) display.textContent = value == null ? '—' : value + '%';
                return;
            }
            const isActive =
                Boolean(value);

            if (btn.tagName === 'BUTTON') btn.setAttribute('aria-pressed', String(isActive));

            btn.classList.toggle(
                "active",
                isActive
            );

            if (isActive) {
                btn.dataset.active =
                    "true";
            } else {
                delete btn.dataset.active;
            }
        }

    }


    // =========================================================
    // CONNECT STATE (APPSTATE SUBSCRIPTIONS)
    // =========================================================

    connectState() {

        if (this._unsubscribers) {
            this._unsubscribers.forEach(unsub => unsub());
            this._unsubscribers = [];
        } else {
            this._unsubscribers = [];
        }

        if (!Array.isArray(this.state.controls)) {
            return;
        }

        this.state.controls.forEach(control => {
            const current = appState.get(control.id);
            if (current !== undefined) {
                control.value = current;
                this.updateControlState(control.id, current);
            }
            const unsub = appState.subscribe(
                control.id,
                (data) => {
                    const val =
                        typeof data === "object" && data !== null && "value" in data
                            ? data.value
                            : data;

                    control.value = val;
                    this.updateControlState(control.id, val);
                }
            );

            this._unsubscribers.push(unsub);
        });

    }


    // =========================================================
    // GET HIDDEN CONTROLS PANEL CONTENT
    // =========================================================

    _getHiddenControlsPanelContent() {

        const hiddenControls =
            this.getHiddenControls();

        if (!hiddenControls || !hiddenControls.length) {
            return {
                title: "Controles",
                items: [
                    {
                        label: "No hay controles adicionales",
                        secondary: "Todos los controles están visibles"
                    }
                ]
            };
        }

        const items = hiddenControls.map(control => {

            const isToggle =
                control.type === "toggle";

            const isSlider =
                control.type === "slider";

            const val =
                this.getControlValue(control.id) ?? control.value;

            const icon =
                this.getControlIcon(control.id) || (isToggle ? "⌁" : "⚙");

            if (isSlider) {

                const sliderItem =
                    document.createElement("div");

                sliderItem.className =
                    "cherry-expansion-panel__item";

                sliderItem.style.flexDirection =
                    "column";

                sliderItem.style.alignItems =
                    "stretch";

                sliderItem.style.gap =
                    "8px";

                const topRow =
                    document.createElement("div");

                topRow.style.display =
                    "flex";

                topRow.style.alignItems =
                    "center";

                topRow.style.justifyContent =
                    "space-between";

                const labelSpan =
                    document.createElement("span");

                labelSpan.textContent =
                    `${icon} ${control.label}`;

                labelSpan.style.fontSize =
                    "14px";

                labelSpan.style.fontWeight =
                    "500";

                const valSpan =
                    document.createElement("span");

                valSpan.textContent =
                    `${val ?? 0}%`;

                valSpan.style.fontSize =
                    "12px";

                valSpan.style.opacity =
                    "0.7";

                topRow.appendChild(labelSpan);
                topRow.appendChild(valSpan);

                const input =
                    document.createElement("input");

                input.type =
                    "range";

                input.setAttribute('aria-label', control.label);

                input.min =
                    control.min ?? 0;

                input.max =
                    control.max ?? 100;

                input.value =
                    val ?? 50;

                input.style.width =
                    "100%";

                input.style.accentColor =
                    "var(--cherry-accent, #ff4b69)";

                input.addEventListener("input", (e) => {
                    const newVal = Number(e.target.value);
                    if (nativeService.isSystemControl(control.id)) {
                        input.value = control.value ?? 0;
                        nativeService.requestFromUI(control.id, newVal);
                        return;
                    }
                    valSpan.textContent = `${newVal}%`;
                    control.value = newVal;
                    appState.set(control.id, newVal, this.id);
                });

                sliderItem.appendChild(topRow);
                sliderItem.appendChild(input);
                sliderItem.dataset.control = control.id;
                valSpan.classList.add('cherry-control-value');
                nativeService.decorateControls(sliderItem);

                return {
                    element: sliderItem
                };

            }

            const secondary =
                isToggle
                    ? (val ? "Activado" : "Desactivado")
                    : (control.secondary || "Acción");

            return {
                id: control.id,
                label: control.label,
                icon,
                secondary: nativeService.control(control.id)?.reason || secondary,
                selected: isToggle ? Boolean(val) : false,
                callback: nativeService.isSystemControl(control.id) && !nativeService.control(control.id)?.writable ? undefined : () => {
                    if (isToggle) {
                        this.toggleHiddenControl(control.id);
                    } else if (control.type === "action" && typeof control.action === "function") {
                        control.action();
                    }
                }
            };

        });

        return {
            title: "Controles adicionales",
            items
        };

    }


    // =========================================================
    // OPEN CONTROLS PANEL
    // =========================================================

    openControlsPanel(buttonElement = null) {

        if (!this.expansionManager) {
            return;
        }

        const anchor =
            buttonElement ||
            this.element?.querySelector(".cherry-controls-more") ||
            this.element;

        if (typeof this.expansionManager.openPanel === "function") {
            this.expansionManager.openPanel({
                id: "more",
                label: "Controles adicionales",
                element: anchor,
                getContent: () => this._getHiddenControlsPanelContent()
            });
            return;
        }

        if (
            this.expansionManager.isExpanded &&
            this.expansionManager.expandedControlId === "more"
        ) {
            this.expansionManager.collapse?.();
            return;
        }

        if (this.expansionManager.isExpanded) {
            this.expansionManager.collapse?.();
        }

        this.expansionManager.isExpanded = true;
        this.expansionManager.expandedControlId = "more";
        this.expansionManager.expandedElement = anchor;

        const content =
            this._getHiddenControlsPanelContent();

        this.expansionManager.panel.open({
            id: "more",
            label: "Controles adicionales",
            content,
            element: anchor,
            container: this.expansionManager.root || document.body,
            onClose: () => {
                this.expansionManager.isExpanded = false;
                this.expansionManager.expandedControlId = null;
                this.expansionManager.expandedElement = null;
            }
        });

        this.expansionManager.activePanel =
            this.expansionManager.panel;

    }


    // =========================================================
    // ICONS
    // =========================================================

    getControlIcon(id) {

        const icons = {

            wifi: "⌁",

            bluetooth: "ᛒ",

            brightness: "☀",

            volume: "◖",

            microphone: "●",

            airplane: "✈",

            darkMode: "◐",

            colorMode: "◒",

            doNotDisturb: "−",

            batterySaver: "⚡",

            screenshot: "▣",

            calculator: "▦",

            terminal: ">_",

            fileExplorer: "□",

            settings: "⚙"

        };


        return icons[id] ?? "•";

    }


    // =========================================================
    // UPDATE
    // =========================================================

    update() {

        super.update();

        this.render();

    }


    // =========================================================
    // DESTROY
    // =========================================================

    destroy() {

        if (this._unsubscribers) {
            this._unsubscribers.forEach(unsub => unsub());
            this._unsubscribers = [];
        }

        if (this.expansionManager) {
            this.expansionManager.destroy();
            this.expansionManager = null;
        }

        super.destroy();

    }

}
