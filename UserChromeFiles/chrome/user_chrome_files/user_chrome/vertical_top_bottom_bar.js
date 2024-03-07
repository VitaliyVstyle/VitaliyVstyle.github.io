
var vertical_top_bottom_bar = {
    navtoolbox: null,
    verticalbox: null,
    verticalbar: null,
    sidebarbox: null,
    topbar: null,
    bottombar: null,
    timer: null,
    timerImg: null,
    panelcontainer: null,
    showTimer: null,
    hideTimer: null,
    _visible: false,
    isPopupOpen: false,
    isMouseOver: false,
    isMouseSidebar: false,
    observe(aSubject, aTopic, aData) {
        Services.obs.removeObserver(this, "browser-delayed-startup-finished");
        this.delayedstartup();
    },
    init() {
        var navtoolbox = this.navtoolbox = window.gNavToolbox || document.querySelector("#navigator-toolbox");
        if (!navtoolbox) return;
        var toolbarcreate = false;
        var l10n = UcfPrefs.formatMessages();
        if (UcfPrefs.t_enable) {
            try {
                let topbar = document.createXULElement("toolbar");
                l10n.then(attr => {
                    topbar.setAttribute("toolbarname", attr[11].value);
                });
                topbar.id = "ucf-additional-top-bar";
                topbar.className = "toolbar-primary chromeclass-toolbar customization-target browser-toolbar";
                topbar.setAttribute("context", "toolbar-context-menu");
                topbar.setAttribute("mode", "icons");
                topbar.setAttribute("iconsize", "small");
                topbar.setAttribute("fullscreentoolbar", "true");
                topbar.setAttribute("customizable", "true");
                topbar.setAttribute("collapsed", `${UcfPrefs.t_collapsed}`);
                let sel = UcfPrefs.t_next_navbar ? "#nav-bar" : ":scope > toolbar:last-of-type";
                navtoolbox.querySelector(sel).after(topbar);
                this.topbar = topbar;
                toolbarcreate = true;
            } catch (e) {}
        }

        var externalToolbars = false;
        if (UcfPrefs.v_enable) {
            try {
                let vcontainer = document.createXULElement("vbox");
                vcontainer.id = "ucf-additional-vertical-container";
                vcontainer.setAttribute("vertautohide", `${UcfPrefs.v_autohide}`);
                vcontainer.setAttribute("v_vertical_bar_start", `${UcfPrefs.v_bar_start}`);
                vcontainer.setAttribute("hidden", "true");
                let verticalbox = document.createXULElement("vbox");
                verticalbox.id = "ucf-additional-vertical-box";
                verticalbox.setAttribute("vertautohide", `${UcfPrefs.v_autohide}`);
                verticalbox.setAttribute("v_vertical_bar_start", `${UcfPrefs.v_bar_start}`);
                verticalbox.setAttribute("flex", "1");
                let verticalbar = document.createXULElement("toolbar");
                l10n.then(attr => {
                    verticalbar.setAttribute("toolbarname", attr[12].value);
                });
                verticalbar.id = "ucf-additional-vertical-bar";
                verticalbar.className = "toolbar-primary chromeclass-toolbar customization-target browser-toolbar";
                verticalbar.setAttribute("toolboxid", "navigator-toolbox");
                verticalbar.setAttribute("context", "toolbar-context-menu");
                verticalbar.setAttribute("mode", "icons");
                verticalbar.setAttribute("iconsize", "small");
                verticalbar.setAttribute("orient", "vertical");
                verticalbar.setAttribute("fullscreentoolbar", `${UcfPrefs.v_fullscreen}`);
                verticalbar.setAttribute("customizable", "true");
                verticalbar.setAttribute("collapsed", `${UcfPrefs.v_collapsed}`);
                verticalbox.append(verticalbar);
                vcontainer.append(verticalbox);
                let sidebarbox = this.sidebarbox = document.querySelector("#sidebar-box");
                let browser = sidebarbox.parentElement, border;
                if (UcfPrefs.v_bar_start) {
                    if (!(border = browser.querySelector("#browser-border-start")))
                        browser.prepend(vcontainer);
                    else
                        border.after(vcontainer);
                    document.documentElement.setAttribute("v_vertical_bar_start", "true");
                } else {
                    if (!(border = browser.querySelector("#browser-border-end")))
                        browser.append(vcontainer);
                    else
                        border.before(vcontainer);
                    document.documentElement.setAttribute("v_vertical_bar_start", "false");
                }
                this.verticalbar = verticalbar;
                this.verticalbox = verticalbox;

                if (UcfPrefs.v_autohide) {
                    document.documentElement.setAttribute("v_vertical_bar_autohide", "true");
                    Services.obs.addObserver(this, "browser-delayed-startup-finished");
                }
                navtoolbox.addEventListener("beforecustomization", this);
                externalToolbars = true;
                toolbarcreate = true;
            } catch (e) {}
        }

        if (UcfPrefs.b_enable) {
            try {
                let bottombar = document.createXULElement("toolbar");
                bottombar.id = "ucf-additional-bottom-bar";
                bottombar.className = "toolbar-primary chromeclass-toolbar customization-target browser-toolbar";
                bottombar.setAttribute("toolboxid", "navigator-toolbox");
                bottombar.setAttribute("context", "toolbar-context-menu");
                bottombar.setAttribute("mode", "icons");
                bottombar.setAttribute("iconsize", "small");
                bottombar.setAttribute("customizable", "true");
                bottombar.setAttribute("collapsed", `${UcfPrefs.b_collapsed}`);
                let closebutton = document.createXULElement("toolbarbutton");
                l10n.then(attr => {
                    bottombar.setAttribute("toolbarname", attr[13].value);
                    closebutton.setAttribute("tooltiptext", attr[14].value);
                });
                closebutton.id = "ucf-additional-bottom-closebutton";
                closebutton.className = "close-icon closebutton";
                closebutton.setAttribute("removable", "false");
                closebutton.setAttribute("oncommand", "var bar = this.parentNode; setToolbarVisibility(bar, bar.collapsed);");
                bottombar.append(closebutton);
                let bottombox = document.querySelector("#browser-bottombox");
                if (!bottombox) {
                    bottombox = document.createXULElement("vbox");
                    bottombox.id = "browser-bottombox";
                    document.querySelector("#fullscreen-and-pointerlock-wrapper")?.after(bottombox);
                }
                bottombox.append(bottombar);
                this.bottombar = bottombar;
                externalToolbars = true;
                toolbarcreate = true;
            } catch (e) {}
        }
        if (toolbarcreate) {
            window.addEventListener("toolbarvisibilitychange", this);
            window.addEventListener("unload", () => {
                this.destructor();
            }, { once: true });
            (() => {
                var ViewToolbarCommand = window.onViewToolbarCommand;
                if (typeof ViewToolbarCommand != "function") return;
                var StringFn = `${ViewToolbarCommand}`,
                RegRep = /(BrowserUsageTelemetry\s*\.\s*recordToolbarVisibility\s*\(\s*toolbarId.+?\)\s*\;)/g;
                if (!RegRep.test(StringFn)) return;
                window.onViewToolbarCommand = eval(`(${StringFn.replace(/^(async\s)?.*?\(/, `$1function ${ViewToolbarCommand.name}(`)
                .replace(RegRep, `if (!/ucf-additional-.+?-bar/.test(toolbarId)) { $1 }`)})`);
            })();
        }
        if (!externalToolbars)
            return;
        (() => {
            var ViewToolbarsPopup = window.onViewToolbarsPopupShowing;
            if (typeof ViewToolbarsPopup != "function") return;
            var StringFn = `${ViewToolbarsPopup}`,
            RegRep = /toolbarNodes\s*=\s*gNavToolbox\s*\.\s*querySelectorAll\s*\(\s*\"\s*toolbar\s*\"\s*\)/g;
            if (!RegRep.test(StringFn)) return;
            window.onViewToolbarsPopupShowing = eval(`(${StringFn.replace(/^(async\s)?.*?\(/, `$1function ${ViewToolbarsPopup.name}(`)
            .replace(RegRep, 'toolbarNodes = Array.from(document.querySelectorAll("toolbar[toolbarname]"))')})`);
        })();
    },
    destructor() {
        window.removeEventListener("toolbarvisibilitychange", this);
        if (UcfPrefs.v_enable) {
            this.navtoolbox.removeEventListener("beforecustomization", this);
            if (UcfPrefs.v_autohide) {
                let verticalbox = this.verticalbox;
                verticalbox.removeEventListener("mouseenter", this);
                verticalbox.removeEventListener("mouseleave", this);
                verticalbox.removeEventListener("dragenter", this);
            }
        }
    },
    handleEvent(e) {
        this[e.type](e);
    },
    delayedstartup() {
        var panelcontainer = this.panelcontainer = gBrowser.tabpanels || gBrowser.mPanelContainer;
        if (!panelcontainer || !this.sidebarbox) return;
        var verticalbox = this.verticalbox;
        verticalbox.addEventListener("mouseenter", this);
        verticalbox.addEventListener("mouseleave", this);
        verticalbox.addEventListener("dragenter", this);
    },
    toolbarvisibilitychange(e) {
        switch (e.target) {
            case this.verticalbar:
                UcfPrefs.gbranch.setBoolPref("vertical_collapsed", UcfPrefs.v_collapsed = this.verticalbar.collapsed);
                break;
            case this.topbar:
                UcfPrefs.gbranch.setBoolPref("top_collapsed", UcfPrefs.t_collapsed = this.topbar.collapsed);
                break;
            case this.bottombar:
                UcfPrefs.gbranch.setBoolPref("bottom_collapsed", UcfPrefs.b_collapsed = this.bottombar.collapsed);
                break;
        }
    },
    beforecustomization() {
        this.verticalbar.removeAttribute("orient");
        this.navtoolbox.querySelector(":scope > toolbar:last-of-type").after(this.verticalbar);
        this.navtoolbox.addEventListener("aftercustomization", this);
    },
    aftercustomization() {
        this.verticalbar.setAttribute("orient", "vertical");
        this.verticalbox.append(this.verticalbar);
        this.navtoolbox.removeEventListener("aftercustomization", this);
    },
    mouseenter(e) {
        switch (e.currentTarget) {
            case this.verticalbox:
                if (!this._visible) {
                    this.isMouseSidebar = false;
                    this.showToolbar();
                }
                break;
            case this.verticalbar:
                this.isMouseOver = true;
                break;
            default:
                this.isMouseSidebar = e.currentTarget == this.sidebarbox;
                this.isMouseOver = false;
                this.hideToolbar();
                break;
        }
    },
    dragenter(e) {
        switch (e.currentTarget) {
            case this.verticalbox:
                if (!this._visible) {
                    this.isMouseSidebar = false;
                    this.showToolbar();
                }
                break;
            case this.panelcontainer:
                this.hideToolbar();
                break;
        }
    },
    mouseleave() {
        clearTimeout(this.showTimer);
    },
    popupshown(e) {
        if (e.target.localName != "tooltip" && e.target.localName != "window")
            this.isPopupOpen = true;
    },
    popuphidden(e) {
        if (e.target.localName != "tooltip" && e.target.localName != "window") {
            this.isPopupOpen = false;
            this.hideToolbar();
        }
    },
    showToolbar() {
        clearTimeout(this.showTimer);
        this.showTimer = setTimeout(() => {
            var docElm = document.documentElement;
            var verticalbox = this.verticalbox;
            docElm.style.setProperty("--v-vertical_bar_width", verticalbox.getBoundingClientRect().width + "px");
            verticalbox.setAttribute("v_vertical_bar_visible", "true");
            docElm.setAttribute("v_vertical_bar_visible", "true");
            this._visible = true;
            var panelcontainer = this.panelcontainer;
            panelcontainer.addEventListener("mouseenter", this);
            panelcontainer.addEventListener("dragenter", this);
            if (UcfPrefs.v_mouseenter_sidebar) {
                docElm.setAttribute("v_vertical_bar_sidebar", "true");
                this.sidebarbox.addEventListener("mouseenter", this);
            }
            var verticalbar = this.verticalbar;
            verticalbar.addEventListener("mouseenter", this);
            verticalbar.addEventListener("popupshown", this);
            verticalbar.addEventListener("popuphidden", this);
            var navtoolbox = this.navtoolbox;
            navtoolbox.addEventListener("popupshown", this);
            navtoolbox.addEventListener("popuphidden", this);
        }, UcfPrefs.v_showdelay);
    },
    hideToolbar() {
        clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => {
            if (this.isPopupOpen || this.isMouseOver) return;
            var panelcontainer = this.panelcontainer;
            panelcontainer.removeEventListener("mouseenter", this);
            panelcontainer.removeEventListener("dragenter", this);
            var docElm = document.documentElement;
            if (UcfPrefs.v_mouseenter_sidebar) {
                docElm.setAttribute("v_vertical_bar_sidebar", `${!this.isMouseSidebar}`);
                this.sidebarbox.removeEventListener("mouseenter", this);
            }
            var verticalbar = this.verticalbar;
            verticalbar.removeEventListener("mouseenter", this);
            verticalbar.removeEventListener("popupshown", this);
            verticalbar.removeEventListener("popuphidden", this);
            var navtoolbox = this.navtoolbox;
            navtoolbox.removeEventListener("popupshown", this);
            navtoolbox.removeEventListener("popuphidden", this);
            docElm.removeAttribute("v_vertical_bar_visible");
            this.verticalbox.removeAttribute("v_vertical_bar_visible");
            docElm.style.setProperty("--v-vertical_bar_width", "0px");
            this._visible = false;
        }, UcfPrefs.v_hidedelay);
    }
};
vertical_top_bottom_bar.init();
