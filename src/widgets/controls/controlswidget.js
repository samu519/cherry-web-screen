import { Widget } from "../../core/widgets/Widget.js";
import { ExpansionManager } from "../../core/interaction/ExpansionManager.js";

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
                root: element,
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

        const visibleIds =
            new Set(
                visible.controls.map(
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
            root: document.body,
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

}

getExpansionConfig(control) {

    if (!control?.expandable) {
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

    return configs[control.id] ?? null;
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


        // =====================================================
        // STATE
        // =====================================================

        if (control.value) {

            element.classList.add(
                "active"
            );

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

            this.expansionManager.register(
                element,
                {
                    id: control.id,
                    label:
                        expansionConfig.title ??
                        control.label,
                    getContent:
                        expansionConfig.getContent
                }
            );
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

        control.value =
            !control.value;


        // =====================================================
        // DEBUG
        // =====================================================

        console.log(
            `Toggle ${control.id}:`,
            control.value
        );


        // =====================================================
        // UPDATE UI
        // =====================================================

        this.render();

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

                control.value =
                    Number(
                        event.target.value
                    );


                value.textContent =
                    `${control.value}%`;

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
            () => {

                this.openControlsPanel();

            }
        );


        return button;

    }
    


    // =========================================================
    // OPEN CONTROLS PANEL
    // =========================================================

    openControlsPanel() {

        console.log(
            "Controls panel:",
            this.getHiddenControls()
        );

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

        super.destroy();

    }

}