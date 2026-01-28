/**
@UCF @param {"prop":"JsAllChrome.load","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/bookmarksSidebar)\\.xhtml"} @UCF
@UCF @param {"prop":"JsContent.pageshow","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/bookmarksSidebar)\\.xhtml"} @UCF
*/
(async (
    label = "Open in library",
    image = "chrome://browser/skin/library.svg",
    openFoldersInRightPane = false,
) => ({
    init() {
        var elm = document.querySelector("#placesContext > #placesContext_openSeparator");
        if (!elm) return;
        var item = document.createXULElement("menuitem");
        item.id = "placesContext_open:library";
        item.label = label;
        if (image) {
            item.className = "menuitem-iconic";
            item.style.cssText = `--menuitem-icon:url("${image}");list-style-image:url("${image}");-moz-context-properties:fill;fill:currentColor;`;
        }
        item.setAttribute("selection-type", "single");
        item.setAttribute("node-type", "link_bookmark|folder");
        item.onclick = this.open.bind(this, elm.parentElement);
        elm.before(item);
    },
    open({ triggerNode: tn, _view: vw }) {
        var node;
        if (tn.matches("treechildren")) node = vw.selectedNode;
        else node = tn._placesNode;
        if (!node) node = vw.result.root;
        var data = [
            node.bookmarkGuid,
            node.parent?.bookmarkGuid,
            (PlacesUtils.nodeIsFolderOrShortcut || PlacesUtils.nodeIsFolder)(node),
            node.pageGuid
        ];
        var win = Services.wm.getMostRecentWindow("Places:Organizer");
        if (win) return win.focus(this.onLibrary(win, data));
        win = windowRoot.ownerGlobal.openDialog("chrome://browser/content/places/places.xhtml", "", "chrome,toolbar=yes,dialog=no,resizable");
        win.addEventListener("pageshow", () => this.onLibrary(win, data), { once: true });
    },
    async onLibrary(win, data) {
        var [guid, parentGuid, isFolder, pageGuid] = data;
        var list = win.document.querySelector("#placesList");
        var tree = win.document.querySelector("#placeContent");
        var onlyLeft = isFolder && !openFoldersInRightPane;
        var search = tree.result.root.uri.startsWith("place:terms=");
        var vRoot = PlacesUtils.virtualAllBookmarksGuid;
        if (!onlyLeft || search) {
            if (PlacesUtils.bookmarks.userContentRoots.includes(guid)) parentGuid = vRoot;
            else if (!parentGuid) parentGuid = (await PlacesUtils.bookmarks.fetch(guid))?.parentGuid;
        }
        if (search) {
            var trgGuid = onlyLeft ? guid : parentGuid;
            if (PlacesUtils.getConcreteItemGuid(list.selectedNode) == trgGuid) list.selectItems([vRoot]);
            else {
                var rows = list.view._rows, lastRow = rows[rows.length - 1];
                if (lastRow.bookmarkGuid == vRoot) lastRow.containerOpen = true;
            }
        }
        if (onlyLeft) {
            list.selectItems([guid]);
            return list.focus(this.scroll(list));
        }
        list.selectItems([parentGuid]);
        this.scroll(list);
        if (guid) tree.selectItems([guid]);
        else if (pageGuid) {
            var ind = tree.view._rows.findIndex(r => r.pageGuid && r.pageGuid == pageGuid);
            if (ind != -1) {
                tree.view.selection.clearSelection();
                tree.view.selection.rangedSelect(ind, ind, true);
            }
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        tree.focus(this.scroll(tree));
    },
    scroll(tree) {
        var pos = .35;
        var visibleRows = tree.getPageLength();
        var ind = tree.view.selection.currentIndex;
        var first = tree.getFirstVisibleRow();
        var newFirst = ind - pos * visibleRows + 1;
        tree.scrollByLines(Math.round(newFirst - first));
    },
}).init())();
