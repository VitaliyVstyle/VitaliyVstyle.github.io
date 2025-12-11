
export var UcfPrefs = {
    default: {
        // ▼ Default settings ▼
        toolbars_enable: true,
        t_enable: true,
        t_collapsed: false,
        t_next_navbar: true,
        t_autohide: false,
        t_showdelay: 300,
        t_hidedelay: 2000,
        t_hoversel: "#nav-bar",
        v_enable: true,
        v_collapsed: false,
        v_bar_start: true,
        v_autohide: false,
        v_mouseenter_sidebar: true,
        v_fullscreen: true,
        v_showdelay: 300,
        v_hidedelay: 2000,
        b_enable: true,
        b_collapsed: false,
        custom_safemode: false,
        custom_styles_scripts_groups: ["browsers",""],
        custom_styles_scripts_matches: ["about:*", "moz-extension://*", "chrome://*"],
        custom_styles_chrome: true,
        custom_styles_all: false,
        custom_scripts_background: false,
        custom_scripts_chrome: true,
        custom_scripts_all_chrome: false,
        custom_styles_scripts_child: false,
        custom_editor_path: "",
        custom_editor_args: "",
        custom_folder_editor_path: "",
        custom_folder_editor_args: "",
        CssChrome: [],
        CssAllFrame: [],
        CssContent: [],
        JsBackground: [],
        JsChrome: {
            DOMContentLoaded: [],
            load: [],
        },
        JsAllChrome: {
            DOMContentLoaded: [],
            load: [],
        },
        JsContent: {
            DOMWindowCreated: [],
            DOMContentLoaded: [],
            pageshow: [],
        },
        // ▲ Default settings ▲
    },
    prefs: {},
    TOPIC_PREFS: "ucf-topic-prefs",
    l10nMap: new Map(),
    get domMap() {
        delete this.domMap;
        return this.domMap = new Map();
    },
    get rebootSet() {
        delete this.rebootSet;
        return this.rebootSet = new Set();
    },
    get global() {
        delete this.global;
        return this.global = globalThis;
    },
    get L10nRegistry() {
        delete this.L10nRegistry;
        var locales = Services.locale.appLocalesAsBCP47;
        if (!locales.includes("en-US")) locales.push("en-US");
        var reg = new L10nRegistry();
        reg.registerSources([
            new L10nFileSource(
                "user_chrome_locales",
                "app",
                locales,
                "chrome://user_chrome_files/content/user_chrome/locales/{locale}/"
            ),
            new L10nFileSource(
                "custom_locales",
                "app",
                locales,
                "chrome://user_chrome_files/content/custom_locales/{locale}/"
            ),
        ]);
        return this.L10nRegistry = reg;
    },
    get customSandbox() {
        delete this.customSandbox;
        return this.customSandbox = this.user_chrome?.customSandbox;
    },
    get dbg() { // by Dumby
        delete this.dbg;
        var sandbox = Cu.Sandbox(Cu.getObjectPrincipal(this), { freshCompartment: true });
        Cc["@mozilla.org/jsdebugger;1"].createInstance(Ci.IJSDebugger).addClass(sandbox);
        var dbg = new sandbox.Debugger();
        var g = globalThis;
        var gref = dbg.gref = dbg.makeGlobalObjectReference(g);
        var envRef = function(name) {
            var val = this.find(name).getVariable(name);
            return val.unsafeDereference?.() || val;
        }
        dbg.ref = (arg, func, glob) => {
            var go = glob === undefined ? g : glob || Cu.getGlobalForObject(func);
            var has = dbg.hasDebuggee(go);
            has || dbg.addDebuggee(go);
            try {
                var ref = go == g ? gref : dbg.makeGlobalObjectReference(go);
                var env = ref.makeDebuggeeValue(func).environment;

                var cn = arg.constructor.name;
                if (cn == "Object") for(var name in arg) try {
                    env.find(name).setVariable(name, ref.makeDebuggeeValue(arg[name]));
                } catch(err) { Cu.reportError(err); }

                else return cn == "Array" ? arg.map(envRef, env) : envRef.call(env, arg);
            } catch(ex) { Cu.reportError(ex); } finally { has || dbg.removeDebuggee(go); }
        }
        return this.dbg = dbg;
    },
    get prefsPath() {
        delete this.prefsPath;
        return this.prefsPath = this.manifestPath.replace(/user_chrome\.manifest$/, "prefs.json");
    },
    initPrefs() {
        Object.assign(this.prefs, this.default);
        try {
            Object.assign(this.prefs, JSON.parse(Cu.readUTF8URI(Services.io.newURI("chrome://user_chrome_files/content/prefs.json"))));
        } catch {
            this.writeJSON(this.default);
        }
        this.initPrefs = () => {};
    },
    async writeJSON(config = this.prefs, path = this.prefsPath) {
        try {
            await IOUtils.writeJSON(path, config, { tmpPath: `${path}.tmp`, mode: "overwrite" });
        } catch(e) {Cu.reportError(e);}
    },
    getPref(pref, val) {
        return this.prefs[pref] ?? val;
    },
    async setPrefs(pref, val) {
        var mwrite = false;
        if (typeof pref === "string") {
            if (this.prefs[pref] === val) return;
            mwrite = true;
            this.prefs[pref] = val;
            Services.obs.notifyObservers(null, this.TOPIC_PREFS, pref);
        } else if (Array.isArray(pref))
            for (let [p, v] of pref) {
                if (this.prefs[p] === v) continue;
                mwrite = true;
                this.prefs[p] = v;
                Services.obs.notifyObservers(null, this.TOPIC_PREFS, p);
            }
        if (!mwrite) return;
        await this.writeJSON();
    },
    doMLocalization(file, {domMap, L10nRegistry} = this) {
        return domMap.get(file) || domMap.set(file, new DOMLocalization([file], false, L10nRegistry)).get(file);
    },
    formatMessages(file, keys, {l10nMap, L10nRegistry} = this) {
        return (l10nMap.get(file) || l10nMap.set(file, {
            l10n: null,
            async fM() {
                this.fM = async () => this.l10n;
                return this.l10n = (async () => this.l10n = await new Localization([file], false, L10nRegistry).formatMessages(keys))();
            },
        }).get(file)).fM();
    },
    async viewToolbars(win, externalToolbars) {
        this.viewToolbars = async () => this.viewToolbarsScript;
        return this.viewToolbarsScript = (async () => {
            var newStrFn = "";
            var oVTC = win.onViewToolbarCommand;
            if (typeof oVTC === "function") {
                let strFn = `${oVTC}`, regExr = /(BrowserUsageTelemetry\s*\.\s*recordToolbarVisibility\s*\(\s*toolbarId.+?\)\s*\;)/g;
                if (regExr.test(strFn)) {
                    newStrFn = `window.onViewToolbarCommand = ${strFn.replace(/^(async\s)?.*?\(/, `$1function ${oVTC.name}(`)
                        .replace(regExr, 'if (!/ucf-additional-.+?-bar/.test(toolbarId)) { $1 }')};`;
                }
            }
            if (externalToolbars) {
                let oVTPS = win.ToolbarContextMenu?.onViewToolbarsPopupShowing;
                if (typeof oVTPS === "function") this.viewToolbarsPopupShowing(win.ToolbarContextMenu, oVTPS);
                else if (typeof (oVTPS = win.onViewToolbarsPopupShowing) === "function") newStrFn += "\nUcfPrefs.viewToolbarsPopupShowing(window, onViewToolbarsPopupShowing);";
            }
            Services.io.getProtocolHandler("resource")
            .QueryInterface(Ci.nsIResProtocolHandler)
            .setSubstitution("ucf_on_view_toolbars", Services.io.newURI(`data:charset=utf-8,${encodeURIComponent(newStrFn)}`));
            return this.viewToolbarsScript = await ChromeUtils.compileScript("resource://ucf_on_view_toolbars");
        })();
    },
    viewToolbarsPopupShowing(obj, oVTPS) {
        obj.onViewToolbarsPopupShowing = function() {
            var func = oVTPS.apply(obj, arguments);
            var popup = arguments[0].target;
            if (/toolbar-context-menu|view-menu-popup|customization-toolbar-menu/.test(popup.id)) {
                let win = popup.ownerGlobal;
                let Item = arguments[1] || popup.querySelector(":scope > :nth-last-child(1 of [toolbarId])")?.nextElementSibling;
                for (let toolbar of win.ucf_toolbars_win.externalToolbars) {
                    if (toolbar.id === "ucf-additional-vertical-bar" && popup.id === "customization-toolbar-menu") continue;
                    let mItem = win.document.createXULElement("menuitem");
                    mItem.setAttribute("id", `toggle_${toolbar.id}`);
                    mItem.setAttribute("toolbarId", toolbar.id);
                    mItem.setAttribute("type", "checkbox");
                    mItem.setAttribute("label", toolbar.getAttribute("toolbarname"));
                    mItem.setAttribute("checked", !toolbar.collapsed);
                    mItem.setAttribute("accesskey", toolbar.getAttribute("accesskey"));
                    if (popup.id !== "toolbar-context-menu") mItem.setAttribute("key", toolbar.getAttribute("key"));
                    if (Item) Item.before(mItem);
                    else popup.append(mItem);
                    mItem.addEventListener("command", win.onViewToolbarCommand);
                }
            }
            return func;
        };
    },
    restartApp(nocache = false) {
        var cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
        Services.obs.notifyObservers(cancelQuit, "quit-application-requested", "restart");
        if (cancelQuit.data) return false;
        if (nocache) Services.appinfo.invalidateCachesOnRestart();
        var {startup} = Services;
        startup.quit(startup.eAttemptQuit | startup.eRestart);
    },
    openHavingURI(win, url, having) {
        switch (Services.appinfo.ID) {
            case "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}": // Firefox or etc.
                win = (win.top?.opener && !win.top.opener.closed) ? win.top.opener : Services.wm.getMostRecentWindow("navigator:browser");
                if (win) {
                    let triggeringPrincipal = Services.scriptSecurityManager.getSystemPrincipal();
                    if (having) win.switchToTabHavingURI(url, true, {relatedToCurrent: true, triggeringPrincipal});
                    else {
                        let params = {triggeringPrincipal};
                        params.index = params.tabIndex = win.gBrowser.selectedTab._tPos + 1;
                        win.gBrowser.selectedTab = win.gBrowser.addTab(url, params);
                    }
                }
                break;
            case "{3550f703-e582-4d05-9a08-453d09bdfdc6}": // Thunderbird
                win = (win.top?.opener && !win.top.opener.closed) ? win.top.opener : Services.wm.getMostRecentWindow("mail:3pane");
                if (win) win.document.querySelector("#tabmail")?.openTab("contentTab", {url});
                break;
        }
    },
    async initAboutPrefs(file, description, hide) {
        var newFactory = new AboutPrefs(file, description, hide);
        Components.manager.QueryInterface(Ci.nsIComponentRegistrar)
        .registerFactory(newFactory.classID, description, newFactory.contractID, newFactory);
    },
};

class AboutPrefs {
    constructor(file, description, hide) {
        this.newuri = Services.io.newURI(`chrome://user_chrome_files/content/user_chrome/${file}`);
        this.classDescription = `about:${description}`;
        this.classID = Components.ID(Services.uuid.generateUUID().toString());
        this.contractID = `@mozilla.org/network/protocol/about;1?what=${description}`;
        this.QueryInterface = ChromeUtils.generateQI([Ci.nsIAboutModule]);
        this.geturiflags = !hide ? Ci.nsIAboutModule.ALLOW_SCRIPT : (Ci.nsIAboutModule.ALLOW_SCRIPT | Ci.nsIAboutModule.HIDE_FROM_ABOUTABOUT);
    }
    newChannel(uri, loadInfo) {
        var chan = Services.io.newChannelFromURIWithLoadInfo(this.newuri, loadInfo);
        chan.owner = Services.scriptSecurityManager.getSystemPrincipal();
        return chan;
    }
    getURIFlags() {
        return this.geturiflags;
    }
    getChromeURI() {
        return this.newuri;
    }
    createInstance(iid) {
        return this.QueryInterface(iid);
    }
}
