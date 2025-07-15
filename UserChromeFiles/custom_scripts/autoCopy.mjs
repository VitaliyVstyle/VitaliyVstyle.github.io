/**
@UCF @param {"prop":"JsBackground","module":{"name":"autoCopy","child":{"events":{"pageshow":{},"pagehide":{"createActor":false}}},"allFrames":true,"messageManagerGroups":["browsers"],"matches":["<all_urls>","about:srcdoc"]}} @UCF
*/
const lazy = {
    blink: true, // Selected text blinks when autocopying

    get reasons() {
        delete this.reasons;
        return this.reasons = new Set(["MOUSEUP", "KEYPRESS", "SELECTALL"].map(reason => Ci.nsISelectionListener[`${reason}_REASON`]));
    },
};
export class autoCopyChild extends JSWindowActorChild {
    handleEvent(e) {
        this[e.type](e);
    }
    pageshow() {
        var notifySelectionChanged = this.changed.bind(this);
        (this.sel = this.document.getSelection())?.addSelectionListener(this.listener = { notifySelectionChanged });
    }
    pagehide() {
        this.sel?.removeSelectionListener(this.listener);
    }
    changed(doc, sel, reason) {
        if (!lazy.reasons.has(reason) || !/\S/.test(sel)) return;
        this.docShell.doCommand("cmd_copy");
        if (!lazy.blink) return;
        var sc = this.docShell.QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsISelectionDisplay)
            .QueryInterface(Ci.nsISelectionController);
        this.contentWindow.setTimeout(this.repaint, 500, sc, sc.SELECTION_OFF);
        this.contentWindow.setTimeout(this.repaint, 800, sc, sc.SELECTION_ON);
    }
    repaint(sc, disp) {
        sc.setDisplaySelection(disp);
        sc.repaintSelection(sc.SELECTION_NORMAL);
    }
}
