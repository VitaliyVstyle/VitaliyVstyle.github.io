
const chromeUrl = "chrome://user_chrome_files/content/user_chrome/";
const scriptsUrl = "chrome://user_chrome_files/content/custom_scripts/";
const stylesUrl = "chrome://user_chrome_files/content/custom_styles/";
const { UcfPrefs } = ChromeUtils.importESModule(`${chromeUrl}UcfPrefs.mjs`);
ChromeUtils.defineLazyGetter(this, "UcfSSS", () => Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService));
ChromeUtils.defineLazyGetter(this, "VER", () => parseInt(Services.appinfo.platformVersion));
ChromeUtils.defineLazyGetter(this, "OS", () => {
    var { OS } = Services.appinfo;
    switch (OS) {
        case "Linux":
            return "linux";
        case "WINNT":
            return "windows";
        case "Darwin":
            return "macos";
        default:
            return OS.toLowerCase();
    }
});
const user_chrome = {
    get custom_styles_chrome() {
        this.initCustom();
        UcfPrefs.initAboutPrefs("prefs_tb.xhtml", "user-chrome-files");
        UcfPrefs.initAboutPrefs("options.xhtml", "user-chrome-files-options", true);
        delete this.custom_styles_chrome;
        return this.custom_styles_chrome = UcfPrefs.prefs.custom_styles_chrome;
    },
    async _CssChrome(prefs) {
        UcfPrefs._CssChrome = UcfPrefs.global.structuredClone(prefs.CssChrome).filter(p => {
            var { disable, path, isos, ver } = p;
            if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                p.path = `${stylesUrl}${path}`;
                this.preloadSheet(p);
                return true;
            }
        });
    },
    async _CssAllFrame(prefs) {
        UcfPrefs._CssAllFrame = UcfPrefs.global.structuredClone(prefs.CssAllFrame).filter(p => {
            var { disable, path, type, isos, ver } = p;
            if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                this.registerSheet(p.path = `${stylesUrl}${path}`, type);
                return true;
            }
        });
    },
    async _JsChrome(prefs) {
        var pfs = UcfPrefs._JsChrome = UcfPrefs.global.structuredClone(prefs.JsChrome);
        for (let type in pfs)
            UcfPrefs._JsChrome[type] = pfs[type].filter(p => {
                var { disable, path, isos, ver } = p;
                if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                    try {
                        p.path = `${scriptsUrl}${path}`;
                        return true;
                    } catch (e) { Cu.reportError(e); }
                }
            });
    },
    async _JsAllChrome(prefs) {
        var pfs = UcfPrefs._JsAllChrome = UcfPrefs.global.structuredClone(prefs.JsAllChrome);
        for (let type in pfs)
            UcfPrefs._JsAllChrome[type] = pfs[type].filter(p => {
                var { disable, path, isos, ver, urlregxp } = p;
                if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                    try {
                        p.path = `${scriptsUrl}${path}`;
                        p.urlregxp &&= new RegExp(urlregxp);
                        return true;
                    } catch (e) { Cu.reportError(e); }
                }
            });
    },
    init() {
        delete this.init;
        this._addObs();
        UcfPrefs.manifestPath = manifestPath;
        UcfPrefs.initPrefs;
        var { prefs } = UcfPrefs;
        if (prefs.custom_safemode || !Services.appinfo.inSafeMode) {
            UcfPrefs._user_chrome = this;
            if (prefs.custom_styles_chrome) this._CssChrome(prefs);
            if (prefs.custom_styles_all) this._CssAllFrame(prefs);
            if (prefs.custom_scripts_chrome) this._JsChrome(prefs);
            if (prefs.custom_scripts_all_chrome) this._JsAllChrome(prefs);
            if (prefs.custom_styles_scripts_child) {
                let cssjs = UcfPrefs._CssJsContent = {};
                cssjs.CssContent = UcfPrefs.global.structuredClone(prefs.CssContent).filter(p => {
                    var { disable, path, isos, ver } = p;
                    if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                        p.path = `${stylesUrl}${path}`;
                        return true;
                    }
                });
                let pfs = cssjs.JsContent = UcfPrefs.global.structuredClone(prefs.JsContent);
                for (let type in pfs)
                    cssjs.JsContent[type] = pfs[type].filter(p => {
                        var { disable, path, isos, ver, urlregxp } = p;
                        if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                            try {
                                p.path = `${scriptsUrl}${path}`;
                                p.urlregxp &&= new RegExp(urlregxp);
                                return true;
                            } catch (e) { Cu.reportError(e); }
                        }
                    });
                let actorOptions = {
                    parent: {
                        esModuleURI: `${chromeUrl}UcfWinActorParent.mjs`,
                    },
                    child: {
                        esModuleURI: `${chromeUrl}UcfWinActorChild.mjs`,
                        events: {
                            DOMWindowCreated: {},
                            DOMContentLoaded: {},
                            pageshow: {},
                        },
                    },
                    allFrames: true,
                };
                let group = prefs.custom_styles_scripts_groups;
                if (group.length) actorOptions.messageManagerGroups = group;
                let matches = prefs.custom_styles_scripts_matches;
                if (matches.length) actorOptions.matches = matches;
                ChromeUtils.registerWindowActor("UcfWinActor", actorOptions);
            }
        } else {
            prefs.custom_scripts_background = false;
            prefs.custom_scripts_chrome = false;
            prefs.custom_scripts_all_chrome = false;
            prefs.custom_styles_chrome = false;
            prefs.custom_styles_all = false;
            prefs.custom_styles_scripts_child = false;
        }
    },
    async preloadSheet(p) {
        p.type = UcfSSS[p.type];
        p.preload = async function () {
            this.preload = async () => this._preload;
            return this._preload = (async () => {
                try {
                    return this._preload = await UcfSSS.preloadSheetAsync(Services.io.newURI(this.path), this.type);
                } catch {
                    p.sheet = () => { };
                    return this._preload = await null;
                }
            })();
        };
        p.sheet = async function (func) {
            func(await this.preload(), this.type);
        };
        p.preload();
    },
    async registerSheet(path, type) {
        var uri = Services.io.newURI(path), t = UcfSSS[type];
        if (!UcfSSS.sheetRegistered(uri, t)) UcfSSS.loadAndRegisterSheet(uri, t);
        return uri;
    },
    unregisterSheet(uri, type) {
        var t = UcfSSS[type];
        if (UcfSSS.sheetRegistered(uri, t)) UcfSSS.unregisterSheet(uri, t);
    },
    observe(win, topic, data) {
        new UserChrome(win);
    },
    _addObs() {
        Services.obs.addObserver(this, "domwindowopened");
    },
    _removeObs() {
        Services.obs.removeObserver(this, "domwindowopened");
    },
    get customSandbox() {
        delete this.customSandbox;
        var scope = this.customSandbox = Cu.Sandbox(Services.scriptSecurityManager.getSystemPrincipal(), {
            sandboxName: "UCF:JsBackground",
            wantComponents: true,
            wantExportHelpers: true,
            sandboxPrototype: UcfPrefs.global,
        });
        scope.UcfPrefs = UcfPrefs;
        scope.getProp = "JsBackground";
        ChromeUtils.defineESModuleGetters(scope, {
            XPCOMUtils: "resource://gre/modules/XPCOMUtils.sys.mjs",
            AddonManager: "resource://gre/modules/AddonManager.sys.mjs",
            ExtensionParent: "resource://gre/modules/ExtensionParent.sys.mjs",
            AppConstants: "resource://gre/modules/AppConstants.sys.mjs",
            E10SUtils: "resource://gre/modules/E10SUtils.sys.mjs",
            FileUtils: "resource://gre/modules/FileUtils.sys.mjs",
            setTimeout: "resource://gre/modules/Timer.sys.mjs",
            setTimeoutWithTarget: "resource://gre/modules/Timer.sys.mjs",
            clearTimeout: "resource://gre/modules/Timer.sys.mjs",
            setInterval: "resource://gre/modules/Timer.sys.mjs",
            setIntervalWithTarget: "resource://gre/modules/Timer.sys.mjs",
            clearInterval: "resource://gre/modules/Timer.sys.mjs",
            PlacesUtils: "resource://gre/modules/PlacesUtils.sys.mjs",
        });
        ChromeUtils.defineLazyGetter(scope, "CustomizableUI", () => {
            try {
                return ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs").CustomizableUI;
            } catch {
                return ChromeUtils.importESModule("resource:///modules/CustomizableUI.sys.mjs").CustomizableUI;
            }
        });
        ChromeUtils.defineLazyGetter(scope, "console", () => UcfPrefs.global.console.createInstance({
            prefix: "custom_scripts_background",
        }));
        return scope;
    },
    async initCustom() {
        delete this.initCustom;
        var enable = UcfPrefs.prefs.custom_scripts_background;
        var { loadSubScript } = Services.scriptloader;
        UcfPrefs._JsBackground = UcfPrefs.global.structuredClone(UcfPrefs.prefs.JsBackground).filter(p => {
            var { disable, force, path, isos, ver, module } = p;
            if ((enable || force) && !disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                try {
                    let scope = this.customSandbox;
                    path = p.path = `${scriptsUrl}${path}`;
                    switch (!module || Object.prototype.toString.call(module).slice(8, -1)) {
                        case true:
                            loadSubScript(path, scope);
                            break;
                        case "Object":
                            if (module.parent) module.parent.esModuleURI = path;
                            if (module.child) module.child.esModuleURI = path;
                            ChromeUtils.registerWindowActor(module.name || path.replace(/^.+\/([^\.]+).+/, "$1"), module);
                            break;
                        case "Array":
                            let mod = ChromeUtils.importESModule(path);
                            for (let str of module) {
                                let md = mod;
                                for (let m of str.split("."))
                                    md = md[m];
                                md(scope, path);
                            }
                            break;
                        case "Boolean":
                            if (/\.mjs$/.test(path)) ChromeUtils.importESModule(path);
                            break;
                    }
                    return true;
                } catch (e) { Cu.reportError(e); }
            }
        });
    },
};
class UserChrome {
    constructor(win) {
        this.win = win;
        win.windowRoot.addEventListener("DOMDocElementInserted", this);
    }
    handleEvent(e) {
        var w = e.target.defaultView, { href } = w.location;
        if (this.win == w) {
            this.handleEvent = this.handle;
            this.win.addEventListener("unload", () => this.win.windowRoot.removeEventListener("DOMDocElementInserted", this), { once: true });
        }
        if (!w.isChromeWindow || href === "about:blank") return;
        new InitWin(w, href);
    }
    handle(e) {
        var w = e.target.defaultView, { href } = w.location;
        if (!w.isChromeWindow || href === "about:blank") return;
        new InitWin(w, href);
    }
}
class InitWin {
    constructor(win, href) {
        if (user_chrome.custom_styles_chrome) this.addStylesChrome(win.windowUtils.addSheet);
        if ((this.principal = win.document.nodePrincipal).isSystemPrincipal) win.UcfPrefs = UcfPrefs;
        this.win = win;
        if (href === "chrome://messenger/content/messenger.xhtml") {
            win.addEventListener("DOMContentLoaded", async e => {
                var [{ value }] = await UcfPrefs.formatMessages("main.ftl", ["ucf-open-about-config-button"]);
                var icon = `${chromeUrl}svg/prefs.svg`;
                win.document.querySelector("menuitem#addonsManager")?.after((() => {
                    var mitem = win.document.createXULElement("menuitem");
                    mitem.setAttribute("label", value);
                    mitem.id = "ucf-open-about-config-mitem";
                    mitem.className = "menuitem-iconic";
                    mitem.style.cssText = `--menuitem-icon:url("${icon}");list-style-image:url("${icon}");-moz-context-properties:fill,stroke,fill-opacity;stroke:currentColor;fill-opacity:var(--toolbarbutton-icon-fill-opacity,.8);`;
                    mitem.addEventListener("command", e => UcfPrefs.openHavingURI(e.view, "about:user-chrome-files", true));
                    return mitem;
                })());
                win.document.querySelector("toolbarbutton#appmenu_addons")?.after((() => {
                    var btn = win.document.createXULElement("toolbarbutton");
                    btn.setAttribute("label", value);
                    btn.id = "ucf-open-about-config-btn";
                    btn.className = "subviewbutton subviewbutton-iconic";
                    btn.style.cssText = `list-style-image:url("${icon}");`;
                    btn.addEventListener("command", e => UcfPrefs.openHavingURI(e.view, "about:user-chrome-files", true));
                    return btn;
                })());
            }, { once: true });
            if (UcfPrefs.prefs.custom_scripts_chrome) {
                this.prop = "JsChrome_DOMContentLoaded";
                win.addEventListener("DOMContentLoaded", e => this.addJsChrome(e.type), { once: true });
                win.addEventListener("load", e => {
                    this.prop = "JsChrome_load";
                    if (this.isObj) this.obj.getProp = "JsChrome_load";
                    this.addJsChrome("load");
                }, { once: true });
            }
        }
        if (UcfPrefs.prefs.custom_scripts_all_chrome) {
            this.propAll = "JsAllChrome_DOMContentLoaded";
            win.addEventListener("DOMContentLoaded", e => this.addJsAllChrome(e.type, href), { once: true });
            win.addEventListener("load", e => {
                this.propAll = "JsAllChrome_load";
                if (this.isObjAll) this.objAll.getProp = "JsAllChrome_load";
                this.addJsAllChrome("load", href);
            }, { once: true });
        }
    }
    get obj() {
        var ob = (new createObj(this.win, this.principal, "ucf_custom_scripts_win", "UCF:JsChrome", this.prop)).obj;
        Object.defineProperty(this, "obj", { configurable: true, writable: true, value: ob, });
        this.isObj = true;
        return ob;
    }
    get objAll() {
        var ob = (new createObj(this.win, this.principal, "ucf_custom_scripts_all_win", "UCF:JsAllChrome", this.propAll)).obj;
        Object.defineProperty(this, "objAll", { configurable: true, writable: true, value: ob, });
        this.isObjAll = true;
        return ob;
    }
    async addStylesChrome(func) {
        for (let p of UcfPrefs._CssChrome)
            p.sheet(func);
    }
    addJsChrome(type) {
        var { loadSubScript } = Services.scriptloader;
        for (let { ucfobj, path } of UcfPrefs._JsChrome[type]) {
            try {
                loadSubScript(path, ucfobj ? this.obj : this.win);
            } catch (e) { Cu.reportError(e); }
        }
    }
    addJsAllChrome(type, href) {
        var { loadSubScript } = Services.scriptloader;
        for (let { urlregxp, ucfobj, path } of UcfPrefs._JsAllChrome[type]) {
            try {
                if (!urlregxp || urlregxp.test(href)) loadSubScript(path, ucfobj ? this.objAll : this.win);
            } catch (e) { Cu.reportError(e); }
        }
    }
}
class createObj {
    constructor(win, principal, defineAs, sandboxName, prop = "") {
        var ob, opts = {
            sandboxName,
            wantComponents: true,
            wantExportHelpers: true,
            wantXrays: true,
            sameZoneAs: win,
            sandboxPrototype: win,
        };
        if (principal.isSystemPrincipal) {
            ob = Cu.createObjectIn(win, { defineAs });
            ChromeUtils.defineLazyGetter(ob, "sandboxWinSysPrincipal", () => {
                var sandbox = Cu.Sandbox(principal, opts);
                Object.defineProperty(sandbox.Function.prototype, "toSource", { configurable: true, writable: true, value: win.Function.prototype.toSource });
                Object.defineProperty(sandbox.Object.prototype, "toSource", { configurable: true, writable: true, value: win.Object.prototype.toSource });
                Object.defineProperty(sandbox.Array.prototype, "toSource", { configurable: true, writable: true, value: win.Array.prototype.toSource });
                this.isSandboxSys = true;
                return sandbox;
            });
        } else {
            opts.wantComponents = false;
            ob = Cu.Sandbox([principal], opts);
            this.isSandboxExp = true;
        }
        ob.getProp = prop;
        Cu.exportFunction(this.setMap.bind(this), ob, { defineAs: "setUnloadMap" });
        Cu.exportFunction(this.getMap.bind(this), ob, { defineAs: "getDelUnloadMap" });
        this.unloadMap = new Map();
        win.addEventListener("unload", this.destructor.bind(this), { once: true });
        this.obj = ob;
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
        if (this.isSandboxSys) {
            Cu.nukeSandbox(this.obj.sandboxWinSysPrincipal);
            this.obj.sandboxWinSysPrincipal = null;
        }
        if (this.isSandboxExp) Cu.nukeSandbox(this.obj);
        this.obj = null;
    }
}
user_chrome.init();
