
const {UcfPrefs} = ChromeUtils.importESModule("chrome://user_chrome_files/content/user_chrome/UcfPrefs.mjs");
const {CustomizableUI} = ChromeUtils.importESModule("resource:///modules/CustomizableUI.sys.mjs");
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
    get toolbars_enable() {
        var bars = UcfPrefs.toolbars_enable;
        this.initAreas(bars);
        delete this.toolbars_enable;
        return this.toolbars_enable = bars;
    },
    get custom_styles_chrome() {
        this.initCustom();
        delete this.custom_styles_chrome;
        return this.custom_styles_chrome = UcfPrefs.custom_styles_chrome;
    },
    init() {
        this.addObs();
        UcfPrefs.gbranch = Services.prefs.getBranch(UcfPrefs.PREF_BRANCH);
        var branch = Services.prefs.getDefaultBranch(UcfPrefs.PREF_BRANCH);
        branch.setBoolPref("toolbars_enable", UcfPrefs.toolbars_enable);
        branch.setBoolPref("top_enable", UcfPrefs.t_enable);
        branch.setBoolPref("top_collapsed", UcfPrefs.t_collapsed);
        branch.setBoolPref("top_next_navbar", UcfPrefs.t_next_navbar);
        branch.setBoolPref("top_autohide", UcfPrefs.t_autohide);
        branch.setIntPref("top_showdelay", UcfPrefs.t_showdelay);
        branch.setIntPref("top_hidedelay", UcfPrefs.t_hidedelay);
        branch.setStringPref("top_hover_sel", UcfPrefs.t_hoversel);
        branch.setBoolPref("vertical_enable", UcfPrefs.v_enable);
        branch.setBoolPref("vertical_collapsed", UcfPrefs.v_collapsed);
        branch.setBoolPref("vertical_bar_start", UcfPrefs.v_bar_start);
        branch.setBoolPref("vertical_autohide", UcfPrefs.v_autohide);
        branch.setBoolPref("vertical_mouseenter_sidebar", UcfPrefs.v_mouseenter_sidebar);
        branch.setBoolPref("vertical_fullscreen", UcfPrefs.v_fullscreen);
        branch.setIntPref("vertical_showdelay", UcfPrefs.v_showdelay);
        branch.setIntPref("vertical_hidedelay", UcfPrefs.v_hidedelay);
        branch.setBoolPref("bottom_enable", UcfPrefs.b_enable);
        branch.setBoolPref("bottom_collapsed", UcfPrefs.b_collapsed);
        branch.setBoolPref("custom_styles_chrome", UcfPrefs.custom_styles_chrome);
        branch.setBoolPref("custom_styles_all", UcfPrefs.custom_styles_all);
        branch.setBoolPref("custom_scripts_background", UcfPrefs.custom_scripts_background);
        branch.setBoolPref("custom_scripts_chrome", UcfPrefs.custom_scripts_chrome);
        branch.setBoolPref("custom_scripts_all_chrome", UcfPrefs.custom_scripts_all_chrome);
        branch.setBoolPref("custom_styles_scripts_child", UcfPrefs.custom_styles_scripts_child);
        branch.setStringPref("custom_styles_scripts_groups", "[\"browsers\"]");
        branch.setBoolPref("custom_safemode", true);
        if (UcfPrefs.toolbars_enable = UcfPrefs.gbranch.getBoolPref("toolbars_enable"))
            this.stylePreload();
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
            if (UcfPrefs.custom_styles_scripts_child = UcfPrefs.gbranch.getBoolPref("custom_styles_scripts_child"))
                (async () => {
                    var actorOptions = {
                        child: {
                            esModuleURI: "chrome://user_chrome_files/content/user_chrome/StylesScriptsChild.mjs",
                            events: {
                                DOMWindowCreated: {},
                                DOMContentLoaded: {},
                                pageshow: {},
                            },
                        },
                        allFrames: true,
                        matches: ["about:*", "moz-extension://*", "chrome://*"],
                    };
                    var group = UcfPrefs.gbranch.getStringPref("custom_styles_scripts_groups");
                    if (group)
                        actorOptions.messageManagerGroups = JSON.parse(group);
                    ChromeUtils.registerWindowActor("UcfCustomStylesScripts", actorOptions);
                })();
        } else {
            UcfPrefs.custom_scripts_background = false;
            UcfPrefs.custom_scripts_chrome = false;
            UcfPrefs.custom_scripts_all_chrome = false;
            UcfPrefs.custom_styles_chrome = false;
            UcfPrefs.custom_styles_all = false;
            UcfPrefs.custom_styles_scripts_child = false;
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
    async initAboutPrefs() {
        var newFactory = new AboutPrefs();
        Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
        .registerFactory(newFactory.classID, "AboutPrefs", newFactory.contractID, newFactory);
    },
    restartMozilla(nocache = false) {
        var cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
        Services.obs.notifyObservers(cancelQuit, "quit-application-requested", "restart");
        if (cancelQuit.data)
            return false;
        if (nocache)
            Services.appinfo.invalidateCachesOnRestart();
        var {startup} = Services;
        startup.quit(startup.eAttemptQuit | startup.eRestart);
    },
    async initAreas(vtb_enable) {
        var v_enable, t_enable, b_enable;
        if (vtb_enable) {
            v_enable = UcfPrefs.v_enable = UcfPrefs.gbranch.getBoolPref("vertical_enable");
            t_enable = UcfPrefs.t_enable = UcfPrefs.gbranch.getBoolPref("top_enable");
            b_enable = UcfPrefs.b_enable = UcfPrefs.gbranch.getBoolPref("bottom_enable");
            if (v_enable) {
                try {
                    CustomizableUI.registerArea("ucf-additional-vertical-bar", {
                        type: CustomizableUI.TYPE_TOOLBAR,
                        defaultPlacements: ["ucf-view-bookmarks-sidebar-button", "ucf-view-history-sidebar-button", "ucf-additional-vertical-spring"],
                        defaultCollapsed: false
                    });
                } catch {}
                UcfPrefs.v_collapsed = UcfPrefs.gbranch.getBoolPref("vertical_collapsed");
                UcfPrefs.v_bar_start = UcfPrefs.gbranch.getBoolPref("vertical_bar_start");
                UcfPrefs.v_autohide = UcfPrefs.gbranch.getBoolPref("vertical_autohide");
                UcfPrefs.v_mouseenter_sidebar = UcfPrefs.gbranch.getBoolPref("vertical_mouseenter_sidebar");
                UcfPrefs.v_fullscreen = UcfPrefs.gbranch.getBoolPref("vertical_fullscreen");
                UcfPrefs.v_showdelay = UcfPrefs.gbranch.getIntPref("vertical_showdelay");
                UcfPrefs.v_hidedelay = UcfPrefs.gbranch.getIntPref("vertical_hidedelay");
            }
            if (t_enable) {
                try {
                    CustomizableUI.registerArea("ucf-additional-top-bar", {
                        type: CustomizableUI.TYPE_TOOLBAR,
                        defaultPlacements: ["ucf-open-directories-button", "ucf-open-about-config-button", "ucf-additional-top-spring", "ucf-restart-app"],
                        defaultCollapsed: false
                    });
                } catch {}
                UcfPrefs.t_collapsed = UcfPrefs.gbranch.getBoolPref("top_collapsed");
                UcfPrefs.t_next_navbar = UcfPrefs.gbranch.getBoolPref("top_next_navbar");
                UcfPrefs.t_autohide = UcfPrefs.gbranch.getBoolPref("top_autohide");
                UcfPrefs.t_showdelay = UcfPrefs.gbranch.getIntPref("top_showdelay");
                UcfPrefs.t_hidedelay = UcfPrefs.gbranch.getIntPref("top_hidedelay");
                UcfPrefs.t_hoversel = UcfPrefs.gbranch.getStringPref("top_hover_sel");
            }
            if (b_enable) {
                try {
                    CustomizableUI.registerArea("ucf-additional-bottom-bar", {
                        type: CustomizableUI.TYPE_TOOLBAR,
                        defaultPlacements: ["ucf-additional-bottom-closebutton", "ucf-additional-bottom-spring"],
                        defaultCollapsed: false
                    });
                } catch {}
                UcfPrefs.b_collapsed = UcfPrefs.gbranch.getBoolPref("bottom_collapsed");
            }
        }
        this.initAboutPrefs();
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
    async initButtons(vtb_enable, v_enable, t_enable, b_enable) {
        var [
            uoacb,
            uavs,
            uavtb,
            uats,
            uattb,
            uabs,
            uabtb,
            ura,
            uvhsb,
            uvbsb,
            uodb
        ] = await UcfPrefs.formatMessages();
        try {
            CustomizableUI.createWidget({
                id: "ucf-open-about-config-button",
                type: "custom",
                label: uoacb.value,
                tooltiptext: `${uoacb.attributes[0].value}\n${uoacb.attributes[1].value}\n${uoacb.attributes[2].value}`,
                localized: false,
                onBuild(doc) {
                    var win = doc.defaultView;
                    var prefsInfo = "about:user-chrome-files";
                    if (!win.gInitialPages?.includes(prefsInfo))
                        win.gInitialPages.push(prefsInfo);
                    var btn = doc.createXULElement("toolbarbutton");
                    btn.id = "ucf-open-about-config-button";
                    btn.className = "toolbarbutton-1 chromeclass-toolbar-additional";
                    btn.setAttribute("label", this.label);
                    btn.setAttribute("context", "false");
                    btn.setAttribute("tooltiptext", this.tooltiptext);
                    btn.addEventListener("click", function(e) {
                        if (e.button == 0) {
                            win.switchToTabHavingURI(prefsInfo, true, {
                                relatedToCurrent: true,
                                triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                            });
                        } else if (e.button == 1) {
                            win.switchToTabHavingURI("about:config", true, {
                                relatedToCurrent: true,
                                triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                            });
                        } else if (e.button == 2) {
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
                    id: "ucf-additional-vertical-spring",
                    type: "custom",
                    label: uavs.value,
                    localized: false,
                    onBuild(doc) {
                        var trim = doc.createXULElement("toolbaritem");
                        trim.id = "ucf-additional-vertical-spring";
                        trim.className = "ucf-additional-springs";
                        trim.setAttribute("label", this.label);
                        trim.setAttribute("type", "custom");
                        trim.setAttribute("flex", "1");
                        return trim;
                    }
                });
            } catch {}
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
                    id: "ucf-additional-top-spring",
                    type: "custom",
                    label: uats.value,
                    localized: false,
                    onBuild(doc) {
                        var trim = doc.createXULElement("toolbaritem");
                        trim.id = "ucf-additional-top-spring";
                        trim.className = "ucf-additional-springs";
                        trim.setAttribute("label", this.label);
                        trim.setAttribute("type", "custom");
                        trim.setAttribute("flex", "1");
                        return trim;
                    }
                });
            } catch {}
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
                    id: "ucf-additional-bottom-spring",
                    type: "custom",
                    label: uabs.value,
                    localized: false,
                    onBuild(doc) {
                        var trim = doc.createXULElement("toolbaritem");
                        trim.id = "ucf-additional-bottom-spring";
                        trim.className = "ucf-additional-springs";
                        trim.setAttribute("label", this.label);
                        trim.setAttribute("type", "custom");
                        trim.setAttribute("flex", "1");
                        return trim;
                    }
                });
            } catch {}
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
                            user_chrome.restartMozilla();
                        else if (e.button == 1)
                            win.safeModeRestart();
                        else if (e.button == 2) {
                            e.preventDefault();
                            e.stopPropagation();
                            user_chrome.restartMozilla(true);
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
class AboutPrefs {
    constructor() {
        this.newuri = Services.io.newURI("chrome://user_chrome_files/content/user_chrome/prefs.xhtml");
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
        if (href === "chrome://browser/content/browser.xhtml") {
            Object.defineProperty(win, "UcfPrefs", {
                enumerable: true,
                value: UcfPrefs,
            });
            if (user_chrome.toolbars_enable)
                win.addEventListener("MozBeforeInitialXULLayout", e => {
                    this.addStyleToolbars(win.windowUtils.addSheet);
                    Services.scriptloader.loadSubScript("chrome://user_chrome_files/content/user_chrome/toolbars.js", win);
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
