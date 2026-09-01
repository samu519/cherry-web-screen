export class State {

    constructor(initialState = {}) {

        this.state = {
            ...initialState
        };

        this.listeners = new Map();
    }


    // =====================================================
    // GET
    // =====================================================

    get(key) {

        return this.state[key];

    }


    // =====================================================
    // SET
    // =====================================================

    set(key, value) {

        const previous = this.state[key];

        if (Object.is(previous, value)) {
            return;
        }

        this.state[key] = value;

        this.notify(
            key,
            value,
            previous
        );

    }


    // =====================================================
    // SUBSCRIBE
    // =====================================================

    subscribe(key, callback) {

        if (!this.listeners.has(key)) {

            this.listeners.set(
                key,
                new Set()
            );

        }

        const listeners =
            this.listeners.get(key);

        listeners.add(callback);


        // ---------------------------------------------
        // UNSUBSCRIBE
        // ---------------------------------------------

        return () => {

            listeners.delete(callback);

            if (listeners.size === 0) {

                this.listeners.delete(key);

            }

        };

    }


    // =====================================================
    // NOTIFY
    // =====================================================

    notify(
        key,
        value,
        previous
    ) {

        const listeners =
            this.listeners.get(key);

        if (!listeners) {
            return;
        }

        listeners.forEach(
            callback => {

                callback(
                    value,
                    previous
                );

            }
        );

    }

}

export class AppState extends EventTarget {

    constructor(initialState = {}) {

        super();

        this.state = {
            ...initialState
        };

    }


    // =====================================================
    // GET
    // =====================================================

    get(id) {

        return this.state[id];

    }


    // =====================================================
    // SET
    // =====================================================

    set(id, value, source = null) {

        const previous =
            this.state[id];

        // ---------------------------------------------
        // Evitar eventos innecesarios
        // ---------------------------------------------

        if (Object.is(previous, value)) {
            return false;
        }


        // ---------------------------------------------
        // Guardar
        // ---------------------------------------------

        this.state[id] =
            value;


        // ---------------------------------------------
        // Notificar
        // ---------------------------------------------

        this.dispatchEvent(
            new CustomEvent(
                "change",
                {
                    detail: {

                        id,

                        value,

                        previous,

                        source

                    }
                }
            )
        );


        return true;

    }


    // =====================================================
    // SUBSCRIBE
    // =====================================================

    subscribe(id, callback) {

        const listener =
            (event) => {

                if (
                    event.detail.id !== id
                ) {
                    return;
                }

                callback(
                    event.detail
                );

            };


        this.addEventListener(
            "change",
            listener
        );


        return () => {

            this.removeEventListener(
                "change",
                listener
            );

        };

    }

}