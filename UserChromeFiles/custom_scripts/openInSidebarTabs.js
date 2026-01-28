/**
@UCF @param {"prop":"JsAllChrome.load","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|historySidebar|places))\\.xhtml"} @UCF
@UCF @param {"prop":"JsContent.pageshow","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|historySidebar|places))\\.xhtml"} @UCF
*/
(async (
    label = "Open in Sidebar Tabs",
    image = "resource://ucf_sidebar_tabs",
    index = 4, // Sidebar Tabs index
) => ({
    init() {
        for (let sep of document.querySelectorAll("#placesContext > #placesContext_openSeparator, #sidebar-history-context-menu > menuseparator:first-of-type")) {
            let item = document.createXULElement("menuitem");
            item.id = `${sep.parentElement.id}_open:sidebartabs`;
            item.label = label;
            if (image) {
                item.className = "menuitem-iconic";
                item.style.cssText = `--menuitem-icon:url("${image}");list-style-image:url("${image}");-moz-context-properties:fill;fill:currentColor;`;
            }
            item.setAttribute("selection-type", "single");
            item.setAttribute("node-type", "link");
            item.onclick = this.open.bind(this, sep.parentElement);
            sep.before(item);
        }
    },
    open({ triggerNode: tn, _view: vw }) {
        var { uri } = tn._placesNode || vw?.selectedNode || tn.triggerNode;
        if (uri) Services.wm.getMostRecentBrowserWindow()
            .ucf_custom_scripts_win.ucf_sidebar_tabs.setPanel(index, uri);
    },
}).init())();
