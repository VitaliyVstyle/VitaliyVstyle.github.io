/**
@UCF @param {"prop":"JsContent.pageshow","ucfobj":true,"urlregxp":"^https?:"} @UCF
*/
(async (
    allInNewTab = false,
) => ({
    get excludeTags() {
        delete this.excludeTags;
        return this.excludeTags = new Set(["input","textarea","select","option"]);
    },
    init() {
        setUnloadMap(Symbol(), this.destructor, this);
        contentWindow.addEventListener("mousedown", this, true);
    },
    handleEvent(e) {
        if (e.button || e.shiftKey || e.altKey || e.ctrlKey) return;
        var node = e.composedTarget;
        if (this.excludeTags.has(node.localName)) return;
        var elmnode = Node.ELEMENT_NODE;
        do {
            if (node.nodeType !== elmnode) continue;
            if (node.matches(":any-link")) {
                try {
                    if (!node.matches("[href='#'],[href^='javascript:'],[href^='addons:']")
                        && (allInNewTab || Services.io.newURI(node.href).asciiHost !== document.documentURIObject.asciiHost)) node.target = "_blank";
                } catch {}
                break;
            }
        } while (node = node.flattenedTreeParentNode);
    },
    destructor() {
        contentWindow.removeEventListener("mousedown", this, true);
    },
}).init())();
