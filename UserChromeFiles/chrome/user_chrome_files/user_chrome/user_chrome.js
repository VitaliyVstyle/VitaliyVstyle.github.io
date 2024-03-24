
var { UcfPrefs } = ChromeUtils.importESModule("chrome://user_chrome_files/content/user_chrome/UcfPrefs.mjs");
ChromeUtils.defineESModuleGetters(this, {
    UcfStylesScripts: "chrome://user_chrome_files/content/custom_options/CustomStylesScripts.mjs",
    CustomizableUI: "resource:///modules/CustomizableUI.sys.mjs",
});

var user_chrome = {
    init() {
        this.addObs();
        UcfPrefs.gbranch = Services.prefs.getBranch(UcfPrefs.PREF_BRANCH);
        let branch = Services.prefs.getDefaultBranch(UcfPrefs.PREF_BRANCH);
        branch.setBoolPref("vertical_top_bottom_bar_enable", UcfPrefs.vertical_top_bottom_bar_enable);
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
        if (UcfPrefs.vertical_top_bottom_bar_enable = UcfPrefs.gbranch.getBoolPref("vertical_top_bottom_bar_enable"))
            this.sheettoolbars();
        let noSafeMode = true;
        if (UcfPrefs.gbranch.getBoolPref("custom_safemode"))
            noSafeMode = !Services.appinfo.inSafeMode;
        if (noSafeMode) {
            UcfPrefs.custom_scripts_background = UcfPrefs.gbranch.getBoolPref("custom_scripts_background");
            UcfPrefs.custom_scripts_chrome = UcfPrefs.gbranch.getBoolPref("custom_scripts_chrome");
            UcfPrefs.custom_scripts_all_chrome = UcfPrefs.gbranch.getBoolPref("custom_scripts_all_chrome");
            if (UcfPrefs.custom_styles_chrome = UcfPrefs.gbranch.getBoolPref("custom_styles_chrome"))
                (async () => {
                    for (let s of UcfStylesScripts.styleschrome)
                        UcfStylesScripts.preloadSheet(s);
                })();
            if (UcfPrefs.custom_styles_all = UcfPrefs.gbranch.getBoolPref("custom_styles_all"))
                (async () => {
                    for (let s of UcfStylesScripts.stylesall)
                        UcfStylesScripts.registerSheet(s);
                })();
            if (UcfPrefs.custom_styles_scripts_child = UcfPrefs.gbranch.getBoolPref("custom_styles_scripts_child"))
                (async () => {
                    var actorOptions = {
                        child: {
                            esModuleURI: "chrome://user_chrome_files/content/custom_options/CustomStylesScriptsChild.mjs",
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
        }
    },
    observe(win, topic, data) {
        (new UserChrome()).addListener(win);
        if (!win.isChromeWindow) return;
        this.observe = (w, t, d) => {
            (new UserChrome()).addListener(w);
        };
        win.windowRoot.addEventListener("DOMDocElementInserted", e => {
            this.initArea();
        }, { once: true });
    },
    addObs() {
        Services.obs.addObserver(this, "domwindowopened");
    },
    removeObs() {
        Services.obs.removeObserver(this, "domwindowopened");
    },
    _aboutPrefs() {
        class AboutUcfPrefs {
            constructor() {}
            static newuri = Services.io.newURI("chrome://user_chrome_files/content/user_chrome/prefs.xhtml");
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
    get aboutPrefs() {
        delete this.aboutPrefs;
        try {
            this._aboutPrefs();
            return this.aboutPrefs = true;
        } catch(e) {}
        return this.aboutPrefs = false;
    },
    restartMozilla(nocache = false) {
        var cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
        Services.obs.notifyObservers(cancelQuit, "quit-application-requested", "restart");
        if (cancelQuit.data)
            return false;
        if (nocache)
            Services.appinfo.invalidateCachesOnRestart();
        var restart = Services.startup;
        restart.quit(restart.eAttemptQuit | restart.eRestart);
    },
    initArea() {
        this.initCustom();
        var vtb_enable = UcfPrefs.vertical_top_bottom_bar_enable, v_enable, t_enable, b_enable;
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
    async initCustom() {
        if (UcfPrefs.custom_scripts_background) {
            let scope = Cu.Sandbox(Services.scriptSecurityManager.getSystemPrincipal(), {
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
            for (let s of UcfStylesScripts.scriptsbackground)
                try {
                    if (s.path)
                        Services.scriptloader.loadSubScript(`chrome://user_chrome_files/content/custom_scripts/${s.path}`, scope, "UTF-8");
                    if (s.func)
                        new scope.Function(s.func).apply(scope, null);
                } catch (e) {
                    Cu.reportError(e);
                }
        }
    },
    async initButtons(vtb_enable, v_enable, t_enable, b_enable) {
        var aboutPrefs = this.aboutPrefs;
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
                    var prefsInfo = "chrome://user_chrome_files/content/user_chrome/prefs.xhtml";
                    if (aboutPrefs)
                        prefsInfo = "about:user-chrome-files";
                    if (!win.gInitialPages?.includes(prefsInfo))
                        win.gInitialPages.push(prefsInfo);
                    var trbn_0 = doc.createXULElement("toolbarbutton");
                    trbn_0.id = "ucf-open-about-config-button";
                    trbn_0.className = "toolbarbutton-1 chromeclass-toolbar-additional";
                    trbn_0.setAttribute("label", this.label);
                    trbn_0.setAttribute("context", "false");
                    trbn_0.setAttribute("tooltiptext", this.tooltiptext);
                    trbn_0.addEventListener("click", function(e) {
                        if (e.button == 0) {
                            let prefwin = Services.wm.getMostRecentWindow("user_chrome_prefs:window");
                            if (prefwin)
                                prefwin.focus();
                            else
                                win.openDialog("chrome://user_chrome_files/content/user_chrome/prefs_win.xhtml", "user_chrome_prefs:window", "centerscreen,resizable,dialog=no");
                        } else if (e.button == 1) {
                            win.switchToTabHavingURI("about:config", true, {
                                relatedToCurrent: true,
                                triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                            });
                        } else if (e.button == 2) {
                            win.switchToTabHavingURI(prefsInfo, true, {
                                relatedToCurrent: true,
                                triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                            });
                        }
                    });
                    trbn_0.style.setProperty("list-style-image", `url("chrome://user_chrome_files/content/user_chrome/svg/prefs.svg")`, "important");
                    return trbn_0;
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
                    var trbn_0 = doc.createXULElement("toolbarbutton");
                    trbn_0.id = "ucf-restart-app";
                    trbn_0.className = "toolbarbutton-1 chromeclass-toolbar-additional";
                    trbn_0.setAttribute("label", this.label);
                    trbn_0.setAttribute("context", "false");
                    trbn_0.setAttribute("tooltiptext", this.tooltiptext);
                    trbn_0.addEventListener("click", function(e) {
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
                    return trbn_0;
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
                    e.view.SidebarUI.toggle("viewHistorySidebar");
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
                    e.view.SidebarUI.toggle("viewBookmarksSidebar");
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
                    var trbn_0 = doc.createXULElement("toolbarbutton");
                    trbn_0.id = "ucf-open-directories-button";
                    trbn_0.className = "toolbarbutton-1 chromeclass-toolbar-additional";
                    trbn_0.setAttribute("label", this.label);
                    trbn_0.setAttribute("context", "false");
                    trbn_0.setAttribute("tooltiptext", this.tooltiptext);
                    trbn_0.addEventListener("click", function(e) {
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
                    return trbn_0;
                }
            });
        } catch(e) {}
    },
    async sheettoolbars() {
        try {
            let uri = Services.io.newURI("chrome://user_chrome_files/content/user_chrome/vertical_top_bottom_bar.css");
            let UcfSSS = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
            let type = UcfSSS.USER_SHEET;
            let preload = UcfSSS.preloadSheetAsync(uri, type);
            this.sheettoolbars = async f => {
                try {
                    let prd = await preload;
                    f(prd, type);
                } catch (e) {}
            };
        } catch (e) {
            this.sheettoolbars = () => {};
        }
    },
};
class UserChrome {
    constructor() {}
    initWindow(win) {
        var href = win.location.href;
        if (UcfPrefs.custom_styles_chrome)
            this.addStylesChrome(win);
        if (href === "chrome://browser/content/browser.xhtml") {
            if (UcfPrefs.vertical_top_bottom_bar_enable)
                win.addEventListener("MozBeforeInitialXULLayout", e => {
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
        if (UcfPrefs.custom_scripts_all_chrome && href && href !== "about:blank") {
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
        for (let s of UcfStylesScripts.styleschrome)
            s.sheet(win.windowUtils.addSheet);
    }
    loadToolbars(win) {
        user_chrome.sheettoolbars(win.windowUtils.addSheet);
        win.UcfPrefs = UcfPrefs;
        try {
            Services.scriptloader.loadSubScript("chrome://user_chrome_files/content/user_chrome/vertical_top_bottom_bar.js", win, "UTF-8");
        } catch(e) {}
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
