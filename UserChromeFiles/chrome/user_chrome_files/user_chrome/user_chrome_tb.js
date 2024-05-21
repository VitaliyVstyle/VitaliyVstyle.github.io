
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
                    if (!path) {
                        obj.sheet = () => {};
                        return this._preload = await (async () => null)();
                    }
                    return this._preload = await UcfSSS.preloadSheetAsync(
                        Services.io.newURI(`chrome://user_chrome_files/content/custom_styles/${path}`),
                        this.type
                    );
                } catch (e) {
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
        (new UserChrome()).addListener(win);
        if (!win.isChromeWindow) return;
        this.observe = (w, t, d) => {
            (new UserChrome()).addListener(w);
        };
        win.windowRoot.addEventListener("DOMDocElementInserted", e => {
            this.initCustom();
            this.aboutPrefs();
        }, { once: true });
    },
    addObs() {
        Services.obs.addObserver(this, "domwindowopened");
    },
    removeObs() {
        Services.obs.removeObserver(this, "domwindowopened");
    },
    async aboutPrefs() {
        class AboutUcfPrefs {
            constructor() {}
            newuri = Services.io.newURI("chrome://user_chrome_files/content/user_chrome/prefs.xhtml");
            classDescription = "about:user-chrome-files";
            classID = Components.ID(Services.uuid.generateUUID().toString());
            contractID = "@mozilla.org/network/protocol/about;1?what=user-chrome-files";
            QueryInterface = ChromeUtils.generateQI([Ci.nsIAboutModule]);
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
        var newFactory = new AboutUcfPrefs();
        Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
        .registerFactory(newFactory.classID, "AboutUcfPrefs", newFactory.contractID, newFactory);
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
        for (let {path, ospath, isos, ver, func} of UcfStylesScripts.scriptsbackground)
            try {
                if (path)
                    loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, scope, "UTF-8");
                else if (ospath && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER)))
                    loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${ospath.replace(/%OS%/g, OS)}`, scope, "UTF-8");
                if (func)
                    new scope.Function(func).apply(scope);
            } catch (e) {Cu.reportError(e);}
    },
};
class UserChrome {
    constructor() {}
    initWindow(win) {
        var href = win.location.href;
        if (UcfPrefs.custom_styles_chrome)
            this.addStylesChrome(win);
        if (href === "chrome://messenger/content/messenger.xhtml") {
            Object.defineProperty(win, "UcfPrefs", {
                enumerable: true,
                configurable: false,
                writable: false,
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
                    this._loadChromeScripts(win);
                }, { once: true });
                win.addEventListener("load", e => {
                    this.loadChromeScripts(win);
                }, { once: true });
            }
        }
        if (UcfPrefs.custom_scripts_all_chrome && href !== "about:blank") {
            win.addEventListener("DOMContentLoaded", e => {
                this._loadAllChromeScripts(win, href);
            }, { once: true });
            win.addEventListener("load", e => {
                this.loadAllChromeScripts(win, href);
            }, { once: true });
        }
    }
    addListener(win) {
        this.handleEvent = e => {
            var w = e.target.defaultView;
            if (win == w) {
                this.handleEvent = this.docElementInserted;
                win.addEventListener("unload", e => {
                    win.windowRoot.removeEventListener("DOMDocElementInserted", this);
                }, { once: true });
            }
            if (!w.isChromeWindow) return;
            this.initWindow(w);
        };
        win.windowRoot.addEventListener("DOMDocElementInserted", this);
    }
    docElementInserted(e) {
        var w = e.target.defaultView;
        if (!w.isChromeWindow) return;
        this.initWindow(w);
    }
    async addStylesChrome(win) {
        var {addSheet} = win.windowUtils;
        for (let s of UcfStylesScripts.styleschrome)
            s.sheet(addSheet);
    }
    _loadChromeScripts(win) {
        var {loadSubScript} = Services.scriptloader;
        new win.Function(`
            window.ucf_custom_script_win = {
                get _unloadMap_() {
                    delete this._unloadMap_;
                    window.addEventListener("unload", e => {
                        this._unloadMap_.forEach((val, key) => {
                            try { val.func.apply(val.context); } catch (e) {
                                try { this[key].destructor(); } catch (e) {}
                            }
                        });
                    }, {once: true});
                    return this._unloadMap_ = new Map();
                },
                getUnloadMap(key) {
                    return this._unloadMap_.get(key);
                },
                setUnloadMap(key, func, context) {
                    this._unloadMap_.set(key, {func, context});
                },
                unloadlisteners: {
                    push(key) {
                        var obj = ucf_custom_script_win;
                        obj._unloadMap_.set(key, {func: obj[key]?.destructor, context: obj[key]});
                    },
                },
            };
        `).apply(win);
        for (let {ucfobj, path, ospath, isos, ver, func} of UcfStylesScripts.scriptschrome.domload) {
            try {
                let obj = ucfobj ? win.ucf_custom_script_win : win;
                if (path)
                    loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, obj, "UTF-8");
                else if (ospath && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER)))
                    loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${ospath.replace(/%OS%/g, OS)}`, obj, "UTF-8");
                if (func)
                    new win.Function(func).apply(obj);
            } catch (e) {Cu.reportError(e);}
        }
    }
    loadChromeScripts(win) {
        var {loadSubScript} = Services.scriptloader;
        for (let {ucfobj, path, ospath, isos, ver, func} of UcfStylesScripts.scriptschrome.load) {
            try {
                let obj = ucfobj ? win.ucf_custom_script_win : win;
                if (path)
                    loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, obj, "UTF-8");
                else if (ospath && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER)))
                    loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${ospath.replace(/%OS%/g, OS)}`, obj, "UTF-8");
                if (func)
                    new win.Function(func).apply(obj);
            } catch (e) {Cu.reportError(e);}
        }
    }
    _loadAllChromeScripts(win, href) {
        var {loadSubScript} = Services.scriptloader;
        new win.Function(`
            window.ucf_custom_script_all_win = {
                get _unloadMap_() {
                    delete this._unloadMap_;
                    window.addEventListener("unload", e => {
                        this._unloadMap_.forEach((val, key) => {
                            try { val.func.apply(val.context); } catch (e) {
                                try { this[key].destructor(); } catch (e) {}
                            }
                        });
                    }, {once: true});
                    return this._unloadMap_ = new Map();
                },
                getUnloadMap(key) {
                    return this._unloadMap_.get(key);
                },
                setUnloadMap(key, func, context) {
                    this._unloadMap_.set(key, {func, context});
                },
                unloadlisteners: {
                    push(key) {
                        var obj = ucf_custom_script_all_win;
                        obj._unloadMap_.set(key, {func: obj[key]?.destructor, context: obj[key]});
                    },
                },
            };
        `).apply(win);
        for (let {urlregxp, ucfobj, path, ospath, isos, ver, func} of UcfStylesScripts.scriptsallchrome.domload) {
            try {
                if (!urlregxp || urlregxp.test(href)) {
                    let obj = ucfobj ? win.ucf_custom_script_all_win : win;
                    if (path)
                        loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, obj, "UTF-8");
                    else if (ospath && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER)))
                        loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${ospath.replace(/%OS%/g, OS)}`, obj, "UTF-8");
                    if (func)
                        new win.Function(func).apply(obj);
                }
            } catch (e) {Cu.reportError(e);}
        }
    }
    loadAllChromeScripts(win, href) {
        var {loadSubScript} = Services.scriptloader;
        for (let {urlregxp, ucfobj, path, ospath, isos, ver, func} of UcfStylesScripts.scriptsallchrome.load) {
            try {
                if (!urlregxp || urlregxp.test(href)) {
                    let obj = ucfobj ? win.ucf_custom_script_all_win : win;
                    if (path)
                        loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, obj, "UTF-8");
                    else if (ospath && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER)))
                        loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${ospath.replace(/%OS%/g, OS)}`, obj, "UTF-8");
                    if (func)
                        new win.Function(func).apply(obj);
                }
            } catch (e) {Cu.reportError(e);}
        }
    }
}
user_chrome.init();
