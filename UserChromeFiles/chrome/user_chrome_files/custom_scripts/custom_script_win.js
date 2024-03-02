// Script For browser window document [ChromeOnly]
var ucf_custom_script_win = {
    initialized: false,
    get unloadlisteners() {
        delete this.unloadlisteners;
        window.addEventListener("unload", this, { once: true });
        return this.unloadlisteners = [];
    },
    load() {
        if (this.initialized)
            return;
        this.initialized = true;
        /* ************************************************ */

        // Here may be your code that will fire on the "load" event

        /* ************************************************ */
    },
    handleEvent(e) {
        this[e.type](e);
    },
    unload() {
        this.unloadlisteners.forEach(str => {
            try {
                this[str].destructor();
            } catch (e) {}
        });
    },
};
/* ************************************************ */

// Here may be your code that will fire on the "DOMContentLoaded" event
