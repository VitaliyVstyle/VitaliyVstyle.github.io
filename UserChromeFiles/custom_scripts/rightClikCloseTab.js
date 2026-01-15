/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
(async () => ({
    init() {
        var tabs = this.tabs = gBrowser.tabContainer;
        if (!tabs) return;
        setUnloadMap(Symbol("rightClikCloseTab"), this.destructor, this);
        tabs.addEventListener("contextmenu", this, true);
    },
    handleEvent(e) {
        var tab;
        if (e.getModifierState("Control") || e.metaKey || e.altKey || e.shiftKey || !(tab = e.target.closest?.("tab"))) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        gBrowser.removeTab(tab, {
            animate: true,
            triggeringEvent: e,
        });
    },
    destructor() {
        this.tabs.removeEventListener("contextmenu", this, true);
    },
}).init())();
