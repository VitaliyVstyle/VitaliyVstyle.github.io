var UcfStylesScripts = {
    /** ************************▼ Settings ▼************************ */
    /**
    * Styles Settings:
    *   path: path to file from folder custom_styles
    *   type: style rights AGENT_SHEET,  AUTHOR_SHEET or USER_SHEET
    */
    stylescontent: [
        // { path: "example_content.css", type: "USER_SHEET", }, // <-- Example
    ],
    /**
    * Scripts Settings:
    *   path: path to the script from the folder custom_scripts
    *   urlregxp: The address where the script works in regular expression
    *   func: A function in the form of a string that will be executed when loading
    */
    scriptscontent: {
        DOMWindowCreated: [ // By event "DOMWindowCreated"

        ],
        DOMContentLoaded: [ // By event "DOMContentLoaded"
            // { path: "example_all_about.js", urlregxp: /about:.*/, }, // <-- Example
        ],
        pageshow: [ // By event "pageshow"
            // { path: "example_downloads.js", urlregxp: /about:downloads/, }, // <-- Example
        ],
    },
    /** ************************▲ Settings ▲************************ */

    preloadSheet(obj) {
        try {
            let UcfSSS = this.UcfSSS;
            let uri = Services.io.newURI(`chrome://user_chrome_files/content/custom_styles/${obj.path}`);
            let type = UcfSSS[obj.type];
            let preload = UcfSSS.preloadSheetAsync(uri, type);
            obj.sheet = async f => {
                try {
                    let prd = await preload;
                    f(prd, type);
                } catch (e) { }
            };
        } catch (e) {
            obj.sheet = () => {};
        }
    },
    get UcfSSS() {
        delete this.UcfSSS;
        return this.UcfSSS = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    },
    get _stylescontent() {
        for (let s of this.stylescontent)
            this.preloadSheet(s);
        delete this._stylescontent;
        this._stylescontent = this.stylescontent;
        delete this.stylescontent;
        return this._stylescontent;
    },
};

export class UcfCustomStylesScriptsChild extends JSWindowActorChild {
    actorCreated() {
        var win = this.contentWindow;
        var href = win?.location.href;
        if (!href || href === "about:blank") return;
        var { addSheet } = win.windowUtils;
        for (let s of UcfStylesScripts._stylescontent)
            s.sheet(addSheet);
        this.handleEvent = e => {
            for (let s of UcfStylesScripts.scriptscontent[e.type]) {
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
