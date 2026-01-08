/**
@UCF @param {"prop":"JsBackground","module":["autoCopyButtonChild","init"]} @UCF
*/
const lazy = {
    enabled: true, // Enabled by default or not
    blink: true, // Selected text blinks when autocopying
    id: "ucf-auto-copy-button",
    label: "autoCopyButton",
    tooltiptext: "Toggle auto-copy on the current page",
    image: "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='context-fill rgb(142, 142, 152)' fill-opacity='context-fill-opacity'><path d='M6 0a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm0 1h6a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1M3 2.268C2.402 2.614 2 3.26 2 4v8.5A3.5 3.5 0 0 0 5.5 16H10c.74 0 1.387-.402 1.732-1H5.5A2.5 2.5 0 0 1 3 12.5V2.27z'/></svg>",

    get reasons() {
        delete this.reasons;
        return this.reasons = new Set(["MOUSEUP", "KEYPRESS", "SELECTALL"].map(reason => Ci.nsISelectionListener[`${reason}_REASON`]));
    },
};
export class autoCopyButtonChild extends JSWindowActorChild {
    static init({CustomizableUI}, esModuleURI) {
        CustomizableUI.createWidget({
            id: lazy.id,
            label: lazy.label,
            tooltiptext: lazy.tooltiptext,
            defaultArea: CustomizableUI.AREA_NAVBAR,
            localized: false,
            get imageURL() {
                Services.io.getProtocolHandler("resource")
                    .QueryInterface(Ci.nsIResProtocolHandler)
                    .setSubstitution(this.id, Services.io.newURI(lazy.image));
                delete this.imageURL;
                return this.imageURL = `resource://${this.id}`;
            },
            onCreated(btn) {
                btn.style.setProperty("list-style-image", `url("${this.imageURL}")`);
            },
            onCommand(e) {
                var {browsingContext} = e.view.gBrowser.selectedBrowser;
                browsingContext.currentWindowGlobal.getActor("autoCopyButton")
                    .sendQuery("autoCopyButton:getToggle").then(state => {
                        state = Number(!state);
                        var contextsToVisit = [browsingContext];
                        while (contextsToVisit.length) {
                            let currentContext = contextsToVisit.pop();
                            let global = currentContext.currentWindowGlobal;
                            if (!global) continue;
                            let actor = global.getActor("autoCopyButton");
                            actor.sendAsyncMessage("autoCopyButton:Toggle", {state});
                            contextsToVisit.push(...currentContext.children);
                        }
                    });
            },
        });
        ChromeUtils.registerWindowActor("autoCopyButton", {
            child: {
                esModuleURI,
                events: {
                    pageshow: {},
                    pagehide: { createActor: false },
                }
            },
            messageManagerGroups: ["browsers"],
            matches: ["<all_urls>", "about:srcdoc"],
            allFrames: true,
        });
    }
    handleEvent(e) {
        this[e.type](e);
    }
    receiveMessage({name, data}) {
        switch (name) {
            case "autoCopyButton:getToggle":
                return this.enabled;
            case "autoCopyButton:Toggle":
                this.enabled = data.state;
        }
    }
    pageshow() {
        this.enabled = lazy.enabled;
        var notifySelectionChanged = this.changed.bind(this);
        (this.sel = this.document.getSelection())?.addSelectionListener(this.listener = { notifySelectionChanged });
    }
    pagehide() {
        this.sel?.removeSelectionListener(this.listener);
    }
    changed(doc, sel, reason) {
        if (!this.enabled || !lazy.reasons.has(reason) || !/\S/.test(sel)) return;
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
