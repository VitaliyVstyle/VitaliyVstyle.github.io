/**
@UCF @param {"prop":"JsChrome.DOMContentLoaded","ucfobj":true} @UCF
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
(async (
    propertiesUnread = `
text-decoration-line: underline !important;
text-decoration-style: dotted !important;
text-decoration-color: magenta !important;
text-decoration-thickness: 2px !important;
text-decoration-skip-ink: none !important;
text-underline-offset: .2em !important;
`,
) => ({
    JsChrome_DOMContentLoaded() {
        window.gReduceMotionOverride = false;
        if (propertiesUnread) windowUtils.loadSheetUsingURIString(`data:text/css;charset=utf-8,${encodeURIComponent(`.tabbrowser-tab:not([selected],[multiselected])[notselectedsinceload=true] .tab-label {${propertiesUnread}}`)}`, windowUtils.USER_SHEET);
    },
    JsChrome_load() {
        setUnloadMap(Symbol("unreadTabs"), this.destructor, this);
        gBrowser.tabContainer.addEventListener("TabSelect", this);
    },
    handleEvent({ target }) {
        target.setAttribute("notselectedsinceload", "false");
    },
    destructor() {
        gBrowser.tabContainer.removeEventListener("TabSelect", this);
    },
})[getProp]())();
