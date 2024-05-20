
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
        (new UserChrome()).addListener(win);
        if (!win.isChromeWindow) return;
        this.observe = (w, t, d) => {
            (new UserChrome()).addListener(w);
        };
        this.initCustom();
        this.initArea();
        this.aboutPrefs();
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
    initArea() {
        var vtb_enable = UcfPrefs.toolbars_enable, v_enable, t_enable, b_enable;
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
                } catch(e) {}
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
                } catch(e) {}
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
                } catch(e) {}
                UcfPrefs.b_collapsed = UcfPrefs.gbranch.getBoolPref("bottom_collapsed");
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
        } catch(e) {}
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
            } catch(e) {}
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
            } catch(e) {}
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
            } catch(e) {}
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
            } catch(e) {}
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
            } catch(e) {}
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
            } catch(e) {}
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
        } catch(e) {}
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
        } catch(e) {}
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
        } catch(e) {}
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
        } catch(e) {}
    },
};
class UserChrome {
    constructor() {}
    initWindow(win) {
        var href = win.location.href;
        if (UcfPrefs.custom_styles_chrome)
            this.addStylesChrome(win);
        if (href === "chrome://browser/content/browser.xhtml") {
            Object.defineProperty(win, "UcfPrefs", {
                enumerable: true,
                configurable: false,
                writable: false,
                value: UcfPrefs,
            });
            if (UcfPrefs.toolbars_enable)
                win.addEventListener("MozBeforeInitialXULLayout", e => {
                    this.addStyleToolbars(win.windowUtils.addSheet);
                    this.loadToolbars(win);
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
    async addStyleToolbars(func) {
        func(await user_chrome.stylePreload(), UcfSSS.USER_SHEET);
    }
    loadToolbars(win) {
        try {
            Services.scriptloader.loadSubScript("chrome://user_chrome_files/content/user_chrome/toolbars.js", win, "UTF-8");
        } catch(e) {Cu.reportError(e);}
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
