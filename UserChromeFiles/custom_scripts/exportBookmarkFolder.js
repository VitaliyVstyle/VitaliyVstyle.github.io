/**
@UCF @param {"prop":"JsAllChrome.load","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|places))\\.xhtml"} @UCF
@UCF @param {"prop":"JsContent.pageshow","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|places))\\.xhtml"} @UCF
*/
(async (
    label = "Export folder to HTML",
    image = "chrome://global/skin/icons/arrows-updown.svg",
) => ({
    get dps() {
        delete this.dps;
        return this.dps = windowRoot.ownerGlobal.DownloadPaths || ChromeUtils.importESModule("resource://gre/modules/DownloadPaths.sys.mjs").DownloadPaths;
    },
    get exporter() {
        delete this.exporter;
        return this.exporter = windowRoot.ownerGlobal.UcfPrefs.dbg.ref("BookmarkExporter",
            (windowRoot.ownerGlobal.BookmarkHTMLUtils || ChromeUtils.importESModule("resource://gre/modules/BookmarkHTMLUtils.sys.mjs").BookmarkHTMLUtils).exportToFile);
    },
    init() {
        var sep = document.querySelector("#placesContext > #placesContext_openSeparator");
        if (!sep) return;
        var item = document.createXULElement("menuitem");
        item.id = "placesContext_exportFolder";
        item.label = label;
        if (image) {
            item.className = "menuitem-iconic";
            item.style.cssText = `--menuitem-icon:url("${image}");list-style-image:url("${image}");-moz-context-properties:fill;fill:currentColor;`;
        }
        item.setAttribute("selection-type", "single");
        item.setAttribute("node-type", "folder");
        item.onclick = this.export.bind(this, sep.parentElement);
        sep.before(item);
    },
    async export({triggerNode: tn, _view: vw}) {
        var pu = PlacesUtils, bm = pu.bookmarks, node;
        if (tn.matches("treechildren")) node = vw.selectedNode;
        else node = tn._placesNode;
        if (!node) node = vw.result.root;
        var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
        fp.init(browsingContext, PlacesUIUtils.promptLocalization.formatValueSync("places-bookmarks-export"), fp.modeSave);
        fp.appendFilters(fp.filterHTML);
        fp.defaultString = `${(node.title ? this.dps.sanitize(node.title) : "untitled")}.html`;
        if (await new Promise(fp.open) !== fp.returnOK) return;
        var tree = await pu.promiseBookmarksTree(pu.getConcreteItemGuid(node), {includeItemIds: true});
        tree.title = bm.getLocalizedTitle(tree);
        var bookmarks = {children: [
            {root: "toolbarFolder"},
            {root: "unfiledBookmarksFolder"},
            {root: "bookmarksMenuFolder", children: [tree], guid: bm.menuGuid}
        ]};
        new this.exporter(bookmarks).exportToFile(fp.file.path);
    },
}).init())();
