/**
@UCF @param {"prop":"JsBackground","module":["autoCopyButtonChild.init"]} @UCF
*/
const lazy = {
    blink: true, // Selected text blinks when autocopying
    id: "ucf-auto-copy-button",
    label: "autoCopyButton",
    tooltiptext: "Left-click: Toggle auto-copy\nMidle-click | Right-click: Toggle auto-copy on the current page",
    image: "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='context-fill rgb(142, 142, 152)' fill-opacity='context-fill-opacity'><path d='M6 0a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm0 1h6a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1M3 2.268C2.402 2.614 2 3.26 2 4v8.5A3.5 3.5 0 0 0 5.5 16H10c.74 0 1.387-.402 1.732-1H5.5A2.5 2.5 0 0 1 3 12.5V2.27z'/></svg>",
    pref: "ucf.auto_copy.disabled",

    get reasons() {
        delete this.reasons;
        return this.reasons = new Set(["MOUSEUP", "KEYPRESS", "SELECTALL"].map(reason => Ci.nsISelectionListener[`${reason}_REASON`]));
    },
    get disabled() {
        delete this.disabled;
        return this.disabled = Services.prefs.getBoolPref(`${this.pref}`, false);
    },
};
export class autoCopyButtonChild extends JSWindowActorChild {
    static async init({CustomizableUI}, esModuleURI) {
        var {id, label, tooltiptext, image} = lazy;
        var widget = CustomizableUI.createWidget({
            id, label, tooltiptext,
            defaultArea: CustomizableUI.AREA_NAVBAR,
            localized: false,
            get imageURL() {
                Services.io.getProtocolHandler("resource")
                    .QueryInterface(Ci.nsIResProtocolHandler)
                    .setSubstitution(this.id, Services.io.newURI(image));
                delete this.imageURL;
                return this.imageURL = `resource://${this.id}`;
            },
            onCreated(btn) {
                btn.toggleAttribute("context", true);
                this.setFill(btn, lazy.disabled);
                btn.style.setProperty("list-style-image", `url("${this.imageURL}")`);
            },
            onClick({view, button}) {
                switch (button) {
                    case 0:
                        let disabled = lazy.disabled = !Services.prefs.getBoolPref(`${lazy.pref}`, false);
                        Services.prefs.setBoolPref(`${lazy.pref}`, disabled);
                        for (let win of CustomizableUI.windows) {
                            this.sendMessage(win, "autoCopyButton:Toggle", {disabled});
                            let btn = widget.forWindow(win).node;
                            if (btn) this.setFill(btn, disabled);
                        }
                        break;
                    case 1:
                    case 2:
                        let {browsingContext} = view.gBrowser.selectedBrowser;
                        browsingContext.currentWindowGlobal.getActor("autoCopyButton")
                            .sendQuery("autoCopyButton:getToggle").then(disabled => {
                                disabled = !disabled;
                                this.sendMessage(view, "autoCopyButton:Toggle", {disabled}, true);
                            });
                }
            },
            setFill(btn, disabled) {
                if (disabled) btn.style.setProperty("fill", "color-mix(in srgb, currentColor 20%, #e31b5d)");
                else btn.style.removeProperty("fill");
            },
            sendMessage(win, message, data, selected = false) {
                data.selected = selected;
                var browsers = !selected ? win.gBrowser.browsers : [win.gBrowser.selectedBrowser];
                for (let browser of browsers) {
                    let contextsToVisit = [browser.browsingContext];
                    while (contextsToVisit.length) {
                        let currentContext = contextsToVisit.pop();
                        let global = currentContext?.currentWindowGlobal;
                        if (!global) continue;
                        let actor;
                        try {
                            actor = global.getActor("autoCopyButton");
                        } catch {
                            continue;
                        }
                        actor.sendAsyncMessage(message, data);
                        contextsToVisit.push(...currentContext.children);
                    }
                }
            },
        });
        ChromeUtils.registerWindowActor("autoCopyButton", {
            child: {
                esModuleURI,
                events: {
                    selectstart: {},
                    pagehide: {createActor: false},
                }
            },
            messageManagerGroups: ["browsers"],
            matches: ["<all_urls>", "about:srcdoc"],
            allFrames: true,
        });
    }
    actorCreated() {
        this.disabled = lazy.disabled;
    }
    handleEvent(e) {
        this[e.type](e);
    }
    receiveMessage({name, data}) {
        switch (name) {
            case "autoCopyButton:getToggle":
                return this.disabled;
            case "autoCopyButton:Toggle":
                if (!data.selected) lazy.disabled = data.disabled;
                this.disabled = data.disabled;
        }
    }
    selectstart() {
        this.selectstart = () => {};
        var notifySelectionChanged = this.changed.bind(this);
        (this.sel = this.document.getSelection())?.addSelectionListener(this.listener = {notifySelectionChanged});
    }
    pagehide() {
        this.sel?.removeSelectionListener(this.listener);
    }
    changed(doc, sel, reason) {
        if (this.disabled || !lazy.reasons.has(reason) || !/\S/.test(sel)) return;
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
