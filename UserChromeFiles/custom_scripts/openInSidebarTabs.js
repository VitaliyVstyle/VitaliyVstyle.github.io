/**
@UCF @param {"prop":"JsAllChrome.load","urlregxp":"chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|historySidebar|places))\\.xhtml"} @UCF
@UCF @param {"prop":"JsContent.pageshow","urlregxp":"chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|historySidebar|places))\\.xhtml"} @UCF
*/
(async (
    label = "Открыть в Sidebar Tabs",
    image = "resource://ucf_sidebar_tabs",
    index = 4, // tab index
) => ({
    init() {
        for (let sep of document.querySelectorAll("#placesContext > #placesContext_openSeparator, #sidebar-history-context-menu > menuseparator:first-of-type")) {
            let item = document.createXULElement("menuitem");
            item.id = "placesContext_open:sidebartabs";
            item.label = label;
            if (image) {
                item.className = "menuitem-iconic";
                item.style.cssText = `list-style-image:url("${image}");-moz-context-properties:fill;fill:currentColor;`;
            }
            item.setAttribute("selection-type", "single");
            item.setAttribute("node-type", "link");
            item.onclick = this.open;
            sep.before(item);
        }
    },
    open(e) {
        var popup = e.currentTarget.parentElement;
        var {uri} = popup.triggerNode._placesNode || popup._view?.selectedNode || popup.triggerNode.triggerNode;
        Services.wm.getMostRecentBrowserWindow()
            .ucf_custom_scripts_win.ucf_sidebar_tabs.setPanel(index, uri);
    },
}).init())();
