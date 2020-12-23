// Не редактировать!
var PREF_BRANCH = "extensions.user_chrome_files.", Branch, Prefs;
var user_chrome = {
    options: {
        t_enable: true,
        t_collapsed: false,
        t_next_navbar: true,
        b_enable: true,
        b_collapsed: false,
        v_enable: true,
        v_collapsed: false,
        v_bar_start: true,
        v_autohide: false,
        v_mouseenter_sidebar: true,
        v_fullscreen: true,
        v_showdelay: 300,
        v_hidedelay: 2000
    },
    initialized: false,
    vertical_top_bottom_bar_enable: true,
    custom_style_agent: false,
    custom_style_user: false,
    custom_style_author: false,
    custom_script: false,
    custom_script_win: false,
    custom_script_all_win: false,
    get styleSS() {
        delete this.styleSS;
        return this.styleSS = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    },
    get styleURI() {
        delete this.styleURI;
        return this.styleURI = Services.io.newURI("chrome://user_chrome_files/content/vertical_top_bottom_bar/vertical_top_bottom_bar.css");
    },
    get _loadIntoWindow() {
        delete this._loadIntoWindow;
        this.init();
        return this._loadIntoWindow = function(win) {
            if (this.vertical_top_bottom_bar_enable) {
                try {
                    let utils = win.windowUtils || win.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils);
                    utils.loadSheet(this.styleURI, utils.USER_SHEET);
                    Services.scriptloader.loadSubScript("chrome://user_chrome_files/content/vertical_top_bottom_bar/vertical_top_bottom_bar.js", win, "UTF-8");
                    let options = this.options;
                    if (options.t_enable)
                        options.t_collapsed = Prefs.getBoolPref("top_collapsed");
                    if (options.b_enable)
                        options.b_collapsed = Prefs.getBoolPref("bottom_collapsed");
                    if (options.v_enable)
                        options.v_collapsed = Prefs.getBoolPref("vertical_collapsed");
                    Object.assign(win.vertical_top_bottom_bar.options, options);
                    win.vertical_top_bottom_bar.init();
                } catch(e) {Cu.reportError(e);}
            }
            if (this.custom_script_win) {
                try {
                    Services.scriptloader.loadSubScript("chrome://user_chrome_files/content/custom_scripts/custom_script_win.js", win, "UTF-8");
                } catch(e) {Cu.reportError(e);}
            }
        };
    },
    loadIntoWindow(win, href) {
        if (href.startsWith("chrome://browser/content/browser.x"))
            this._loadIntoWindow(win);
        if (this.custom_script_all_win) {
            try {
                Services.scriptloader.loadSubScript("chrome://user_chrome_files/content/custom_scripts/custom_script_all_win.js", win, "UTF-8");
            } catch(e) {Cu.reportError(e);}
        }
    },
    loadPrefsStyle() {
        try {
            Branch = Services.prefs.getDefaultBranch(PREF_BRANCH);
            Prefs = Services.prefs.getBranch(PREF_BRANCH);
            Branch.setBoolPref("vertical_top_bottom_bar_enable", true);
            Branch.setBoolPref("vertical_enable", true);
            Branch.setBoolPref("top_enable", true);
            Branch.setBoolPref("top_next_navbar", true);
            Branch.setBoolPref("bottom_enable", true);
            Branch.setBoolPref("vertical_collapsed", false);
            Branch.setBoolPref("vertical_bar_start", true);
            Branch.setBoolPref("vertical_autohide", false);
            Branch.setBoolPref("vertical_mouseenter_sidebar", true);
            Branch.setBoolPref("vertical_fullscreen", true);
            Branch.setIntPref("vertical_showdelay", 300);
            Branch.setIntPref("vertical_hidedelay", 2000);
            Branch.setBoolPref("top_collapsed", false);
            Branch.setBoolPref("bottom_collapsed", false);
            Branch.setBoolPref("custom_style_agent", false);
            Branch.setBoolPref("custom_style_user", false);
            Branch.setBoolPref("custom_style_author", false);
            Branch.setBoolPref("custom_script", false);
            Branch.setBoolPref("custom_script_win", false);
            Branch.setBoolPref("custom_script_all_win", false);
            this.vertical_top_bottom_bar_enable = Prefs.getBoolPref("vertical_top_bottom_bar_enable");
            let noSafeMode = true;
            try {
                noSafeMode = !Services.appinfo.inSafeMode;
            } catch(e) {}
            if (noSafeMode) {
                this.custom_style_agent = Prefs.getBoolPref("custom_style_agent");
                this.custom_style_user = Prefs.getBoolPref("custom_style_user");
                this.custom_style_author = Prefs.getBoolPref("custom_style_author");
                this.custom_script = Prefs.getBoolPref("custom_script");
                this.custom_script_win = Prefs.getBoolPref("custom_script_win");
                this.custom_script_all_win = Prefs.getBoolPref("custom_script_all_win");
            }
        } catch(e) {Cu.reportError(e);}
        if (this.custom_style_agent) {
            try {
                let agentURI = Services.io.newURI("chrome://user_chrome_files/content/custom_styles/custom_style_agent.css");
                if (!this.styleSS.sheetRegistered(agentURI, this.styleSS.AGENT_SHEET))
                    this.styleSS.loadAndRegisterSheet(agentURI, this.styleSS.AGENT_SHEET);
            } catch(e) {Cu.reportError(e);}
        }
        if (this.custom_style_user) {
            try {
                let userURI = Services.io.newURI("chrome://user_chrome_files/content/custom_styles/custom_style_user.css");
                if (!this.styleSS.sheetRegistered(userURI, this.styleSS.USER_SHEET))
                    this.styleSS.loadAndRegisterSheet(userURI, this.styleSS.USER_SHEET);
            } catch(e) {Cu.reportError(e);}
        }
        if (this.custom_style_author) {
            try {
                let authorURI = Services.io.newURI("chrome://user_chrome_files/content/custom_styles/custom_style_author.css");
                if (!this.styleSS.sheetRegistered(authorURI, this.styleSS.AUTHOR_SHEET))
                    this.styleSS.loadAndRegisterSheet(authorURI, this.styleSS.AUTHOR_SHEET);
            } catch(e) {Cu.reportError(e);}
        }
    },
    _aboutPrefs() {
        var contractID = "@mozilla.org/network/protocol/about;1?what=user-chrome-files";
        var classID = Components.ID(Cc["@mozilla.org/uuid-generator;1"].getService(Ci.nsIUUIDGenerator).generateUUID().toString());
        var { nsIAboutModule } = Ci;
        function aboutUserChromePrefs() {}
        aboutUserChromePrefs.prototype = {
            classDescription: "about:user-chrome-files",
            classID: classID,
            contractID: contractID,
            QueryInterface(aIID) {
                if (aIID.equals(nsIAboutModule) || aIID.equals(Ci.nsISupports)) {
                    return this;
                }
                throw "2147500034";
            },
            newChannel(uri, loadInfo) {
                var chan = Services.io.newChannelFromURIWithLoadInfo(Services.io.newURI("chrome://user_chrome_files/content/options/prefs.xhtml"), loadInfo);
                chan.owner = Services.scriptSecurityManager.getSystemPrincipal();
                return chan;
            },
            getURIFlags(uri) {
                return nsIAboutModule.ALLOW_SCRIPT;
            }
        };
        var newFactory = {
            createInstance(outer, iid) {
                if (outer) {
                    throw "2147746064";
                }
                return (new aboutUserChromePrefs()).QueryInterface(iid);
            }
        };
        Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
        .registerFactory(classID, "aboutUserChromePrefs", contractID, newFactory);
    },
    get aboutPrefs() {
        delete this.aboutPrefs;
        try {
            this._aboutPrefs();
        } catch(e) {
            return this.aboutPrefs = false;
        }
        return this.aboutPrefs = true;
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
    init() {
        if (this.initialized) return;
        this.initialized = true;
        var CustomizableUI;
        try {
            CustomizableUI = ChromeUtils.import("resource:///modules/CustomizableUI.jsm").CustomizableUI;
        } catch(e) {
            return;
        }
        var ns_xul = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
        try {
            let aboutPrefs = this.aboutPrefs;
            CustomizableUI.createWidget({
                id: "add-open-about-config-button",
                type: "custom",
                label: "Открыть настройки",
                tooltiptext: "ЛКМ: Открыть настройки в окне\nСКМ: Открыть about:config\nПКМ: Открыть настройки во вкладке",
                localized: false,
                onBuild(doc) {
                    var win = doc.defaultView;
                    var prefsInfo = "chrome://user_chrome_files/content/options/prefs.xhtml";
                    if (aboutPrefs)
                        prefsInfo = "about:user-chrome-files";
                    if ("gInitialPages" in win && !win.gInitialPages.includes(prefsInfo))
                        win.gInitialPages.push(prefsInfo);
                    var trbn_0 = doc.createElementNS(ns_xul, "toolbarbutton");
                    trbn_0.id = "add-open-about-config-button";
                    trbn_0.className = "toolbarbutton-1 chromeclass-toolbar-additional";
                    trbn_0.setAttribute("label", "Открыть настройки");
                    trbn_0.setAttribute("context", "false");
                    trbn_0.setAttribute("tooltiptext", "ЛКМ: Открыть настройки в окне\nСКМ: Открыть about:config\nПКМ: Открыть настройки во вкладке");
                    trbn_0.addEventListener("click", function(e) {
                        if (e.button == 0) {
                            let prefwin = Services.wm.getMostRecentWindow("user_chrome_prefs:window");
                            if (prefwin)
                                prefwin.focus();
                            else
                                win.openDialog("chrome://user_chrome_files/content/options/prefs_win.xhtml", "user_chrome_prefs:window", "centerscreen,resizable,dialog=no");
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
                    trbn_0.style.setProperty("list-style-image", `url("chrome://user_chrome_files/content/vertical_top_bottom_bar/svg/about-config-16.svg")`, "important");
                    return trbn_0;
                }
            });
        } catch(e) {}
        if (this.vertical_top_bottom_bar_enable) {
            let options = this.options, v_enable, t_enable, b_enable;
            try {
                v_enable = options.v_enable = Prefs.getBoolPref("vertical_enable");
                t_enable = options.t_enable = Prefs.getBoolPref("top_enable");
                b_enable = options.b_enable = Prefs.getBoolPref("bottom_enable");
            } catch(e) {}
            if (v_enable) {
                try {
                    CustomizableUI.registerArea("add-additional-vertical-bar", {
                        type: CustomizableUI.TYPE_TOOLBAR,
                        defaultPlacements: ["add-view-bookmarks-sidebar-button", "add-view-history-sidebar-button", "add-additional-vertical-spring"],
                        defaultCollapsed: false
                    });
                    options.v_collapsed = Prefs.getBoolPref("vertical_collapsed");
                    options.v_bar_start = Prefs.getBoolPref("vertical_bar_start");
                    options.v_autohide = Prefs.getBoolPref("vertical_autohide");
                    options.v_mouseenter_sidebar = Prefs.getBoolPref("vertical_mouseenter_sidebar");
                    options.v_fullscreen = Prefs.getBoolPref("vertical_fullscreen");
                    options.v_showdelay = Prefs.getIntPref("vertical_showdelay");
                    options.v_hidedelay = Prefs.getIntPref("vertical_hidedelay");
                } catch(e) {}
            }
            if (t_enable) {
                try {
                    CustomizableUI.registerArea("add-additional-top-bar", {
                        type: CustomizableUI.TYPE_TOOLBAR,
                        defaultPlacements: ["add-open-directories-button", "add-open-about-config-button", "add-additional-top-spring", "add-restart-app"],
                        defaultCollapsed: false
                    });
                    options.t_collapsed = Prefs.getBoolPref("top_collapsed");
                    options.t_next_navbar = Prefs.getBoolPref("top_next_navbar");
                } catch(e) {}
            }
            if (b_enable) {
                try {
                    CustomizableUI.registerArea("add-additional-bottom-bar", {
                        type: CustomizableUI.TYPE_TOOLBAR,
                        defaultPlacements: ["add-additional-bottom-closebutton", "add-additional-bottom-spring"],
                        defaultCollapsed: false
                    });
                    options.b_collapsed = Prefs.getBoolPref("bottom_collapsed");
                } catch(e) {}
            }
            if (v_enable) {
                try {
                    CustomizableUI.createWidget({
                        id: "add-additional-vertical-spring",
                        type: "custom",
                        label: "Растягивающийся интервал",
                        localized: false,
                        onBuild(doc) {
                            var trim = doc.createElementNS(ns_xul, "toolbaritem");
                            trim.id = "add-additional-vertical-spring";
                            trim.className = "add-additional-springs";
                            trim.setAttribute("label", "Растягивающийся интервал");
                            trim.setAttribute("type", "custom");
                            trim.setAttribute("flex", "1");
                            return trim;
                        }
                    });
                } catch(e) {}
                try {
                    CustomizableUI.createWidget({
                        id: "add-additional-vertical-toggle-button",
                        label: "Переключить Верт. панель",
                        tooltiptext: "Скрыть / Показать Вертикальную панель",
                        localized: false,
                        defaultArea: CustomizableUI.AREA_NAVBAR,
                        onCommand(e) {
                            CustomizableUI.setToolbarVisibility("add-additional-vertical-bar", e.target.ownerDocument.querySelector("#add-additional-vertical-bar").collapsed);
                        }
                    });
                } catch(e) {}
            }
            if (t_enable) {
                try {
                    CustomizableUI.createWidget({
                        id: "add-additional-top-spring",
                        type: "custom",
                        label: "Растягивающийся интервал",
                        localized: false,
                        onBuild(doc) {
                            var trim = doc.createElementNS(ns_xul, "toolbaritem");
                            trim.id = "add-additional-top-spring";
                            trim.className = "add-additional-springs";
                            trim.setAttribute("label", "Растягивающийся интервал");
                            trim.setAttribute("type", "custom");
                            trim.setAttribute("flex", "1");
                            return trim;
                        }
                    });
                } catch(e) {}
                try {
                    CustomizableUI.createWidget({
                        id: "add-additional-top-toggle-button",
                        label: "Переключить Доп. панель",
                        tooltiptext: "Скрыть / Показать Дополнительную панель",
                        localized: false,
                        defaultArea: CustomizableUI.AREA_NAVBAR,
                        onCommand(e) {
                            CustomizableUI.setToolbarVisibility("add-additional-top-bar", e.target.ownerDocument.querySelector("#add-additional-top-bar").collapsed);
                        }
                    });
                } catch(e) {}
            }
            if (b_enable) {
                try {
                    CustomizableUI.createWidget({
                        id: "add-additional-bottom-spring",
                        type: "custom",
                        label: "Растягивающийся интервал",
                        localized: false,
                        onBuild(doc) {
                            var trim = doc.createElementNS(ns_xul, "toolbaritem");
                            trim.id = "add-additional-bottom-spring";
                            trim.className = "add-additional-springs";
                            trim.setAttribute("label", "Растягивающийся интервал");
                            trim.setAttribute("type", "custom");
                            trim.setAttribute("flex", "1");
                            return trim;
                        }
                    });
                } catch(e) {}
                try {
                    CustomizableUI.createWidget({
                        id: "add-additional-bottom-toggle-button",
                        label: "Переключить Ниж. панель",
                        tooltiptext: "Скрыть / Показать Нижнюю панель",
                        localized: false,
                        defaultArea: CustomizableUI.AREA_NAVBAR,
                        onCommand(e) {
                            CustomizableUI.setToolbarVisibility("add-additional-bottom-bar", e.target.ownerDocument.querySelector("#add-additional-bottom-bar").collapsed);
                        }
                    });
                } catch(e) {}
            }
            try {
                CustomizableUI.createWidget({
                    id: "add-restart-app",
                    type: "custom",
                    label: "Перезагрузка",
                    tooltiptext: "ЛКМ: Перезапустить приложение\nСКМ: Перезапустить без дополнений\nПКМ: Перезапустить и заново создать кэш быстрой загрузки",
                    localized: false,
                    onBuild(doc) {
                        var win = doc.defaultView;
                        var trbn_0 = doc.createElementNS(ns_xul, "toolbarbutton");
                        trbn_0.id = "add-restart-app";
                        trbn_0.className = "toolbarbutton-1 chromeclass-toolbar-additional";
                        trbn_0.setAttribute("label", "Перезагрузка");
                        trbn_0.setAttribute("context", "false");
                        trbn_0.setAttribute("tooltiptext", "ЛКМ: Перезапустить приложение\nСКМ: Перезапустить без дополнений\nПКМ: Перезапустить и заново создать кэш быстрой загрузки");
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
                    id: "add-view-history-sidebar-button",
                    label: "История",
                    tooltiptext: "Показать / Скрыть Историю",
                    localized: false,
                    onCommand(e) {
                        var win = e.view;
                        if ("SidebarUI" in win)
                            win.SidebarUI.toggle("viewHistorySidebar");
                        else if ("toggleSidebar" in win)
                            win.toggleSidebar("viewHistorySidebar");
                    }
                });
            } catch(e) {}
            try {
                CustomizableUI.createWidget({
                    id: "add-view-bookmarks-sidebar-button",
                    label: "Закладки",
                    tooltiptext: "Показать / Скрыть Закладки",
                    localized: false,
                    onCommand(e) {
                        var win = e.view;
                        if ("SidebarUI" in win)
                            win.SidebarUI.toggle("viewBookmarksSidebar");
                        else if ("toggleSidebar" in win)
                            win.toggleSidebar("viewBookmarksSidebar");
                    }
                });
            } catch(e) {}
            try {
                CustomizableUI.createWidget({
                    id: "add-open-directories-button",
                    type: "custom",
                    label: "Открыть папку",
                    tooltiptext: "ЛКМ: Папка user_chrome_files\nСКМ: Папка профиля\nПКМ: Папка установки",
                    localized: false,
                    onBuild(doc) {
                        var trbn_0 = doc.createElementNS(ns_xul, "toolbarbutton");
                        trbn_0.id = "add-open-directories-button";
                        trbn_0.className = "toolbarbutton-1 chromeclass-toolbar-additional";
                        trbn_0.setAttribute("label", "Открыть папку");
                        trbn_0.setAttribute("context", "false");
                        trbn_0.setAttribute("tooltiptext", "ЛКМ: Папка user_chrome_files\nСКМ: Папка профиля\nПКМ: Папка установки");
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
        }
        if (this.custom_script) {
            Promise.resolve().then(() => {
                try {
                    let scope = Cu.Sandbox(Services.scriptSecurityManager.getSystemPrincipal(), {
                        wantComponents: true,
                        sandboxName: "user_chrome_files: custom_script"
                    });
                    Object.assign(scope, {
                        Services,
                        CustomizableUI,
                    });
                    try {
                        const {XPCOMUtils} = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
                        Object.assign(scope, {
                            XPCOMUtils,
                        });
                        if ("defineLazyGlobalGetters" in XPCOMUtils)
                            XPCOMUtils.defineLazyGlobalGetters(scope, [
                                "atob",
                                "btoa",
                                "Blob",
                                "ChromeUtils",
                                "CSS",
                                "CSSRule",
                                "DOMParser",
                                "Event",
                                "File",
                                "FileReader",
                                "InspectorUtils",
                                "URL",
                                "XMLHttpRequest",
                                "fetch",
                            ]);
                        if ("defineLazyModuleGetters" in XPCOMUtils)
                            XPCOMUtils.defineLazyModuleGetters(scope, {
                                console: "resource://gre/modules/Console.jsm",
                                AddonManager: "resource://gre/modules/AddonManager.jsm",
                                AppConstants: "resource://gre/modules/AppConstants.jsm",
                                E10SUtils: "resource://gre/modules/E10SUtils.jsm",
                                FileUtils: "resource://gre/modules/FileUtils.jsm",
                                OS: "resource://gre/modules/osfile.jsm",
                                PlacesUtils: "resource://gre/modules/PlacesUtils.jsm",
                                setTimeout: "resource://gre/modules/Timer.jsm",
                                setTimeoutWithTarget: "resource://gre/modules/Timer.jsm",
                                clearTimeout: "resource://gre/modules/Timer.jsm",
                                setInterval: "resource://gre/modules/Timer.jsm",
                                setIntervalWithTarget: "resource://gre/modules/Timer.jsm",
                                clearInterval: "resource://gre/modules/Timer.jsm",
                            });
                    } catch(e) {Cu.reportError(e);}
                    Services.scriptloader.loadSubScript("chrome://user_chrome_files/content/custom_scripts/custom_script.js", scope, "UTF-8");
                } catch(e) {Cu.reportError(e);}
            });
        }
    }
};
user_chrome.loadPrefsStyle();
