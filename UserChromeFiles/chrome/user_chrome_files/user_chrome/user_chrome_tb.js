
const {UcfPrefs} = ChromeUtils.importESModule("chrome://user_chrome_files/content/user_chrome/UcfPrefs.mjs");
ChromeUtils.defineLazyGetter(this, "UcfStylesScripts", () => ChromeUtils.importESModule("chrome://user_chrome_files/content/CustomStylesScripts.mjs").UcfStylesScripts);
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
const user_chrome = {
    get custom_styles_chrome() {
        this.initCustom();
        this.initAboutPrefs();
        delete this.custom_styles_chrome;
        return this.custom_styles_chrome = UcfPrefs.custom_styles_chrome;
    },
    init() {
        this.addObs();
        UcfPrefs.gbranch = Services.prefs.getBranch(UcfPrefs.PREF_BRANCH);
        var branch = Services.prefs.getDefaultBranch(UcfPrefs.PREF_BRANCH);
        branch.setBoolPref("custom_styles_chrome", UcfPrefs.custom_styles_chrome);
        branch.setBoolPref("custom_styles_all", UcfPrefs.custom_styles_all);
        branch.setBoolPref("custom_scripts_background", UcfPrefs.custom_scripts_background);
        branch.setBoolPref("custom_scripts_chrome", UcfPrefs.custom_scripts_chrome);
        branch.setBoolPref("custom_scripts_all_chrome", UcfPrefs.custom_scripts_all_chrome);
        branch.setBoolPref("custom_safemode", true);
        var noSafeMode = true;
        if (UcfPrefs.gbranch.getBoolPref("custom_safemode"))
            noSafeMode = !Services.appinfo.inSafeMode;
        if (noSafeMode) {
            UcfPrefs.user_chrome = this;
            UcfPrefs.custom_scripts_background = UcfPrefs.gbranch.getBoolPref("custom_scripts_background");
            UcfPrefs.custom_scripts_chrome = UcfPrefs.gbranch.getBoolPref("custom_scripts_chrome");
            UcfPrefs.custom_scripts_all_chrome = UcfPrefs.gbranch.getBoolPref("custom_scripts_all_chrome");
            if (UcfPrefs.custom_styles_chrome = UcfPrefs.gbranch.getBoolPref("custom_styles_chrome"))
                (async () => {
                    for (let s of UcfStylesScripts.styleschrome)
                        this.preloadSheet(s);
                })();
            if (UcfPrefs.custom_styles_all = UcfPrefs.gbranch.getBoolPref("custom_styles_all"))
                (async () => {
                    for (let s of UcfStylesScripts.stylesall)
                        this.registerSheet(s);
                })();
        } else {
            UcfPrefs.custom_scripts_background = false;
            UcfPrefs.custom_scripts_chrome = false;
            UcfPrefs.custom_scripts_all_chrome = false;
            UcfPrefs.custom_styles_chrome = false;
            UcfPrefs.custom_styles_all = false;
        }
    },
    async preloadSheet(obj) {
        obj.type = UcfSSS[obj.type];
        obj.preload = async function() {
            this.preload = async function() {
                return this._preload;
            };
            return this._preload = (async () => {
                try {
                    let path = this.path || (((!this.isos || this.isos.includes(OS)) && (!this.ver || (!this.ver.min || this.ver.min <= VER) && (!this.ver.max || this.ver.max >= VER))) ? this.ospath.replace(/%OS%/g, OS) : undefined);
                    if (!path) throw null;
                    return this._preload = await UcfSSS.preloadSheetAsync(
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
    registerSheet(obj) {
        try {
            let path = obj.path || (((!obj.isos || obj.isos.includes(OS)) && (!obj.ver || (!obj.ver.min || obj.ver.min <= VER) && (!obj.ver.max || obj.ver.max >= VER))) ? obj.ospath.replace(/%OS%/g, OS) : undefined);
            if (!path) return;
            let uri = Services.io.newURI(`chrome://user_chrome_files/content/custom_styles/${path}`);
            let type = obj.type = UcfSSS[obj.type];
            if (!UcfSSS.sheetRegistered(uri, type))
                UcfSSS.loadAndRegisterSheet(uri, type);
        } catch (e) {Cu.reportError(e);}
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
    async initAboutPrefs() {
        var newFactory = new AboutPrefs();
        Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
        .registerFactory(newFactory.classID, "AboutPrefs", newFactory.contractID, newFactory);
    },
    _initCustom() {
        var scope = this.customSandbox = Cu.Sandbox(Services.scriptSecurityManager.getSystemPrincipal(), {
            wantComponents: true,
            sandboxName: "UserChromeFiles: custom_scripts_background",
            sandboxPrototype: UcfPrefs.global,
        });
        scope.UcfPrefs = UcfPrefs;
        scope.user_chrome = this;
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
            CustomizableUI: "resource:///modules/CustomizableUI.sys.mjs",
        });
        ChromeUtils.defineLazyGetter(scope, "console", () => UcfPrefs.global.console.createInstance({
            prefix: "custom_scripts_background",
        }));
        return scope;
    },
    async initCustom() {
        if (!UcfPrefs.custom_scripts_background) return;
        var scope = this._initCustom();
        var {loadSubScript} = Services.scriptloader;
        for (let {path, ospath, isos, ver, func, module} of UcfStylesScripts.scriptsbackground)
            try {
                if (path)
                    loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, scope);
                else if (ospath && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                    if (module) {
                        let mod = ChromeUtils.importESModule(ospath.replace(/%OS%/g, OS).replace(/^%UCFDIR%/, "chrome://user_chrome_files/content/custom_scripts/"));
                        if (Array.isArray(module))
                            for (let m of module) {
                                if (m in mod)
                                    scope[m] = mod[m];
                            }
                    } else
                        loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${ospath.replace(/%OS%/g, OS)}`, scope);
                }
                if (func)
                    loadSubScript(`data:charset=utf-8,${encodeURIComponent(`${func}`)}`, scope);
            } catch (e) {Cu.reportError(e);}
    },
};
class AboutPrefs {
    constructor() {
        this.newuri = Services.io.newURI("chrome://user_chrome_files/content/user_chrome/prefs_tb.xhtml");
        this.classDescription = "about:user-chrome-files";
        this.classID = Components.ID(Services.uuid.generateUUID().toString());
        this.contractID = "@mozilla.org/network/protocol/about;1?what=user-chrome-files";
        this.QueryInterface = ChromeUtils.generateQI([Ci.nsIAboutModule]);
    }
    newChannel(uri, loadInfo) {
        var chan = Services.io.newChannelFromURIWithLoadInfo(this.newuri, loadInfo);
        chan.owner = Services.scriptSecurityManager.getSystemPrincipal();
        return chan;
    }
    getURIFlags() {
        return Ci.nsIAboutModule.ALLOW_SCRIPT;
    }
    getChromeURI() {
        return this.newuri;
    }
    createInstance(iid) {
        return this.QueryInterface(iid);
    }
}
class UserChrome {
    constructor(win) {
        this.win = win;
        win.windowRoot.addEventListener("DOMDocElementInserted", this);
    }
    handleEvent(e) {
        var w = e.target.defaultView, {href} = w.location;
        if (this.win == w) {
            this.handleEvent = this.handle;
            this.win.addEventListener("unload", e => {
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
        if (user_chrome.custom_styles_chrome)
            this.addStylesChrome(win);
        if (href === "chrome://messenger/content/messenger.xhtml") {
            Object.defineProperty(win, "UcfPrefs", {
                enumerable: true,
                value: UcfPrefs,
            });
            win.addEventListener("DOMContentLoaded", async e => {
                var [{value}] = await UcfPrefs.formatMessages();
                var icon = "chrome://user_chrome_files/content/user_chrome/svg/prefs-tb.svg";
                win.document.querySelector("menuitem#addonsManager")?.after((() => {
                    var mitem = win.document.createXULElement("menuitem");
                    mitem.setAttribute("label", value);
                    mitem.id = "ucf-open-about-config-mitem";
                    mitem.className = "menuitem-iconic";
                    mitem.style.cssText = `list-style-image:url("${icon}");-moz-context-properties:fill,stroke,fill-opacity;stroke:currentColor;fill-opacity:var(--toolbarbutton-icon-fill-opacity,.8);`;
                    mitem.setAttribute("oncommand", `document.querySelector("#tabmail")?.openTab("contentTab", { url: "about:user-chrome-files" })`);
                    return mitem;
                })());
                win.document.querySelector("toolbarbutton#appmenu_addons")?.after((() => {
                    var btn = win.document.createXULElement("toolbarbutton");
                    btn.setAttribute("label", value);
                    btn.id = "ucf-open-about-config-btn";
                    btn.className = "subviewbutton subviewbutton-iconic";
                    btn.style.cssText = `list-style-image:url("${icon}");`;
                    btn.setAttribute("oncommand", `document.querySelector("#tabmail")?.openTab("contentTab", { url: "about:user-chrome-files" })`);
                    return btn;
                })());
            }, { once: true });
            if (UcfPrefs.custom_scripts_chrome) {
                win.addEventListener("DOMContentLoaded", e => {
                    new CustomScripts(win, "ucf_custom_script_win");
                }, { once: true });
            }
        }
        if (UcfPrefs.custom_scripts_all_chrome) {
            win.addEventListener("DOMContentLoaded", e => {
                new CustomScripts(win, "ucf_custom_script_all_win", href);
            }, { once: true });
        }
    }
    async addStylesChrome(win) {
        var {addSheet} = win.windowUtils;
        for (let s of UcfStylesScripts.styleschrome)
            s.sheet(addSheet);
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
            var val = this.unloadMap.get(key);
            if (val && del)
                this.unloadMap.delete(key);
            return val;
        }, ucfo, { defineAs: "getDelUnloadMap" });
        var udls = Cu.createObjectIn(ucfo, { defineAs: "unloadlisteners" });
        Cu.exportFunction(key => {
            this.setUnloadMap(key, ucfo[key]?.destructor, ucfo[key]);
        }, udls, { defineAs: "push" });
        this[defineAs](win, ucfo, "domload", href);
    }
    setMap(key, func, context) {
        this.unloadMap.set(key, {func, context})
    }
    setUMap(key, func, context) {
        (this.unloadMap = new Map()).set(key, {func, context});
        this.setUnloadMap = this.setMap;
        this.win.addEventListener("unload", e => {
            this.unloadMap.forEach((val, key) => {
                try { val.func.apply(val.context); } catch (e) {
                    if (!val.func)
                        try { this.ucfo[key].destructor(); } catch (e) {Cu.reportError(e);}
                    Cu.reportError(e);
                }
            });
        }, { once: true });
    }
    ucf_custom_script_win(win, ucfo, prop) {
        var {loadSubScript} = Services.scriptloader;
        for (let {ucfobj, path, ospath, isos, ver, func} of UcfStylesScripts.scriptschrome[prop]) {
            try {
                let obj = ucfobj ? ucfo : win;
                if (path)
                    loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, obj);
                else if (ospath && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER)))
                    loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${ospath.replace(/%OS%/g, OS)}`, obj);
                if (func)
                    loadSubScript(`data:charset=utf-8,${encodeURIComponent(`${func}`)}`, obj);
            } catch (e) {Cu.reportError(e);}
        }
    }
    ucf_custom_script_all_win(win, ucfo, prop, href) {
        var {loadSubScript} = Services.scriptloader;
        for (let {urlregxp, ucfobj, path, ospath, isos, ver, func} of UcfStylesScripts.scriptsallchrome[prop]) {
            try {
                if (!urlregxp || urlregxp.test(href)) {
                    let obj = ucfobj ? ucfo : win;
                    if (path)
                        loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, obj);
                    else if (ospath && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER)))
                        loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${ospath.replace(/%OS%/g, OS)}`, obj);
                    if (func)
                        loadSubScript(`data:charset=utf-8,${encodeURIComponent(`${func}`)}`, obj);
                }
            } catch (e) {Cu.reportError(e);}
        }
    }
}
user_chrome.init();
