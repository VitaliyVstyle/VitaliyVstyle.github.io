const lazy = {
    get UcfSSS() {
        delete this.UcfSSS;
        return this.UcfSSS = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    },
    set prefs(value) {
        for (let p of value.CssContent)
            this.preloadSheet(p);
        Object.defineProperty(this, "prefs", { configurable: true, writable: true, value, });
        delete lazy._prefs;
    },
    async preloadSheet(p) {
        p.type = this.UcfSSS[p.type];
        p.sheet = async function () {
            this.sheet = async func => func(await this._preload, this.type);
            this._preload = (async () => {
                try {
                    return this._preload = await lazy.UcfSSS.preloadSheetAsync(Services.io.newURI(this.path), this.type);
                } catch {
                    this.sheet = await (() => { });
                    return this._preload = await null;
                }
            })();
        };
        p.sheet();
    },
};
export class UcfWinActorChild extends JSWindowActorChild {
    get sandbox() {
        var win = this.contentWindow;
        var principal = win.document.nodePrincipal;
        var opts = {
            sandboxName: "UCF:JsContent",
            wantComponents: true,
            wantExportHelpers: true,
            wantXrays: true,
            sameZoneAs: win,
            sandboxPrototype: win,
        };
        if (!principal.isSystemPrincipal) {
            principal = [principal];
            opts.wantComponents = false;
        }
        var sandbox = Cu.Sandbox(principal, opts);
        Object.defineProperty(this, "sandbox", { configurable: true, writable: true, value: sandbox, });
        sandbox.getProp = this.getProp;
        Cu.exportFunction(this.setMap.bind(this), sandbox, { defineAs: "setUnloadMap" });
        Cu.exportFunction(this.getMap.bind(this), sandbox, { defineAs: "getDelUnloadMap" });
        this.unloadMap = new Map();
        win.addEventListener("unload", this.destructor.bind(this), { once: true });
        this.isSandbox = true;
        return sandbox;
    }
    setMap(key, func, context) {
        this.unloadMap.set(key, { func, context });
    }
    getMap(key, del) {
        var val = this.unloadMap.get(key);
        if (val && del) this.unloadMap.delete(key);
        return val;
    }
    destructor() {
        this.unloadMap.forEach((val, key) => {
            try { val.func.call(val.context, key); } catch (e) { Cu.reportError(e); }
        });
        this.unloadMap.clear();
        Cu.nukeSandbox(this.sandbox);
        this.unloadMap = this.sandbox = null;
    }
    async handleEvent() {
        var href = this.contentWindow?.location.href;
        if (!href || href === "about:blank") return this.handleEvent = () => { };
        var prefs = lazy.prefs ??= await (lazy._prefs ??= this.sendQuery("UcfWinActor:Prefs"));
        var { addSheet } = this.contentWindow.windowUtils;
        for (let p of prefs.CssContent)
            p.sheet(addSheet);
        var { loadSubScript } = Services.scriptloader;
        (this.handleEvent = ({ type }) => {
            this.getProp = `JsContent_${type}`;
            if (this.isSandbox) this.sandbox.getProp = this.getProp;
            for (let { urlregxp, ucfobj, path } of prefs.JsContent[type])
                try {
                    if (!urlregxp || urlregxp.test(href)) loadSubScript(path, ucfobj ? this.sandbox : this.contentWindow);
                } catch (ex) { Cu.reportError(ex); }
        }).apply(this, arguments);
    }
}
