/**
@UCF @param {"prop":"JsAllChrome.load","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|historySidebar|places))\\.xhtml"} @UCF
@UCF @param {"prop":"JsContent.pageshow","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|historySidebar|places))\\.xhtml"} @UCF
*/
(async (
    id = "placesContext_openInTabsPending",
    label = "Open in Tabs Pending",
    image = "chrome://browser/skin/tabs.svg",
    propertiesPending = `
text-decoration-line: underline !important;
text-decoration-style: dotted !important;
text-decoration-color: currentColor !important;
text-decoration-thickness: 2px !important;
text-decoration-skip-ink: none !important;
text-underline-offset: .2em !important;
opacity: .5 !important;
`,
) => ({
    init() {
        var elm = document.querySelector("#placesContext > [id='placesContext_openLinks:tabs']");
        if (!elm) return;
        var item = document.createXULElement("menuitem");
        item.id = id;
        item.label = label;
        if (image) item.className = "menuitem-iconic";
        item.setAttribute("selection-type", "any");
        item.setAttribute("node-type", "query|folder|link|separator");
        var desc = Object.getOwnPropertyDescriptor(XULElement.prototype, "hidden");
        var popup = elm.parentElement;
        desc.set = this.hidden.bind(item, popup, desc.set);
        Object.defineProperty(item, "hidden", desc);
        item.onclick = this.open.bind(this, popup);
        var style = `data:text/css;charset=utf-8,${encodeURIComponent(`
#placesContext > #${id} {${image ? `
--menuitem-icon: url("${image}") !important;
list-style-image: url("${image}") !important;
-moz-context-properties: fill !important;
fill: currentColor !important;` : ""}
}
${propertiesPending ? `:root[windowtype="navigator:browser"] .tabbrowser-tab:not([selected],[multiselected])[pending] .tab-label {${propertiesPending}}` : ""}
`)}`;
        windowUtils.loadSheetUsingURIString(style, windowUtils.USER_SHEET);
        elm.after(item);
    },
    hidden({ triggerNode: tn, _view: vw }, set, val) {
        var node = tn?._placesView?.result.root || vw.selectedNode || vw.result.root;
        if (PlacesUtils.nodeIsContainer(node) && !PlacesUtils.hasChildURIs(node)) val = true;
        set.call(this, val);
    },
    async open({ triggerNode: tn, _view: vw }, e) {
        var nodes = tn._placesNode || tn._placesView?.result.root || vw.selectedNodes;
        if (nodes.length === 0) nodes = vw.result.root;
        var items = [];
        for (let node of Array.isArray(nodes) ? nodes : [nodes]) {
            if (PlacesUtils.nodeIsContainer(node)) items.push(...PlacesUtils.getURLsForContainerNode(node));
            else if (PlacesUtils.nodeIsURI(node)) items.push(node);
        }
        if (!items.length) return;
        var win = vw.ownerWindow;
        win = win?.document.documentElement.getAttribute("windowtype") === "navigator:browser"
            ? win : BrowserWindowTracker.getTopWindow();
        var where = BrowserUtils.whereToOpenLink(e, false, true);
        var newWin = !win || where === "window";
        if (newWin) {
            let args = Cc["@mozilla.org/array;1"].createInstance(Ci.nsIMutableArray);
            args.appendElement(PlacesUtils.toISupportsString(items.shift().uri));
            let features = "chrome,dialog=no,all";
            if (win && PrivateBrowsingUtils.isWindowPrivate(win)) features += ",private";
            win = Services.ww.openWindow(win || null, AppConstants.BROWSER_CHROME_URL, null, features, args);
            if (!items.length) return;
            await new Promise(resolve => win.addEventListener("load", resolve, { once: true }));
        }
        var insertAfterCurrent = !newWin && Services.prefs.getBoolPref("browser.tabs.insertAfterCurrent");
        var multi = items.length > 1, gb = win.gBrowser;
        var params = {
            skipAnimation: multi || newWin,
            bulkOrderedOpen: multi
        };
        if (insertAfterCurrent) params.index = params.tabIndex = gb.selectedTab._tPos;
        var first = true;
        for (let { uri, title } of items) {
            if (insertAfterCurrent) params.index = params.tabIndex += 1;
            let state = {
                index: 1,
                hidden: false,
                attributes: {},
                lastAccessed: 0,
                entries: [{ url: uri, title, triggeringPrincipal_base64: win.E10SUtils.SERIALIZED_SYSTEMPRINCIPAL }]
            };
            let image = await PlacesUtils.favicons.getFaviconForPage(Services.io.newURI(uri), 32);
            if (image) state.image = image.dataURI.spec;
            let tab = gb.addTrustedTab(uri, params);
            win.SessionStore.setTabState(tab, state);
            if (first) {
                first = false;
                if (newWin) continue;
                if (multi && insertAfterCurrent) params.index = params.tabIndex = tab._tPos
                if (where === "tabshifted") gb.selectedTab = tab;
            }
        }
    },
}).init())();
