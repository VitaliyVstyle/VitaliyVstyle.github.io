const lazy = {
    get UcfSSS() {
        delete this.UcfSSS;
        return this.UcfSSS = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    },
    get CssContent() {
        delete this.CssContent;
        for (let p of this.prefs.CssContent)
            this.preloadSheet(p);
        return this.CssContent = this.prefs.CssContent;
    },
    async preloadSheet(p) {
        p.type = this.UcfSSS[p.type];
        p.preload = async function() {
            this.preload = async function() {
                return this._preload;
            };
            return this._preload = (async () => {
                try {
                    return this._preload = await lazy.UcfSSS.preloadSheetAsync(
                        Services.io.newURI(`chrome://user_chrome_files/content/custom_styles/${this.path}`),
                        this.type
                    );
                } catch {
                    p.sheet = () => {};
                    return this._preload = await (async () => null)();
                }
            })();
        };
        p.sheet = async function(func) {
            func(await this.preload(), this.type);
        };
        p.preload();
    },
};
export class UcfWinActorChild extends JSWindowActorChild {
    async handleEvent(e) {
        var href = this.contentWindow?.location.href;
        if (!href || href === "about:blank") return this.handleEvent = () => {};
        this.__winRoot = e.currentTarget;
        var prefs = lazy.prefs ??= await this.sendQuery("UcfWinActor:Event");
        var {addSheet} = this.contentWindow.windowUtils;
        for (let p of lazy.CssContent)
            p.sheet(addSheet);
        var {loadSubScript} = Services.scriptloader;
        (this.handleEvent = ({type}) => {
            this.getProp = `JsContent_${type}`;
            for (let {urlregxp, ucfobj, path} of prefs.JsContent[type])
                try {
                    if (!urlregxp || urlregxp.test(href)) loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, ucfobj ? this : this.contentWindow);
                } catch (ex) {Cu.reportError(ex);}
        })(e);
    }
    receiveMessage(msg) {
        return this[msg.name]?.receiveMessage?.(msg);
    }
    setUnloadMap() {
        this.__unloadMap = new Map();
        this.__winRoot.addEventListener("pagehide", () => {
            this.__unloadMap.forEach((val, key) => {
                try { val.func.apply(val.context); } catch (e) {
                    if (!val.func) try { this[key].destructor(); } catch (e) {Cu.reportError(e);}
                    else Cu.reportError(e);
                }
            });
            this.__unloadMap.clear();
        }, { once: true });
        (this.setUnloadMap = (key, func, context) => {
            this.__unloadMap.set(key, {func, context});
        }).apply(this, arguments);
    }
    getDelUnloadMap(key, del) {
        var val = this.__unloadMap?.get(key);
        if (val && del) this.__unloadMap.delete(key);
        return val;
    }
}
