/**
@UCF @param {"prop":"JsBackground","force":true} @UCF
@UCF @param {"prop":"JsAllChrome.load","ucfobj":true,"urlregxp":"^chrome:\\/\\/browser\\/content\\/places\\/(?:bookmarksSidebar|historySidebar|places)\\.xhtml"} @UCF
@UCF @param {"prop":"JsContent.pageshow","ucfobj":true,"urlregxp":"^chrome:\\/\\/browser\\/content\\/places\\/(?:bookmarksSidebar|historySidebar|places)\\.xhtml"} @UCF
*/
(async (
    id = "ucf-toggle-folders-scroll-position-tree",
    tooltipText = "Left-click: Close all top level folders\n((Ctrl | Shift) + Left-click) | Midle-click: Close all folders\nRight-click: Open all folders",
    image = "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><path style='fill:none;stroke:context-fill rgb(142, 142, 152);stroke-opacity:context-fill-opacity;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;' d='m 1.5,3.5 0,10 c 0,0 0,1 1,1 h 11 c 0,0 1,0 1,-1 v -8 c 0,-1 -1,-1 -1,-1 h -5 l -2,-2 h -4 c 0,0 -1,0 -1,1 z'/></svg>",
    scrollPosition = true,
    scrollPositionPref = "ucf.toggle_folders.position",
) => ({
    timer: null,
    JsBackground() {
        Services.io.getProtocolHandler("resource")
            .QueryInterface(Ci.nsIResProtocolHandler)
            .setSubstitution(id, Services.io.newURI(image));
    },
    JsAllChrome_load() {
        var toolbar = document.querySelector("hbox#sidebar-search-container, toolbar#placesToolbar");
        var tree = this.tree = document.querySelector("tree.sidebar-placesTree, tree.placesTree");
        if (!toolbar || !tree) return;
        var btn = document.createXULElement("toolbarbutton");
        btn.id = id;
        btn.onclick = this.toggle.bind(this);
        btn.tooltipText = tooltipText;
        Object.defineProperty(btn, "hidden", {});
        Object.defineProperty(btn, "disabled", {});
        toolbar.prepend(btn);
        var sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            #${id} {
                margin-inline: 0 2px !important;
                margin-block: 0 !important;
                padding: 4px !important;
                border: none !important;
                border-radius: var(--border-radius-small, 0) !important;
                min-width: 0 !important;
                appearance: none !important;
                background: none !important;
                align-self: center !important;
                list-style-image: url("resource://${id}") !important;
                -moz-context-properties: fill, stroke, fill-opacity;
                fill: currentColor;
                fill-opacity: .8;
                &:hover {
                    background: light-dark(rgba(0, 0, 0, .1), rgba(255, 255, 255, .15)) !important;
                }
                &:hover:active {
                    background: light-dark(rgba(0, 0, 0, .15), rgba(255, 255, 255, .1)) !important;
                }
            }
        `);
        document.adoptedStyleSheets.push(sheet);
        if (!scrollPosition || !(this.searchbox = document.querySelector("#search-box, #searchFilter"))) return scrollPosition = false;
        setUnloadMap(Symbol(id), this.destructor, this);
        this.treeId = tree.id;
        var treeBody = this.treeBody = tree.treeBody;
        treeBody.addEventListener("scroll", this);
        treeBody.addEventListener("underflow", this);
        treeBody.addEventListener("overflow", this);
        this.searchbox.addEventListener("MozInputSearch:search", this);
        this.scrollPosition();
    },
    JsContent_pageshow() {
        this.JsAllChrome_load();
    },
    handleEvent(e) {
        this[e.type](e);
    },
    underflow() {
        this._underflow = true;
    },
    overflow() {
        this._underflow = false;
    },
    scroll() {
        clearTimeout(this.timer);
        if (this._underflow) return;
        this.timer = setTimeout(() => {
            var { searchbox, tree, treeId } = this;
            if (!searchbox.value) Services.prefs.setIntPref(`${scrollPositionPref}_${treeId}`, tree.getFirstVisibleRow());
        }, 500);
    },
    select(e) {
        e.stopImmediatePropagation();
    },
    "MozInputSearch:search"() {
        this.scrollPosition();
    },
    scrollPosition() {
        var { searchbox, tree, treeId } = this;
        if (!searchbox.value) tree.scrollToRow(Services.prefs.getIntPref(`${scrollPositionPref}_${treeId}`, 0));
    },
    toggle(e) {
        if (this.start) return;
        var { view } = this.tree;
        if (view._isPlainContainer(view._rootNode)) return;
        this.start = true;
        var close = e.button < 2;
        var closeAll = e.button === 1 || e.button === 0 && (e.getModifierState("Control") || e.shiftKey);
        var index = view.rowCount, open, roots, sel;
        if (close) {
            sel = view.selection;
            let { count } = sel;
            if (count) {
                roots = new Set();
                let currRoot;
                for (let ind = 0; ind < index; ind++) {
                    let node = view._rows[ind];
                    if (node.indentLevel === 0) currRoot = node;
                    if (sel.isSelected(ind)) {
                        roots.add(currRoot);
                        if (!--count) break;
                    }
                }
            }
            this.tree.addEventListener("select", this, true);
        } else open = true;
        if (closeAll) for (let ind = index; ind >= 0; ind--) view.isContainer(ind) && view.isContainerOpen(ind) && view.toggleOpenState(ind);
        else {
            let TFS = Ci.nsINavHistoryResultNode.RESULT_TYPE_FOLDER_SHORTCUT;
            for (let ind = 0; ind < index; ind++) {
                if (!view.isContainer(ind) || view.isContainerOpen(ind) !== close) continue;
                if (open) {
                    let node = view._rows[ind];
                    if (node.type === TFS && node.indentLevel && !PlacesUtils.bookmarks.isVirtualRootItem(node.bookmarkGuid)) continue;
                }
                view.toggleOpenState(ind);
                index = view.rowCount;
            }
        }
        if (roots) {
            sel.clearSelection();
            for (let ind = 0, len = view.rowCount; ind < len; ind++)
                roots.has(view._rows[ind]) && sel.rangedSelect(ind, ind, true);
            roots.clear();
        }
        if (close) this.tree.removeEventListener("select", this, true);
        else if (scrollPosition) this.scrollPosition();
        this.start = false;
    },
    destructor() {
        var { treeBody } = this;
        treeBody.removeEventListener("scroll", this);
        treeBody.removeEventListener("underflow", this);
        treeBody.removeEventListener("overflow", this);
        this.searchbox.removeEventListener("MozInputSearch:search", this);
    },
})[getProp]())();
