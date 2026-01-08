
const {UcfPrefs} = ChromeUtils.importESModule("chrome://user_chrome_files/content/user_chrome/UcfPrefs.mjs");
ChromeUtils.defineLazyGetter(this, "UcfSSS", () => Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService));
ChromeUtils.defineLazyGetter(this, "VER", () => parseInt(Services.appinfo.platformVersion));
ChromeUtils.defineLazyGetter(this, "OS", () => {
    var {OS} = Services.appinfo;
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
const scriptsUrl = "chrome://user_chrome_files/content/custom_scripts/";
const stylesUrl = "chrome://user_chrome_files/content/custom_styles/";
const user_chrome = {
    get custom_styles_chrome() {
        this.initCustom();
        UcfPrefs.initAboutPrefs("prefs_tb.xhtml", "user-chrome-files");
        UcfPrefs.initAboutPrefs("options.xhtml", "user-chrome-files-options", true);
        delete this.custom_styles_chrome;
        return this.custom_styles_chrome = UcfPrefs.prefs.custom_styles_chrome;
    },
    init() {
        this.addObs();
        UcfPrefs.manifestPath = manifestPath;
        UcfPrefs.initPrefs();
        var {prefs} = UcfPrefs;
        if (prefs.custom_safemode || !Services.appinfo.inSafeMode) {
            UcfPrefs.user_chrome = this;
            if (prefs.custom_styles_chrome)
                (async () => {
                    UcfPrefs._CssChrome = UcfPrefs.global.structuredClone(UcfPrefs.prefs.CssChrome).filter(p => {
                        var {disable, isos, ver} = p;
                        if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                            this.preloadSheet(p);
                            return true;
                        }
                    });
                })();
            if (prefs.custom_styles_all)
                (async () => {
                    for (let p of UcfPrefs.prefs.CssAllFrame)
                        this.registerSheet(p);
                })();
            if (UcfPrefs.prefs.custom_scripts_chrome) {
                (async () => {
                    var pfs = UcfPrefs._JsChrome = UcfPrefs.global.structuredClone(UcfPrefs.prefs.JsChrome);
                    for (let type in pfs)
                        UcfPrefs._JsChrome[type] = pfs[type].filter(({disable, isos, ver}) => {
                            try {
                                if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) return true;
                            } catch (e) {Cu.reportError(e);}
                        });
                })();
            }
            if (prefs.custom_scripts_all_chrome)
                (async () => {
                    var pfs = UcfPrefs._JsAllChrome = UcfPrefs.global.structuredClone(UcfPrefs.prefs.JsAllChrome);
                    for (let type in pfs)
                        UcfPrefs._JsAllChrome[type] = pfs[type].filter(p => {
                            try {
                                let {disable, isos, ver, urlregxp} = p;
                                if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                                    p.urlregxp &&= new RegExp(urlregxp);
                                    return true;
                                }
                            } catch (e) {Cu.reportError(e);}
                        });
                })();
            if (prefs.custom_styles_scripts_child)
                (async () => {
                    var cssjs = UcfPrefs._CssJsContent = {};
                    cssjs.CssContent = UcfPrefs.global.structuredClone(UcfPrefs.prefs.CssContent).filter(({disable, isos, ver}) => {
                        if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) return true;
                    });
                    var pfs = cssjs.JsContent = UcfPrefs.global.structuredClone(UcfPrefs.prefs.JsContent);
                    for (let type in pfs)
                        cssjs.JsContent[type] = pfs[type].filter(p => {
                            try {
                                let {disable, isos, ver, urlregxp} = p;
                                if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                                    p.urlregxp &&= new RegExp(urlregxp);
                                    return true;
                                }
                            } catch (e) {Cu.reportError(e);}
                        });
                    var actorOptions = {
                        parent: {
                            esModuleURI: "chrome://user_chrome_files/content/user_chrome/UcfWinActorParent.mjs",
                        },
                        child: {
                            esModuleURI: "chrome://user_chrome_files/content/user_chrome/UcfWinActorChild.mjs",
                            events: {
                                DOMWindowCreated: {},
                                DOMContentLoaded: {},
                                pageshow: {},
                            },
                        },
                        allFrames: true,
                    };
                    var group = prefs.custom_styles_scripts_groups;
                    if (group.length) actorOptions.messageManagerGroups = group;
                    var matches = prefs.custom_styles_scripts_matches;
                    if (matches.length) actorOptions.matches = matches;
                    ChromeUtils.registerWindowActor("UcfWinActor", actorOptions);
                })();
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
        p.preload = async function() {
            this.preload = async function() {
                return this._preload;
            };
            return this._preload = (async () => {
                try {
                    return this._preload = await UcfSSS.preloadSheetAsync(
                        Services.io.newURI(`${stylesUrl}${this.path}`),
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
    async registerSheet({disable, path, type, isos, ver}) {
        if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
            let uri = Services.io.newURI(`${stylesUrl}${path}`);
            let t = UcfSSS[type];
            if (!UcfSSS.sheetRegistered(uri, t)) UcfSSS.loadAndRegisterSheet(uri, t);
        }
    },
    observe(win, topic, data) {
        new UserChrome(win);
    },
    addObs() {
        Services.obs.addObserver(this, "domwindowopened");
    },
    removeObs() {
        Services.obs.removeObserver(this, "domwindowopened");
    },
    get customSandbox() {
        delete this.customSandbox;
        var scope = this.customSandbox = Cu.Sandbox(Services.scriptSecurityManager.getSystemPrincipal(), {
            wantComponents: true,
            sandboxName: "UCF: JsBackground",
            sandboxPrototype: UcfPrefs.global,
        });
        scope.UcfPrefs = UcfPrefs;
        scope.user_chrome = this;
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
        var enable = UcfPrefs.prefs.custom_scripts_background;
        var {loadSubScript} = Services.scriptloader;
        for (let {disable, force, path, isos, ver, module} of UcfPrefs.global.structuredClone(UcfPrefs.prefs.JsBackground))
            try {
                if (!(enable || force) || disable) continue;
                if ((!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                    let scope = this.customSandbox;
                    switch (!module || Object.prototype.toString.call(module).slice(8, -1)) {
                        case true:
                            loadSubScript(`${scriptsUrl}${path}`, scope);
                            break;
                        case "Object":
                            if (module.parent) module.parent.esModuleURI = `${scriptsUrl}${path}`;
                            if (module.child) module.child.esModuleURI = `${scriptsUrl}${path}`;
                            ChromeUtils.registerWindowActor(module.name || path.replace(/\..+$/, ""), module);
                            break;
                        case "Array":
                            let p = `${scriptsUrl}${path}`;
                            let mod = ChromeUtils.importESModule(p);
                            let func = module[1].split(",");
                            for (let [ind, imp] of module[0].split(",").entries())
                                mod[imp][func[ind] || func[0]](scope, p);
                            break;
                        case "Boolean":
                            if (/\.mjs$/.test(path)) ChromeUtils.importESModule(`${scriptsUrl}${path}`);
                            break;
                    }
                }
            } catch (e) {Cu.reportError(e);}
    },
};
class UserChrome {
    constructor(win) {
        this.win = win;
        win.windowRoot.addEventListener("DOMDocElementInserted", this);
    }
    handleEvent(e) {
        var w = e.target.defaultView, {href} = w.location;
        if (this.win == w) {
            this.handleEvent = this.handle;
            this.win.addEventListener("unload", () => {
                this.win.windowRoot.removeEventListener("DOMDocElementInserted", this);
            }, { once: true });
        }
        if (!w.isChromeWindow || href === "about:blank") return;
        this.initWin(w, href);
    }
    handle(e) {
        var w = e.target.defaultView, {href} = w.location;
        if (!w.isChromeWindow || href === "about:blank") return;
        this.initWin(w, href);
    }
    initWin(win, href) {
        if (user_chrome.custom_styles_chrome) this.addStylesChrome(win);
        win.UcfPrefs = UcfPrefs;
        if (href === "chrome://messenger/content/messenger.xhtml") {
            win.addEventListener("DOMContentLoaded", async e => {
                var [{value}] = await UcfPrefs.formatMessages("main.ftl", ["ucf-open-about-config-button"]);
                var icon = "chrome://user_chrome_files/content/user_chrome/svg/prefs.svg";
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
                win.addEventListener("DOMContentLoaded", e => {
                    new CustomScripts(win, "ucf_custom_scripts_win");
                }, { once: true });
            }
        }
        if (UcfPrefs.prefs.custom_scripts_all_chrome) {
            win.addEventListener("DOMContentLoaded", e => {
                new CustomScripts(win, "ucf_custom_scripts_all_win", href);
            }, { once: true });
        }
    }
    async addStylesChrome(win) {
        var {addSheet} = win.windowUtils;
        for (let p of UcfPrefs._CssChrome)
            p.sheet(addSheet);
    }
}
class CustomScripts {
    constructor(win, defineAs, href) {
        var ucfo = this.ucfo = Cu.createObjectIn(win, { defineAs });
        win.addEventListener("load", e => {
            this[defineAs](win, ucfo, "load", href);
        }, { once: true });
        this.win = win;
        this.setUnloadMap = this.setUMap;
        Cu.exportFunction((key, func, context) => {
            this.setUnloadMap(key, func, context);
        }, ucfo, { defineAs: "setUnloadMap" });
        Cu.exportFunction((key, del) => {
            var val = this.unloadMap?.get(key);
            if (val && del) this.unloadMap.delete(key);
            return val;
        }, ucfo, { defineAs: "getDelUnloadMap" });
        this[defineAs](win, ucfo, "DOMContentLoaded", href);
    }
    setMap(key, func, context) {
        this.unloadMap.set(key, {func, context})
    }
    setUMap(key, func, context) {
        (this.unloadMap = new Map()).set(key, {func, context});
        this.setUnloadMap = this.setMap;
        this.win.addEventListener("unload", () => {
            this.unloadMap.forEach((val, key) => {
                try { val.func.apply(val.context); } catch (e) {
                    if (!val.func) try { this.ucfo[key].destructor(); } catch (e) {Cu.reportError(e);}
                    else Cu.reportError(e);
                }
            });
            this.unloadMap.clear();
        }, { once: true });
    }
    ucf_custom_scripts_win(win, ucfo, type) {
        var {loadSubScript} = Services.scriptloader;
        ucfo.getProp = `JsChrome_${type}`;
        for (let {ucfobj, path} of UcfPrefs._JsChrome[type]) {
            try {
                loadSubScript(`${scriptsUrl}${path}`, ucfobj ? ucfo : win);
            } catch (e) {Cu.reportError(e);}
        }
    }
    ucf_custom_scripts_all_win(win, ucfo, type, href) {
        var {loadSubScript} = Services.scriptloader;
        ucfo.getProp = `JsAllChrome_${type}`;
        for (let {urlregxp, ucfobj, path} of UcfPrefs._JsAllChrome[type]) {
            try {
                if (!urlregxp || urlregxp.test(href)) loadSubScript(`${scriptsUrl}${path}`, ucfobj ? ucfo : win);
            } catch (e) {Cu.reportError(e);}
        }
    }
}
user_chrome.init();
