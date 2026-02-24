/**
@UCF @param {"prop":"JsAllChrome.load","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|places))\\.xhtml"} @UCF
@UCF @param {"prop":"JsContent.pageshow","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|places))\\.xhtml"} @UCF
*/
(async (
    labelUndo = "Undo Entry",
    tooltipUndo = "Undo Entry\nR: Clear Undo Entries",
    imageUndo = "chrome://browser/skin/back.svg",
    labelRedo = "Redo Entry",
    tooltipRedo = "Redo Entry\nR: Clear Redo Entries",
    imageRedo = "chrome://browser/skin/forward.svg",
) => ({
    init() {
        var sep = this.sep = document.querySelector("#placesContext > #placesContext_deleteSeparator");
        if (!sep) return;
        this.createItem(labelUndo, tooltipUndo, imageUndo, "undo", "topUndoEntry", true);
        this.createItem(labelRedo, tooltipRedo, imageRedo, "redo", "topRedoEntry", false);
    },
    createItem(label, tooltip, image, unre, topunre, clear) {
        var item = document.createXULElement("menuitem");
        item.id = "placesCmd_undoRemove";
        item.label = label;
        item.tooltipText = tooltip;
        if (image) {
            item.className = "menuitem-iconic";
            item.style.cssText = `--menuitem-icon:url("${image}");list-style-image:url("${image}");-moz-context-properties:fill;fill:currentColor;`;
        }
        item.setAttribute("selection-type", "single|none");
        item.setAttribute("node-type", "link_bookmark|folder");
        item.onclick = e => e.button === 2
            ? PlacesTransactions.clearTransactionsHistory(clear, !clear)
            : PlacesTransactions[unre]().catch(Cu.reportError);
        var desc = Object.getOwnPropertyDescriptor(XULElement.prototype, "hidden");
        var { set } = desc;
        desc.set = val => set.call(item, val || !PlacesTransactions[topunre]);
        Object.defineProperty(item, "disabled", {});
        Object.defineProperty(item, "hidden", desc);
        this.sep.before(item);
    },
}).init())();
