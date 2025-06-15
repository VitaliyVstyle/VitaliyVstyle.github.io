const lazy = {
    get UcfSSS() {
        delete this.UcfSSS;
        return this.UcfSSS = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    },
    get CssContent() {
        delete this.CssContent;
        for (let p of this.prefs._CssContent)
            this.preloadSheet(p);
        return this.CssContent = this.prefs._CssContent;
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
    receiveMessage({data}) {
        if (data.type === "DOMWindowCreated") {
            lazy.prefs ??= data.prefs;
            let {addSheet} = this.contentWindow.windowUtils;
            for (let p of lazy.CssContent)
                p.sheet(addSheet);
        }
        var {loadSubScript} = Services.scriptloader;
        for (let {urlregxp, path} of lazy.prefs._JsContent[data.type]) {
            try {
                if (!urlregxp || urlregxp.test(this.href)) loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, this.contentWindow);
            } catch (ex) {Cu.reportError(ex);}
        }
    }
    handleEvent(e) {
        var href = this.href = this.contentWindow?.location.href;
        if (!href || href === "about:blank") {
            this.handleEvent = () => {};
            return;
        }
        (this.handleEvent = ({type}) => this.sendAsyncMessage("UcfWinActor:Event", {type}))(e);
    }
}
