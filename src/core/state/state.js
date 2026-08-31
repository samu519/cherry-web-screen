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