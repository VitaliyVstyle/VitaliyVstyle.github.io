/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true,"disable":true} @UCF
*/
(async (
    id = Symbol("rightclickclosetab"),
) => (this[id] = {
    init() {
        var slot = gBrowser.tabs[0].flattenedTreeParentNode || gBrowser.tabContainer;
        if (!slot) return;
        slot.addEventListener("contextmenu", this, true);
        setUnloadMap(id, () => {
            slot.removeEventListener("contextmenu", this, true);
        }, this);
    },
    handleEvent(e) {
        var tab;
        if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || !(tab = e.target.closest("tab.tabbrowser-tab"))) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        gBrowser.removeTab(tab, {
            animate: true,
            byMouse: e.inputSource == e.MOZ_SOURCE_MOUSE,
        });
    },
}).init())();
