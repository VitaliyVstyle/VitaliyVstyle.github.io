
const {UcfPrefs} = ChromeUtils.importESModule("chrome://user_chrome_files/content/user_chrome/UcfPrefs.mjs");
ChromeUtils.defineLazyGetter(this, "CustomizableUI", () => ChromeUtils.importESModule("resource:///modules/CustomizableUI.sys.mjs").CustomizableUI);
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
    get toolbars_enable() {
        var bars = UcfPrefs.prefs.toolbars_enable;
        this.initAreas(bars);
        delete this.toolbars_enable;
        return this.toolbars_enable = bars;
    },
    get custom_styles_chrome() {
        this.initCustom();
        UcfPrefs.initAboutPrefs("prefs.xhtml", "user-chrome-files");
        UcfPrefs.initAboutPrefs("options.xhtml", "user-chrome-options", true);
        delete this.custom_styles_chrome;
        return this.custom_styles_chrome = UcfPrefs.prefs.custom_styles_chrome;
    },
    init() {
        this.addObs();
        UcfPrefs.UcfPath = UcfPath;
        UcfPrefs.initPrefs();
        var {prefs} = UcfPrefs;
        if (prefs.toolbars_enable)
            this.stylePreload();
        if (prefs.custom_safemode || !Services.appinfo.inSafeMode) {
            UcfPrefs.user_chrome = this;
            if (prefs.custom_styles_chrome)
                (async () => {
                    UcfPrefs._styleschrome = UcfPrefs.global.structuredClone(UcfPrefs.prefs.styleschrome).filter(p => {
                        var {disable, path, isos, ver} = p;
                        if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                            if (/%OS%/.test(path)) path = path.replace(/%OS%/g, OS);
                            this.preloadSheet(p);
                            return true;
                        }
                    });
                })();
            if (prefs.custom_styles_all)
                (async () => {
                    for (let p of UcfPrefs.prefs.stylesall)
                        this.registerSheet(p);
                })();
            if (UcfPrefs.prefs.custom_scripts_chrome) {
                (async () => {
                    var _prefs = UcfPrefs._scriptschrome = UcfPrefs.global.structuredClone(UcfPrefs.prefs.scriptschrome);
                    for (let type in _prefs)
                        UcfPrefs._scriptschrome[type] = _prefs[type].filter(p => {
                            try {
                                let {disable, path, isos, ver} = p;
                                if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                                    if (/%OS%/.test(path)) p.path = path.replace(/%OS%/g, OS);
                                    return true;
                                }
                            } catch (e) {Cu.reportError(e);}
                        });
                })();
            }
            if (prefs.custom_scripts_all_chrome)
                (async () => {
                    var _prefs = UcfPrefs._scriptsallchrome = UcfPrefs.global.structuredClone(UcfPrefs.prefs.scriptsallchrome);
                    for (let type in _prefs)
                        UcfPrefs._scriptsallchrome[type] = _prefs[type].filter(p => {
                            try {
                                let {disable, path, isos, ver, urlregxp} = p;
                                if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                                    if (/%OS%/.test(path)) p.path = path.replace(/%OS%/g, OS);
                                    p.urlregxp &&= new RegExp(urlregxp);
                                    return true;
                                }
                            } catch (e) {Cu.reportError(e);}
                        });
                })();
            if (prefs.custom_styles_scripts_child)
                (async () => {
                    UcfPrefs._stylescontent = UcfPrefs.global.structuredClone(UcfPrefs.prefs.stylescontent).filter(p => {
                        var {disable, path, isos, ver} = p;
                        if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                            if (/%OS%/.test(path)) path = path.replace(/%OS%/g, OS);
                            return true;
                        }
                    });
                    var _prefs = UcfPrefs._scriptscontent = UcfPrefs.global.structuredClone(UcfPrefs.prefs.scriptscontent);
                    for (let type in _prefs)
                        UcfPrefs._scriptscontent[type] = _prefs[type].filter(p => {
                            try {
                                let {disable, path, isos, ver, urlregxp} = p;
                                if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                                    if (/%OS%/.test(path)) p.path = path.replace(/%OS%/g, OS);
                                    p.urlregxp &&= new RegExp(urlregxp);
                                    return true;
                                }
                            } catch (e) {Cu.reportError(e);}
                        });
                    var actorOptions = {
                        parent: {
                            esModuleURI: "chrome://user_chrome_files/content/user_chrome/StylesScriptsParent.mjs",
                        },
                        child: {
                            esModuleURI: "chrome://user_chrome_files/content/user_chrome/StylesScriptsChild.mjs",
                            events: {
                                DOMWindowCreated: {},
                                DOMContentLoaded: {},
                                pageshow: {},
                            },
                        },
                        allFrames: true,
                    };
                    var group = prefs.custom_styles_scripts_groups;
                    if (group.length)
                        actorOptions.messageManagerGroups = group;
                    var matches = prefs.custom_styles_scripts_matches;
                    if (matches.length)
                        actorOptions.matches = matches;
                    ChromeUtils.registerWindowActor("UcfCustomStylesScripts", actorOptions);
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
    async registerSheet({disable, path, type, isos, ver}) {
        if (!disable && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
            if (/%OS%/.test(path)) path = path.replace(/%OS%/g, OS);
            let uri = Services.io.newURI(`chrome://user_chrome_files/content/custom_styles/${path}`);
            let t = UcfSSS[type];
            if (!UcfSSS.sheetRegistered(uri, t))
                UcfSSS.loadAndRegisterSheet(uri, t);
        }
    },
    async stylePreload() {
        this.stylePreload = async () => {
            return this._stylePreload;
        };
        return this._stylePreload = (async () => {
            return this._stylePreload = await UcfSSS.preloadSheetAsync(
                Services.io.newURI("chrome://user_chrome_files/content/user_chrome/toolbars.css"),
                UcfSSS.USER_SHEET
            );
        })();
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
    async initAreas(vtb_enable) {
        var {v_enable, t_enable, b_enable} = UcfPrefs.prefs;
        if (vtb_enable) {
            if (v_enable) {
                try {
                    CustomizableUI.registerArea("ucf-additional-vertical-bar", {
                        type: CustomizableUI.TYPE_TOOLBAR,
                        defaultPlacements: ["ucf-view-bookmarks-sidebar-button", "ucf-view-history-sidebar-button", "spring"],
                        defaultCollapsed: false
                    });
                } catch {}
            }
            if (t_enable) {
                try {
                    CustomizableUI.registerArea("ucf-additional-top-bar", {
                        type: CustomizableUI.TYPE_TOOLBAR,
                        defaultPlacements: ["ucf-open-directories-button", "ucf-open-about-config-button", "spring", "ucf-restart-app"],
                        defaultCollapsed: false
                    });
                } catch {}
            }
            if (b_enable) {
                try {
                    CustomizableUI.registerArea("ucf-additional-bottom-bar", {
                        type: CustomizableUI.TYPE_TOOLBAR,
                        defaultPlacements: ["ucf-additional-bottom-closebutton", "spring"],
                        defaultCollapsed: false
                    });
                } catch {}
            }
        }
        this.initButtons(vtb_enable, v_enable, t_enable, b_enable);
    },
    _initCustom() {
        var scope = this.customSandbox = Cu.Sandbox(Services.scriptSecurityManager.getSystemPrincipal(), {
            wantComponents: true,
            sandboxName: "UserChromeFiles: custom_scripts_background",
            sandboxPrototype: UcfPrefs.global,
        });
        scope.UcfPrefs = UcfPrefs;
        scope.CustomizableUI = CustomizableUI;
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
        });
        ChromeUtils.defineLazyGetter(scope, "console", () => UcfPrefs.global.console.createInstance({
            prefix: "custom_scripts_background",
        }));
        return scope;
    },
    async initCustom() {
        if (!UcfPrefs.prefs.custom_scripts_background) return;
        var scope = this._initCustom();
        var {loadSubScript} = Services.scriptloader;
        for (let {disable, path, isos, ver, func, module} of UcfPrefs.prefs.scriptsbackground)
            try {
                if (disable) continue;
                if (path && (!isos || isos.includes(OS)) && (!ver || (!ver.min || ver.min <= VER) && (!ver.max || ver.max >= VER))) {
                    if (!module)
                        loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${!/%OS%/.test(path) ? path : path.replace(/%OS%/g, OS)}`, scope);
                    else {
                        let mod = ChromeUtils.importESModule((!/%OS%/.test(path) ? path : path.replace(/%OS%/g, OS)).replace(/^%UCFDIR%/, "chrome://user_chrome_files/content/custom_scripts/"));
                        if (Array.isArray(module))
                            for (let m of module) {
                                if (m in mod)
                                    scope[m] = mod[m];
                            }
                    }
                }
                if (func)
                    loadSubScript(`data:charset=utf-8,${func}`, scope);
            } catch (e) {Cu.reportError(e);}
    },
    async initButtons(vtb_enable, v_enable, t_enable, b_enable) {
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
                    if (!win.gInitialPages?.includes(prefsInfo))
                        win.gInitialPages?.push(prefsInfo);
                    var btn = doc.createXULElement("toolbarbutton");
                    btn.id = "ucf-open-about-config-button";
                    btn.className = "toolbarbutton-1 chromeclass-toolbar-additional";
                    btn.setAttribute("label", this.label);
                    btn.setAttribute("context", "false");
                    btn.setAttribute("tooltiptext", this.tooltiptext);
                    btn.addEventListener("click", function(e) {
                        if (e.button == 0)
                            UcfPrefs.openHavingURI(win, !e.shiftKey ? prefsInfo : "about:user-chrome-options", true);
                        else if (e.button == 1)
                            UcfPrefs.openHavingURI(win, "about:config", true);
                        else if (e.button == 2) {
                            let prefwin = Services.wm.getMostRecentWindow("user_chrome_prefs:window");
                            if (prefwin)
                                prefwin.focus();
                            else
                                win.openDialog("chrome://user_chrome_files/content/user_chrome/prefs_win.xhtml", "user_chrome_prefs:window", "centerscreen,resizable,dialog=no");
                        }
                    });
                    btn.style.setProperty("list-style-image", `url("chrome://user_chrome_files/content/user_chrome/svg/prefs.svg")`, "important");
                    return btn;
                }
            });
        } catch {}
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
            } catch {}
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
            } catch {}
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
            } catch {}
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
                    btn.setAttribute("context", "false");
                    btn.setAttribute("tooltiptext", this.tooltiptext);
                    btn.addEventListener("click", function(e) {
                        if (e.button == 0)
                            UcfPrefs.restartApp();
                        else if (e.button == 1)
                            win.safeModeRestart();
                        else if (e.button == 2) {
                            e.preventDefault();
                            e.stopPropagation();
                            UcfPrefs.restartApp(true);
                        }
                    });
                    return btn;
                }
            });
        } catch {}
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
        } catch {}
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
        } catch {}
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
                    btn.setAttribute("context", "false");
                    btn.setAttribute("tooltiptext", this.tooltiptext);
                    btn.addEventListener("click", function(e) {
                        var dirs;
                        if (e.button == 0) {
                            dirs = Services.dirsvc.get("UChrm", Ci.nsIFile);
                            dirs.append("user_chrome_files");
                            if (dirs.exists()) dirs.launch();
                        } else if (e.button == 1) {
                            dirs = Services.dirsvc.get("ProfD", Ci.nsIFile);
                            if (dirs.exists()) dirs.launch();
                        } else if (e.button == 2) {
                            dirs = Services.dirsvc.get("GreD", Ci.nsIFile);
                            if (dirs.exists()) dirs.launch();
                        }
                    });
                    return btn;
                }
            });
        } catch {}
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
        win.UcfPrefs = UcfPrefs;
        if (href === "chrome://browser/content/browser.xhtml") {
            if (user_chrome.toolbars_enable) {
                this.addStyleToolbars(win.windowUtils.addSheet);
                win.addEventListener("MozBeforeInitialXULLayout", e => {
                    Services.scriptloader.loadSubScript("chrome://user_chrome_files/content/user_chrome/toolbars.js", win);
                }, { once: true });
            }
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
        for (let p of UcfPrefs._styleschrome)
            p.sheet(addSheet);
    }
    async addStyleToolbars(func) {
        func(await user_chrome.stylePreload(), UcfSSS.USER_SHEET);
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
            if (val && del)
                this.unloadMap.delete(key);
            return val;
        }, ucfo, { defineAs: "getDelUnloadMap" });
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
                    else
                        Cu.reportError(e);
                }
            });
        }, { once: true });
    }
    ucf_custom_scripts_win(win, ucfo, prop) {
        var {loadSubScript} = Services.scriptloader;
        for (let {ucfobj, path, func} of UcfPrefs._scriptschrome[prop]) {
            try {
                let obj = ucfobj ? ucfo : win;
                if (path)
                    loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, obj);
                if (func)
                    loadSubScript(`data:charset=utf-8,${func}`, obj);
            } catch (e) {Cu.reportError(e);}
        }
    }
    ucf_custom_scripts_all_win(win, ucfo, prop, href) {
        var {loadSubScript} = Services.scriptloader;
        for (let {urlregxp, ucfobj, path, func} of UcfPrefs._scriptsallchrome[prop]) {
            try {
                if (!urlregxp || urlregxp.test(href)) {
                    let obj = ucfobj ? ucfo : win;
                    if (path)
                        loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${path}`, obj);
                    if (func)
                        loadSubScript(`data:charset=utf-8,${func}`, obj);
                }
            } catch (e) {Cu.reportError(e);}
        }
    }
}
user_chrome.init();
