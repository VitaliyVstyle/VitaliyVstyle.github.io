/**
@UCF @param {"prop":"JsBackground","module":{"name":"openLinkNewTab","child":{"events":{"mousedown":{"capture":true}}},"allFrames":true,"messageManagerGroups":["browsers"],"matches":["<all_urls>"]}} @UCF
*/
const lazy = {
    allInNewTab: false,
    get excludeTags() {
        delete this.excludeTags;
        return this.excludeTags = new Set(["input", "textarea", "select", "option"]);
    },
};
export class openLinkNewTabChild extends JSWindowActorChild {
    handleEvent(e) {
        if (e.button || e.shiftKey || e.getModifierState("Control") || e.altKey) return;
        var node = e.composedTarget;
        if (lazy.excludeTags.has(node.localName)) return;
        var elmnode = Node.ELEMENT_NODE;
        do {
            if (node.nodeType !== elmnode) continue;
            if (node.matches(":any-link")) {
                try {
                    if (!node.matches("[href='#'],[href^='javascript:']")
                        && (lazy.allInNewTab || Services.io.newURI(node.href).asciiHost !== this.document.documentURIObject.asciiHost)) node.target = "_blank";
                } catch {}
                break;
            }
        } while (node = node.flattenedTreeParentNode);
    }
}
