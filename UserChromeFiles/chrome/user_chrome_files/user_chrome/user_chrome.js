
const chromeUrl = "chrome://user_chrome_files/content/user_chrome/";
const scriptsUrl = "chrome://user_chrome_files/content/custom_scripts/";
const stylesUrl = "chrome://user_chrome_files/content/custom_styles/";
const { UcfPrefs } = ChromeUtils.importESModule(`${chromeUrl}UcfPrefs.mjs`);
ChromeUtils.defineLazyGetter(this, "CustomizableUI", () => {
    try {
        return ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs").CustomizableUI;
    } catch {
        return ChromeUtils.importESModule("resource:///modules/CustomizableUI.sys.mjs").CustomizableUI;
    }
});
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
    get toolbars_enable() {
        var bars = UcfPrefs.prefs.toolbars_enable;
        this.initAreas(bars);
        delete this.toolbars_enable;
        return this.toolbars_enable = bars;
    },
    get custom_styles_chrome() {
        this.initCustom();
        UcfPrefs.initAboutPrefs("prefs.xhtml", "user-chrome-files");
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
    async _CssBars() {
        this.preloadSheet(UcfPrefs._CssBars = { path: `${chromeUrl}toolbars.css`, type: "USER_SHEET" });
    },
    init() {
        delete this.init;
        this._addObs();
        UcfPrefs.manifestPath = manifestPath;
        UcfPrefs.initPrefs;
        var { prefs } = UcfPrefs;
        if (prefs.toolbars_enable) this._CssBars();
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
    async initAreas(vtb_enable) {
        delete this.initAreas;
        var { v_enable, t_enable, b_enable } = UcfPrefs.prefs;
        if (vtb_enable) {
            if (v_enable) {
                try {
                    CustomizableUI.registerArea("ucf-additional-vertical-bar", {
                        type: CustomizableUI.TYPE_TOOLBAR,
                        defaultPlacements: ["ucf-view-bookmarks-sidebar-button", "ucf-view-history-sidebar-button", "spring"],
                        defaultCollapsed: false
                    });
                } catch { }
            }
            if (t_enable) {
                try {
                    CustomizableUI.registerArea("ucf-additional-top-bar", {
                        type: CustomizableUI.TYPE_TOOLBAR,
                        defaultPlacements: ["ucf-open-directories-button", "ucf-open-about-config-button", "spring", "ucf-restart-app"],
                        defaultCollapsed: false
                    });
                } catch { }
            }
            if (b_enable) {
                try {
                    CustomizableUI.registerArea("ucf-additional-bottom-bar", {
                        type: CustomizableUI.TYPE_TOOLBAR,
                        defaultPlacements: ["ucf-additional-bottom-closebutton", "spring"],
                        defaultCollapsed: false
                    });
                } catch { }
            }
        }
        this.initButtons(vtb_enable, v_enable, t_enable, b_enable);
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
        scope.CustomizableUI = CustomizableUI;
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
            PageActions: "resource:///modules/PageActions.sys.mjs",
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
    async initButtons(vtb_enable, v_enable, t_enable, b_enable) {
        delete this.initButtons;
        var [
            uoacb,
            uavtb,
            uattb,
            uabtb,
            ura,
            uvhsb,
            uvbsb,
            uodb,
        ] = await UcfPrefs.formatMessages("main.ftl", [
            "ucf-open-about-config-button",
            "ucf-additional-vertical-toggle-button",
            "ucf-additional-top-toggle-button",
            "ucf-additional-bottom-toggle-button",
            "ucf-restart-app",
            "ucf-view-history-sidebar-button",
            "ucf-view-bookmarks-sidebar-button",
            "ucf-open-directories-button",
        ]);
        try {
            CustomizableUI.createWidget({
                id: "ucf-open-about-config-button",
                type: "custom",
                label: uoacb.value,
                tooltiptext: `${uoacb.attributes[0].value}\n${uoacb.attributes[1].value}\n${uoacb.attributes[2].value}\n${uoacb.attributes[3].value}`,
                localized: false,
                onBuild(doc) {
                    var win = doc.defaultView;
                    var prefsInfo = "about:user-chrome-files";
                    if (!win.gInitialPages?.includes(prefsInfo)) win.gInitialPages?.push(prefsInfo);
                    var btn = doc.createXULElement("toolbarbutton");
                    btn.id = "ucf-open-about-config-button";
                    btn.className = "toolbarbutton-1 chromeclass-toolbar-additional";
                    btn.setAttribute("label", this.label);
                    btn.toggleAttribute("context", true);
                    btn.setAttribute("tooltiptext", this.tooltiptext);
                    btn.addEventListener("click", e => {
                        if (e.button == 0) UcfPrefs.openHavingURI(win, !e.shiftKey ? prefsInfo : "about:user-chrome-files-options", true);
                        else if (e.button == 1) UcfPrefs.openHavingURI(win, "about:config", true);
                        else if (e.button == 2) {
                            let prefwin = Services.wm.getMostRecentWindow("user_chrome_prefs:window");
                            if (prefwin) prefwin.focus();
                            else win.openDialog(`${chromeUrl}prefs_win.xhtml`, "user_chrome_prefs:window", "centerscreen,resizable,dialog=no");
                        }
                    });
                    btn.style.setProperty("list-style-image", `url("${chromeUrl}svg/prefs.svg")`, "important");
                    return btn;
                }
            });
        } catch { }
        if (!vtb_enable) return;
        if (v_enable) {
            try {
                CustomizableUI.createWidget({
                    id: "ucf-additional-vertical-toggle-button",
                    label: uavtb.value,
                    tooltiptext: uavtb.attributes[0].value,
                    localized: false,
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    onCommand(e) {
                        CustomizableUI.setToolbarVisibility("ucf-additional-vertical-bar", e.target.ownerDocument.querySelector("#ucf-additional-vertical-bar").collapsed);
                    }
                });
            } catch { }
        }
        if (t_enable) {
            try {
                CustomizableUI.createWidget({
                    id: "ucf-additional-top-toggle-button",
                    label: uattb.value,
                    tooltiptext: uattb.attributes[0].value,
                    localized: false,
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    onCommand(e) {
                        CustomizableUI.setToolbarVisibility("ucf-additional-top-bar", e.target.ownerDocument.querySelector("#ucf-additional-top-bar").collapsed);
                    }
                });
            } catch { }
        }
        if (b_enable) {
            try {
                CustomizableUI.createWidget({
                    id: "ucf-additional-bottom-toggle-button",
                    label: uabtb.value,
                    tooltiptext: uabtb.attributes[0].value,
                    localized: false,
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    onCommand(e) {
                        CustomizableUI.setToolbarVisibility("ucf-additional-bottom-bar", e.target.ownerDocument.querySelector("#ucf-additional-bottom-bar").collapsed);
                    }
                });
            } catch { }
        }
        try {
            CustomizableUI.createWidget({
                id: "ucf-restart-app",
                type: "custom",
                label: ura.value,
                tooltiptext: `${ura.attributes[0].value}\n${ura.attributes[1].value}\n${ura.attributes[2].value}`,
                localized: false,
                onBuild(doc) {
                    var win = doc.defaultView;
                    var btn = doc.createXULElement("toolbarbutton");
                    btn.id = "ucf-restart-app";
                    btn.className = "toolbarbutton-1 chromeclass-toolbar-additional";
                    btn.setAttribute("label", this.label);
                    btn.toggleAttribute("context", true);
                    btn.setAttribute("tooltiptext", this.tooltiptext);
                    btn.addEventListener("click", e => {
                        if (e.button == 0) UcfPrefs.restartApp();
                        else if (e.button == 1) win.safeModeRestart();
                        else if (e.button == 2) {
                            e.preventDefault();
                            e.stopPropagation();
                            UcfPrefs.restartApp(true);
                        }
                    });
                    return btn;
                }
            });
        } catch { }
        try {
            CustomizableUI.createWidget({
                id: "ucf-view-history-sidebar-button",
                label: uvhsb.value,
                tooltiptext: uvhsb.attributes[0].value,
                localized: false,
                onCommand(e) {
                    (e.view.SidebarController || e.view.SidebarUI).toggle("viewHistorySidebar");
                }
            });
        } catch { }
        try {
            CustomizableUI.createWidget({
                id: "ucf-view-bookmarks-sidebar-button",
                label: uvbsb.value,
                tooltiptext: uvbsb.attributes[0].value,
                localized: false,
                onCommand(e) {
                    (e.view.SidebarController || e.view.SidebarUI).toggle("viewBookmarksSidebar");
                }
            });
        } catch { }
        try {
            CustomizableUI.createWidget({
                id: "ucf-open-directories-button",
                type: "custom",
                label: uodb.value,
                tooltiptext: `${uodb.attributes[0].value}\n${uodb.attributes[1].value}\n${uodb.attributes[2].value}`,
                localized: false,
                onBuild(doc) {
                    var btn = doc.createXULElement("toolbarbutton");
                    btn.id = "ucf-open-directories-button";
                    btn.className = "toolbarbutton-1 chromeclass-toolbar-additional";
                    btn.setAttribute("label", this.label);
                    btn.toggleAttribute("context", true);
                    btn.setAttribute("tooltiptext", this.tooltiptext);
                    btn.addEventListener("click", e => {
                        var dir;
                        if (e.button == 0) {
                            dir = Services.dirsvc.get("UChrm", Ci.nsIFile);
                            dir.append("user_chrome_files");
                            if (dir.exists()) dir.launch();
                        } else if (e.button == 1) {
                            dir = Services.dirsvc.get("ProfD", Ci.nsIFile);
                            if (dir.exists()) dir.launch();
                        } else if (e.button == 2) {
                            dir = Services.dirsvc.get("GreD", Ci.nsIFile);
                            if (dir.exists()) dir.launch();
                        }
                    });
                    return btn;
                }
            });
        } catch { }
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
        win.UcfPrefs = UcfPrefs;
        this.win = win;
        if (href === "chrome://browser/content/browser.xhtml") {
            this.getProp = "JsChrome_DOMContentLoaded";
            if (user_chrome.toolbars_enable) {
                UcfPrefs._CssBars.sheet(win.windowUtils.addSheet);
                win.addEventListener("MozBeforeInitialXULLayout", e => Services.scriptloader.loadSubScript(`${chromeUrl}toolbars.js`, this.sandbox), { once: true });
            }
            if (UcfPrefs.prefs.custom_scripts_chrome) {
                win.addEventListener("DOMContentLoaded", e => this.addJsChrome(e.type), { once: true });
                win.addEventListener("load", e => {
                    this.getProp = "JsChrome_load";
                    if (this.isSandbox) this.sandbox.getProp = "JsChrome_load";
                    this.addJsChrome("load");
                }, { once: true });
            }
        }
        if (UcfPrefs.prefs.custom_scripts_all_chrome) {
            this.getPropAll = "JsAllChrome_DOMContentLoaded";
            win.addEventListener("DOMContentLoaded", e => this.addJsAllChrome(e.type, href), { once: true });
            win.addEventListener("load", e => {
                this.getPropAll = "JsAllChrome_load";
                if (this.isSandboxAll) this.sandboxAll.getProp = "JsAllChrome_load";
                this.addJsAllChrome("load", href);
            }, { once: true });
        }
    }
    get sandbox() {
        var sandbox = this.win.ucf_custom_scripts_win = this.newSandbox("UCF:JsChrome");
        Object.defineProperty(this, "sandbox", { configurable: true, writable: true, value: sandbox, });
        sandbox.getProp = this.getProp;
        sandbox.setUnloadMap = this.setMap.bind(this);
        sandbox.getDelUnloadMap = this.getMap.bind(this);
        this.unloadMap = new Map();
        this.win.addEventListener("unload", this.destructor.bind(this), { once: true });
        this.isSandbox = true;
        return sandbox;
    }
    get sandboxAll() {
        var sandbox = this.win.ucf_custom_scripts_all_win = this.newSandbox("UCF:JsAllChrome");
        Object.defineProperty(this, "sandboxAll", { configurable: true, writable: true, value: sandbox, });
        sandbox.getProp = this.getPropAll;
        sandbox.setUnloadMap = this.setMapAll.bind(this);
        sandbox.getDelUnloadMap = this.getMapAll.bind(this);
        this.unloadMapAll = new Map();
        this.win.addEventListener("unload", this.destructorAll.bind(this), { once: true });
        this.isSandboxAll = true;
        return sandbox;
    }
    async addStylesChrome(func) {
        for (let p of UcfPrefs._CssChrome)
            p.sheet(func);
    }
    newSandbox(sandboxName) {
        var { win } = this;
        var principal = win.document.nodePrincipal;
        var opts = {
            sandboxName,
            wantComponents: true,
            wantExportHelpers: true,
            wantXrays: true,
            sameZoneAs: win,
            sandboxPrototype: win,
        };
        if (!principal.isSystemPrincipal) {
            principal = [principal];
            opts.wantComponents = false;
            opts.wantExportHelpers = false;
        }
        var sandbox = Cu.Sandbox(principal, opts);
        sandbox.UcfPrefs = UcfPrefs;
        Object.defineProperty(sandbox.Function.prototype, "toSource", { configurable: true, writable: true, value: win.Function.prototype.toSource });
        Object.defineProperty(sandbox.Object.prototype, "toSource", { configurable: true, writable: true, value: win.Object.prototype.toSource });
        Object.defineProperty(sandbox.Array.prototype, "toSource", { configurable: true, writable: true, value: win.Array.prototype.toSource });
        return sandbox;
    }
    setMap(key, func, context) {
        this.unloadMap.set(key, { func, context });
    }
    getMap(key, del) {
        var val = this.unloadMap.get(key);
        if (val && del) this.unloadMap.delete(key);
        return val;
    }
    setMapAll(key, func, context) {
        this.unloadMapAll.set(key, { func, context });
    }
    getMapAll(key, del) {
        var val = this.unloadMapAll.get(key);
        if (val && del) this.unloadMapAll.delete(key);
        return val;
    }
    addJsChrome(type) {
        var { loadSubScript } = Services.scriptloader;
        for (let { ucfobj, path } of UcfPrefs._JsChrome[type]) {
            try {
                loadSubScript(path, ucfobj ? this.sandbox : this.win);
            } catch (e) { Cu.reportError(e); }
        }
    }
    addJsAllChrome(type, href) {
        var { loadSubScript } = Services.scriptloader;
        for (let { urlregxp, ucfobj, path } of UcfPrefs._JsAllChrome[type]) {
            try {
                if (!urlregxp || urlregxp.test(href)) loadSubScript(path, ucfobj ? this.sandboxAll : this.win);
            } catch (e) { Cu.reportError(e); }
        }
    }
    destructor() {
        this.unloadMap.forEach((val, key) => {
            try { val.func.call(val.context, key); } catch (e) { Cu.reportError(e); }
        });
        this.unloadMap.clear();
        Cu.nukeSandbox(this.sandbox);
        this.sandbox = this.win.ucf_custom_scripts_win = null;
    }
    destructorAll() {
        this.unloadMapAll.forEach((val, key) => {
            try { val.func.call(val.context, key); } catch (e) { Cu.reportError(e); }
        });
        this.unloadMapAll.clear();
        Cu.nukeSandbox(this.sandboxAll);
        this.sandboxAll = this.win.ucf_custom_scripts_all_win = null;
    }
}
user_chrome.init();
