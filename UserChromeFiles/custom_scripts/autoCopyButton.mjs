/**
@UCF @param {"prop":"JsBackground","module":["autoCopyButtonChild.init"]} @UCF
*/
const lazy = {
    id: "ucf-auto-copy-button",
    label: "autoCopyButton",
    tooltiptext: "L: Toggle auto-copy\nM|R: Toggle auto-copy on the current page",
    image: "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><path style='fill:none;stroke:context-fill rgb(142, 142, 152);stroke-opacity:context-fill-opacity;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;' d='M6 .5h6c.8 0 1.5.7 1.5 1.5v10c0 .8-.7 1.5-1.5 1.5H6c-.8 0-1.5-.7-1.5-1.5V2c0-.8.7-1.5 1.5-1.5m5.5 15H5c-1.5 0-2.5-1-2.5-2.5V2.5'/></svg>",
    pref: "ucf.auto_copy.disabled",
    copyToClipboard: true,
    copyToSearchbar: false,
    startQuery: true, // Start query to show searchbar/urlbar result by fireing input event.
    blink: true, // Selected text blinks when autocopying
    copyStart: 200,
    blinkDuration: 150,

    get reasons() {
        delete this.reasons;
        return this.reasons = new Set(["MOUSEUP", "KEYPRESS", "SELECTALL", "JS"].map(reason => Ci.nsISelectionListener[`${reason}_REASON`]));
    },
    get disabled() {
        delete this.disabled;
        return this.disabled = Services.prefs.getBoolPref(this.pref, false);
    },
    get clipboard() {
        delete this.clipboard;
        return this.clipboard = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
    },
};
export class autoCopyButtonChild extends JSWindowActorChild {
    static async init({ CustomizableUI }, esModuleURI) {
        var { id, label, tooltiptext, image } = lazy;
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
            onClick({ view, button }) {
                switch (button) {
                    case 0:
                        let disabled = lazy.disabled = !Services.prefs.getBoolPref(lazy.pref, false);
                        Services.prefs.setBoolPref(lazy.pref, disabled);
                        for (let win of CustomizableUI.windows) {
                            this.sendMessage(win, "autoCopyButton:Toggle", { disabled });
                            let btn = widget.forWindow(win).node;
                            if (btn) this.setFill(btn, disabled);
                        }
                        break;
                    case 1:
                    case 2:
                        let { browsingContext } = view.gBrowser.selectedBrowser;
                        browsingContext.currentWindowGlobal.getActor("autoCopyButton")
                            .sendQuery("autoCopyButton:getToggle").then(disabled => {
                                disabled = !disabled;
                                this.sendMessage(view, "autoCopyButton:Toggle", { disabled }, true);
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
            parent: {
                esModuleURI,
            },
            child: {
                esModuleURI,
                events: {
                    selectstart: {},
                    pagehide: { createActor: false },
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
    receiveMessage({ name, data }) {
        switch (name) {
            case "autoCopyButton:getToggle":
                return this.disabled;
            case "autoCopyButton:Toggle":
                if (!data.selected) lazy.disabled = data.disabled;
                this.disabled = data.disabled;
        }
    }
    selectstart() {
        if (this.disabled) return;
        this.selectstart = () => { };
        this.tid = null;
        this.win = this.contentWindow;
        (this.sel = this.document.getSelection())?.addSelectionListener(this.listener = { notifySelectionChanged: this.changed.bind(this) });
    }
    pagehide() {
        this.sel?.removeSelectionListener(this.listener);
    }
    changed(doc, sel, reason) {
        if (this.disabled || this.win.clearTimeout(this.tid) || !lazy.reasons.has(reason) || !(sel = sel.toString().trim())) return;
        this.tid = this.win.setTimeout(() => {
            if (lazy.copyToClipboard) lazy.clipboard.copyStringToClipboard(sel, Ci.nsIClipboard.kGlobalClipboard);
            if (lazy.copyToSearchbar) this.sendAsyncMessage("autoCopyButton:setSearch", { sel });
            if (!lazy.blink) return;
            var sc = this.docShell.QueryInterface(Ci.nsIInterfaceRequestor)
                .getInterface(Ci.nsISelectionDisplay)
                .QueryInterface(Ci.nsISelectionController);
            this.repaint(sc, sc.SELECTION_OFF);
            this.win.setTimeout(() => this.repaint(sc, sc.SELECTION_ON), lazy.blinkDuration);
        }, lazy.copyStart);
    }
    repaint(sc, disp) {
        sc.setDisplaySelection(disp);
        sc.repaintSelection(sc.SELECTION_NORMAL);
    }
}
export class autoCopyButtonParent extends JSWindowActorParent {
    receiveMessage({ name, data }) {
        if (name !== "autoCopyButton:setSearch") return
        var doc = this.browsingContext.top.embedderElement.ownerDocument;
        for (let bar of doc.querySelectorAll("#search-container > [id^=searchbar]")) {
            if (bar._copyCutController && bar.search) bar.search(`? ${data.sel}`, { startQuery: lazy.startQuery });
            else if (bar._initialized && bar.openSuggestionsPanel) {
                bar.value = data.sel;
                if (lazy.startQuery) bar.openSuggestionsPanel();
            } else continue;
            return;
        }
        doc.defaultView.gURLBar.search(`? ${data.sel}`, { startQuery: lazy.startQuery });
    }
}
