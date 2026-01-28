/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
(async (
    addonsIDs = [
        "__newtabpage@vitaliy.com",
    ],
) => ({
    init() {
        this.aMap = new Map();
        for (let id of addonsIDs) {
            let uuid = WebExtensionPolicy.getByID(id)?.extension.uuid;
            if (uuid) this.aMap.set(uuid, id);
        }
        this.root = document.documentElement;
        var tabs = this.tabs = gBrowser.tabContainer;
        setUnloadMap(Symbol(), this.destructor, this);
        gBrowser.addTabsProgressListener(this);
        this.tabSelect = this.tabSelect.bind(this);
        tabs.addEventListener("TabSelect", this.tabSelect);
        this.tabRestoring = this.tabRestoring.bind(this);
        tabs.addEventListener("SSTabRestoring", this.tabRestoring);
        tabs.addEventListener("TabAttrModified", this.tabRestoring);
    },
    tabSelect(e) {
        this.setAttrs({ setAttribute() { } }, e.target.linkedBrowser.currentURI, true);
    },
    tabRestoring(e) {
        var tab = e.target;
        if (tab.hasAttribute("pending")) this.setAttrs(tab, tab.linkedBrowser.currentURI);
    },
    onLocationChange() {
        this.tabs.removeEventListener("TabAttrModified", this.tabRestoring);
        (this.onLocationChange = this.locChange).apply(this, arguments);
    },
    locChange(browser, progress, request, uri) {
        if (!progress.isTopLevel) return;
        var tab = gBrowser.getTabForBrowser(browser);
        this.setAttrs(tab, uri, gBrowser.selectedTab == tab);
    },
    setAttrs(tab, uri, sel) {
        var spec = "", host = "";
        try { spec = decodeURIComponent(uri.displaySpec); } catch { }
        if (this.aMap.has(host = uri.asciiHost)) spec = `moz-extension://${this.aMap.get(host)}${uri.filePath}`;
        tab.setAttribute("ucf_url", spec);
        if (sel) this.root.setAttribute("ucf_url", spec);
    },
    destructor() {
        gBrowser.removeTabsProgressListener(this);
        this.tabs.removeEventListener("TabSelect", this.tabSelect);
        this.tabs.removeEventListener("SSTabRestoring", this.tabRestoring);
    },
}).init())();
