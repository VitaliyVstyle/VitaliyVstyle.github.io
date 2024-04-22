var UcfStylesScriptsChild = {
    get UcfSSChild() {
        delete this.UcfSSChild;
        return this.UcfSSChild = ChromeUtils.importESModule("chrome://user_chrome_files/content/CustomStylesScripts.mjs").UcfStylesScriptsChild;
    },
    get UcfSSS() {
        delete this.UcfSSS;
        return this.UcfSSS = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    },
    get _stylescontent() {
        for (let s of this.UcfSSChild.stylescontent)
            this.preloadSheet(s);
        delete this._stylescontent;
        return this._stylescontent = this.UcfSSChild.stylescontent;
    },
    preloadSheet(obj) {
        try {
            let UcfSSS = this.UcfSSS;
            obj.type = UcfSSS[obj.type];
            obj.preload = async function() {
                this.preload = async function() {
                    return this._preload;
                };
                return this._preload = new Promise(async resolve => {
                    var preload = await UcfSSS.preloadSheetAsync(
                        Services.io.newURI(`chrome://user_chrome_files/content/custom_styles/${this.path}`),
                        this.type
                    );
                    this._preload = preload;
                    resolve(preload);
                });
            };
            obj.sheet = async function(f) {
                let prd = await this.preload();
                f(prd, this.type);
            };
            obj.preload();
        } catch (e) {
            obj.sheet = () => {};
        }
    },
};

export class UcfCustomStylesScriptsChild extends JSWindowActorChild {
    actorCreated() {
        var win = this.contentWindow;
        var href = win?.location.href;
        if (!href || href === "about:blank") return;
        var { addSheet } = win.windowUtils;
        for (let s of UcfStylesScriptsChild._stylescontent)
            s.sheet(addSheet);
        this.handleEvent = e => {
            for (let s of UcfStylesScriptsChild.UcfSSChild.scriptscontent[e.type]) {
                try {
                    if (s.urlregxp.test(href)) {
                        let win = this.contentWindow;
                        if (s.path)
                            Services.scriptloader.loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${s.path}`, win, "UTF-8");
                        if (s.func)
                            new win.Function(s.func).apply(win, null);
                    }
                } catch (e) {}
            }
        }
    }
    handleEvent(e) {}
}
