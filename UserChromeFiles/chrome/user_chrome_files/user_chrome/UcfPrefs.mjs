
export var UcfPrefs = {
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
    custom_styles_chrome: true,
    custom_styles_all: false,
    custom_scripts_background: false,
    custom_scripts_chrome: true,
    custom_scripts_all_chrome: false,
    custom_styles_scripts_child: false,
    // ▲ Default settings ▲

    PREF_BRANCH: "extensions.user_chrome_files.",
    gbranch: null,
    l10n: null,
    get global() {
        delete this.global;
        return this.global = globalThis;
    },
    get L10nRegistry() {
        delete this.L10nRegistry;
        var locales = Services.locale.appLocalesAsBCP47;
        if (!locales.includes("en-US"))
            locales.push("en-US");
        var reg = new L10nRegistry();
        reg.registerSources([
            new L10nFileSource(
                "user_chrome_files",
                "app",
                locales,
                "chrome://user_chrome_files/content/locales/{locale}/"
            ),
        ]);
        return this.L10nRegistry = reg;
    },
    async formatMessages() {
        this.formatMessages = async () => {
            return this.l10n;
        };
        return this.l10n = (async () => {
            return this.l10n = await new Localization(["main.ftl"], false, this.L10nRegistry).formatMessages([
                "ucf-open-about-config-button",
                "ucf-additional-vertical-spring",
                "ucf-additional-vertical-toggle-button",
                "ucf-additional-top-spring",
                "ucf-additional-top-toggle-button",
                "ucf-additional-bottom-spring",
                "ucf-additional-bottom-toggle-button",
                "ucf-restart-app",
                "ucf-view-history-sidebar-button",
                "ucf-view-bookmarks-sidebar-button",
                "ucf-open-directories-button",
                "ucf-additional-top-bar",
                "ucf-additional-vertical-bar",
                "ucf-additional-bottom-bar",
                "ucf-additional-bottom-closebutton",
            ]);
        })();
    },
    async viewToolbars(win, externalToolbars) {
        this.viewToolbars = async () => {
            return this.viewToolbarsScript;
        };
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
                if (typeof oVTPS === "function")
                    this.viewToolbarsPopupShowing(win.ToolbarContextMenu, oVTPS);
                else if (typeof (oVTPS = win.onViewToolbarsPopupShowing) === "function")
                    newStrFn += "\nUcfPrefs.viewToolbarsPopupShowing(window, onViewToolbarsPopupShowing);";
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
                    mItem.setAttribute("id", "toggle_" + toolbar.id);
                    mItem.setAttribute("toolbarId", toolbar.id);
                    mItem.setAttribute("type", "checkbox");
                    mItem.setAttribute("label", toolbar.getAttribute("toolbarname"));
                    mItem.setAttribute("checked", toolbar.getAttribute("collapsed") != "true");
                    mItem.setAttribute("accesskey", toolbar.getAttribute("accesskey"));
                    if (popup.id !== "toolbar-context-menu")
                        mItem.setAttribute("key", toolbar.getAttribute("key"));
                    if (Item) Item.before(mItem);
                    else popup.append(mItem);
                    mItem.addEventListener("command", win.onViewToolbarCommand);
                }
            }
            return func;
        };
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
    get customSandbox() {
        delete this.customSandbox;
        var scope = this.user_chrome?.customSandbox;
        if (!scope)
            scope = this.user_chrome?._initCustom();
        return this.customSandbox = scope;
    },
};
