/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
(async () => ({
    init() {
        var slot = this.slot = gBrowser.tabs[0].flattenedTreeParentNode || gBrowser.tabContainer;
        if (!slot) return;
        setUnloadMap(Symbol("rightClikCloseTab"), this.destructor, this);
        slot.addEventListener("contextmenu", this, true);
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
        this.slot.removeEventListener("contextmenu", this, true);
    },
}).init())();
