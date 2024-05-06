
var { UcfPrefs } = ChromeUtils.importESModule("chrome://user_chrome_files/content/user_chrome/UcfPrefs.mjs");
ChromeUtils.defineESModuleGetters(this, {
    UcfStylesScripts: "chrome://user_chrome_files/content/CustomStylesScripts.mjs",
    CustomizableUI: "resource:///modules/CustomizableUI.sys.mjs",
});
ChromeUtils.defineLazyGetter(this, "UcfSSS", () => Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService));
var user_chrome = {
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
    preloadSheet(obj) {
        try {
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
    registerSheet(obj) {
        try {
            let uri = Services.io.newURI(`chrome://user_chrome_files/content/custom_styles/${obj.path}`);
            let type = obj.type = UcfSSS[obj.type];
            if (!UcfSSS.sheetRegistered(uri, type))
                UcfSSS.loadAndRegisterSheet(uri, type);
        } catch (e) {}
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
            static newuri = Services.io.newURI("chrome://user_chrome_files/content/user_chrome/prefs_tb.xhtml");
            static classid = Components.ID(Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator).generateUUID().toString());
            classDescription = "about:user-chrome-files";
            classID = AboutUcfPrefs.classid;
            contractID = "@mozilla.org/network/protocol/about;1?what=user-chrome-files";
            QueryInterface(aIID) {
                if (aIID.equals(Ci.nsIAboutModule) || aIID.equals(Ci.nsISupports)) {
                    return this;
                }
                throw "2147500034";
            }
            newChannel(uri, loadInfo) {
                var chan = Services.io.newChannelFromURIWithLoadInfo(AboutUcfPrefs.newuri, loadInfo);
                chan.owner = Services.scriptSecurityManager.getSystemPrincipal();
                return chan;
            }
            getURIFlags(uri) {
                return Ci.nsIAboutModule.ALLOW_SCRIPT;
            }
            getChromeURI(_uri) {
                return AboutUcfPrefs.newuri;
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
        scope.CustomizableUI = CustomizableUI;
        scope.user_chrome = user_chrome;
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
        ChromeUtils.defineLazyGetter(scope, "console", () => UcfPrefs.global.console.createInstance({
            prefix: "custom_scripts_background",
        }));
        return scope;
    },
    async initCustom() {
        if (!UcfPrefs.custom_scripts_background) return;
        var scope = this._initCustom();
        for (let s of UcfStylesScripts.scriptsbackground)
            try {
                if (s.path)
                    Services.scriptloader.loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${s.path}`, scope, "UTF-8");
                if (s.func)
                    new scope.Function(s.func).apply(scope, null);
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
            win.UcfPrefs = UcfPrefs;
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
        var { addSheet } = win.windowUtils;
        for (let s of UcfStylesScripts.styleschrome)
            s.sheet(addSheet);
    }
    _loadChromeScripts(win) {
        try {
            Services.scriptloader.loadSubScript("chrome://user_chrome_files/content/custom_scripts/custom_script_win.js", win, "UTF-8");
        } catch (e) {}
        for (let s of UcfStylesScripts.scriptschrome.domload) {
            try {
                if (s.path)
                    Services.scriptloader.loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${s.path}`, s.ucfobj ? win.ucf_custom_script_win : win, "UTF-8");
                if (s.func)
                    new win.Function(s.func).apply(win, null);
            } catch (e) {}
        }
    }
    loadChromeScripts(win) {
        try {
            win.ucf_custom_script_win.load();
        } catch (e) {}
        for (let s of UcfStylesScripts.scriptschrome.load) {
            try {
                if (s.path)
                    Services.scriptloader.loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${s.path}`, s.ucfobj ? win.ucf_custom_script_win : win, "UTF-8");
                if (s.func)
                    new win.Function(s.func).apply(win, null);
            } catch (e) {}
        }
    }
    _loadAllChromeScripts(win, href) {
        try {
            Services.scriptloader.loadSubScript("chrome://user_chrome_files/content/custom_scripts/custom_script_all_win.js", win, "UTF-8");
        } catch (e) {}
        for (let s of UcfStylesScripts.scriptsallchrome.domload) {
            try {
                if (s.urlregxp.test(href)) {
                    if (s.path)
                        Services.scriptloader.loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${s.path}`, s.ucfobj ? win.ucf_custom_script_all_win : win, "UTF-8");
                    if (s.func)
                        new win.Function(s.func).apply(win, null);
                }
            } catch (e) {}
        }
    }
    loadAllChromeScripts(win, href) {
        try {
            win.ucf_custom_script_all_win.load();
        } catch (e) {}
        for (let s of UcfStylesScripts.scriptsallchrome.load) {
            try {
                if (s.urlregxp.test(href)) {
                    if (s.path)
                        Services.scriptloader.loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${s.path}`, s.ucfobj ? win.ucf_custom_script_all_win : win, "UTF-8");
                    if (s.func)
                        new win.Function(s.func).apply(win, null);
                }
            } catch (e) {}
        }
    }
}
