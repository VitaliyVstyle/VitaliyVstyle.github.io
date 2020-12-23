// Этот скрипт работает во всех окнах браузера если включено в настройках

var ucf_custom_script_all_win = {
    initialized: false,
    unloadlisteners: [],
    load() {
        if (this.initialized)
            return;
        this.initialized = true;
        /* ************************************************ */

        // Здесь может быть ваш код который сработает по событию "load" не раньше

        /* ************************************************ */
        if (!this.unloadlisteners.length)
            return;
        window.addEventListener("unload", this, { once: true });
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
    }
};

if (window.document.readyState != "complete") {
    window.addEventListener("load", function load() {
        ucf_custom_script_all_win.load();
    }, { once: true });
} else
    ucf_custom_script_all_win.load();
