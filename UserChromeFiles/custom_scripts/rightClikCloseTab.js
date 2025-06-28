/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
(async () => ({
    init() {
        var contain = this.contain = gBrowser.tabContainer;
        if (!contain) return;
        setUnloadMap(Symbol("rightClikCloseTab"), this.destructor, this);
        contain.addEventListener("contextmenu", this, true);
    },
    handleEvent(e) {
        var tab;
        if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || !(tab = e.target.closest("tab.tabbrowser-tab"))) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        gBrowser.removeTab(tab, {
            animate: true,
            triggeringEvent: e,
        });
    },
    destructor() {
        this.contain.removeEventListener("contextmenu", this, true);
    },
}).init())();
