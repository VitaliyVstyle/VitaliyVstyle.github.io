const lazy = {
    get UcfSSChild() {
        delete this.UcfSSChild;
        return this.UcfSSChild = ChromeUtils.importESModule("chrome://user_chrome_files/content/CustomStylesScripts.mjs").UcfStylesScriptsChild;
    },
    get UcfSSS() {
        delete this.UcfSSS;
        return this.UcfSSS = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    },
    get VER() {
        delete this.VER;
        return this.VER = parseInt(Services.appinfo.platformVersion);
    },
    get OS() {
        var {OS} = Services.appinfo;
        delete this.OS;
        switch (OS) {
            case "Linux":
                return this.OS = "linux";
            case "WINNT":
                return this.OS = "windows";
            case "Darwin":
                return this.OS = "macos";
            default:
                return this.OS = OS.toLowerCase();
        }
    },
    get _stylescontent() {
        for (let s of this.UcfSSChild.stylescontent)
            this.preloadSheet(s);
        delete this._stylescontent;
        return this._stylescontent = this.UcfSSChild.stylescontent;
    },
    preloadSheet(obj) {
        obj.type = lazy.UcfSSS[obj.type];
        obj.preload = async function() {
            this.preload = async function() {
                return this._preload;
            };
            return this._preload = (async () => {
                try {
                    let path = this.path || (((!this.isos || this.isos.includes(lazy.OS)) && (!this.ver || (!this.ver.min || this.ver.min <= lazy.VER) && (!this.ver.max || this.ver.max >= lazy.VER))) ? this.ospath.replace(/%OS%/g, lazy.OS) : undefined);
                    if (!path) throw null;
                    return this._preload = await lazy.UcfSSS.preloadSheetAsync(
                        Services.io.newURI(`chrome://user_chrome_files/content/custom_styles/${path}`),
                        this.type
                    );
                } catch {
                    obj.sheet = () => {};
                    return this._preload = await (async () => null)();
                }
            })();
        };
        obj.sheet = async function(func) {
            func(await this.preload(), this.type);
        };
        obj.preload();
    },
};
export class UcfCustomStylesScriptsChild extends JSWindowActorChild {
    handleEvent(event) {
        var win = this.contentWindow;
        var href = win?.location.href;
        if (!href || href === "about:blank") {
            this.handleEvent = () => {};
            return;
        }
        var {addSheet} = win.windowUtils;
        for (let s of lazy._stylescontent)
            s.sheet(addSheet);
        (this.handleEvent = e => {
            var {loadSubScript} = Services.scriptloader;
            for (let {urlregxp, path, ospath, isos, ver, func} of lazy.UcfSSChild.scriptscontent[e.type]) {
                try {
                    if (!urlregxp || urlregxp.test(href)) {
                        if (path)
                            loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, win);
                        else if (ospath && (!isos || isos.includes(lazy.OS)) && (!ver || (!ver.min || ver.min <= lazy.VER) && (!ver.max || ver.max >= lazy.VER)))
                            loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${ospath.replace(/%OS%/g, lazy.OS)}`, win);
                        if (func)
                            loadSubScript(`data:charset=utf-8,${encodeURIComponent(`${func}`)}`, win);
                    }
                } catch (ex) {Cu.reportError(ex);}
            }
        })(event);
    }
}
