/**
@UCF @param {"prop":"JsAllChrome.load","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|historySidebar|places))\\.xhtml"} @UCF
@UCF @param {"prop":"JsContent.pageshow","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|historySidebar|places))\\.xhtml"} @UCF
*/
(async (
    id = "placesContext_openAllInTabs",
    label = "Open All in Tabs Pending",
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
        if (image) {
            item.className = "menuitem-iconic";
            item.style.cssText = `--menuitem-icon:url("${image}");list-style-image:url("${image}");-moz-context-properties:fill;fill:currentColor;`;
        }
        item.onclick = this.open.bind(this, elm.parentElement);
        Object.defineProperty(item, "hidden", {});
        Object.defineProperty(item, "disabled", {});
        var style = `data:text/css;charset=utf-8,${encodeURIComponent(
`#placesContext {
#${id} {
display: none;
}
:is([id="placesContext_openBookmarkContainer:tabs"],[id="placesContext_openBookmarkLinks:tabs"],
[id="placesContext_openContainer:tabs"],[id="placesContext_openLinks:tabs"]):not([hidden],[disabled]) ~ #${id} {
display: revert;
}
}
${propertiesPending ? `:root[windowtype="navigator:browser"] .tabbrowser-tab:not([selected],[multiselected])[pending] .tab-label {${propertiesPending}}` : ""}`
)}`;
        windowUtils.loadSheetUsingURIString(style, windowUtils.USER_SHEET);
        elm.after(item);
    },
    async open({triggerNode: tn, _view: vw}, e) {
        var nodes;
        if (tn.matches("treechildren")) nodes = vw.selectedNode || vw.selectedNodes;
        else if (tn._placesNode && PlacesUtils.nodeIsContainer(tn._placesNode)) nodes = tn._placesNode;
        if (!nodes && !nodes?.length) nodes = vw.result.root;
        var items = PlacesUtils.nodeIsContainer(nodes)
            ? PlacesUtils.getURLsForContainerNode(nodes) : Array.from(nodes).filter(PlacesUtils.nodeIsURI);
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
            await new Promise(resolve => win.addEventListener("load", resolve, {once: true}));
        }
        var insertAfterCurrent = !newWin && Services.prefs.getBoolPref("browser.tabs.insertAfterCurrent");
        var multi = items.length > 1, gb = win.gBrowser;
        var params = {
            skipAnimation: multi || newWin,
            bulkOrderedOpen: multi
        };
        if (insertAfterCurrent) params.index = params.tabIndex = gb.selectedTab._tPos;
        var first = true;
        for (let {uri, title} of items) {
            if (insertAfterCurrent) params.index = params.tabIndex += 1;
            let state = {
                index: 1,
                tabIndex: 1,
                hidden: false,
                attributes: {},
                lastAccessed: 0,
                entries: [{url: uri, title, triggeringPrincipal_base64: win.E10SUtils.SERIALIZED_SYSTEMPRINCIPAL}]
            };
            let image = await PlacesUtils.favicons.getFaviconForPage(Services.io.newURI(uri), 32);
            if (image) state.image = image.dataURI.spec;
            let tab = gb.addTrustedTab(null, params);
            win.SessionStore.setTabState(tab, state);
            if (first) {
                first = false;
                if (newWin) continue;
                if (multi && insertAfterCurrent) params.index = params.tabIndex = tab._tPos
                if (where == "tabshifted") gb.selectedTab = tab;
            }
        }
    },
}).init())();
