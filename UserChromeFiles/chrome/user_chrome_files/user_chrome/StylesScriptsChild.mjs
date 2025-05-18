const lazy = {
    get UcfSSS() {
        delete this.UcfSSS;
        return this.UcfSSS = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    },
    get stylescontent() {
        delete this.stylescontent;
        for (let p of this.prefs._stylescontent)
            this.preloadSheet(p);
        return this.stylescontent = this.prefs._stylescontent;
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
export class UcfCustomStylesScriptsChild extends JSWindowActorChild {
    receiveMessage({data}) {
        if (data.type === "DOMWindowCreated") {
            lazy.prefs ??= data.prefs;
            let {addSheet} = this.contentWindow.windowUtils;
            for (let p of lazy.stylescontent)
                p.sheet(addSheet);
        }
        var {loadSubScript} = Services.scriptloader;
        for (let {urlregxp, path, func} of lazy.prefs._scriptscontent[data.type]) {
            try {
                if (!urlregxp || urlregxp.test(this.href)) {
                    if (path)
                        loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, this.contentWindow);
                    if (func)
                        loadSubScript(`data:charset=utf-8,${func}`, this.contentWindow);
                }
            } catch (ex) {Cu.reportError(ex);}
        }
    }
    handleEvent(e) {
        var href = this.href = this.contentWindow?.location.href;
        if (!href || href === "about:blank") {
            this.handleEvent = () => {};
            return;
        }
        (this.handleEvent = ({type}) => this.sendAsyncMessage("UcfCustomStylesScriptsActor:events", {type}))(e);
    }
}
