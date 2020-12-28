// Не редактировать!
var vertical_top_bottom_bar = {
    get Prefs() {
        delete this.Prefs;
        return this.Prefs = Services.prefs.getBranch("extensions.user_chrome_files.");
    },
    navtoolbox: null,
    verticalbox: null,
    verticalbar: null,
    sidebarbox: null,
    topbar: null,
    bottombar: null,
    timer: null,
    timerImg: null,
    observerthemeenable: false,
    panelcontainer: null,
    showTimer: null,
    hideTimer: null,
    _visible: false,
    isPopupOpen: false,
    isMouseOver: false,
    isMouseSidebar: false,
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
    observe(aSubject, aTopic, aData) {
        ({
            "lightweight-theme-styling-update": () => {
                this._setImagebar();
            },
            "browser-delayed-startup-finished": () => {
                try {
                    Services.obs.removeObserver(this, "browser-delayed-startup-finished");
                } catch(e) {}
                this.delayedstartup();
            },
        })[aTopic]();
    },
    init() {
        var navtoolbox = this.navtoolbox = (window.gNavToolbox || document.querySelector("#navigator-toolbox"));
        if (!navtoolbox) return;
        var options = this.options, knsxul = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", toolbarcreate = false;
        if (options.t_enable) {
            let topbar = document.createElementNS(knsxul, "toolbar");
            topbar.id = "add-additional-top-bar";
            topbar.className = "toolbar-primary chromeclass-toolbar customization-target browser-toolbar";
            topbar.setAttribute("toolbarname", "Дополнительная панель");
            topbar.setAttribute("context", "toolbar-context-menu");
            topbar.setAttribute("mode", "icons");
            topbar.setAttribute("iconsize", "small");
            topbar.setAttribute("fullscreentoolbar", "true");
            topbar.setAttribute("customizable", "true");
            topbar.setAttribute("collapsed", options.t_collapsed);
            if (options.t_next_navbar)
                navtoolbox.querySelector("#nav-bar").after(topbar);
            else
                navtoolbox.append(topbar);
            this.topbar = topbar;
            toolbarcreate = true;
        }

        var externalToolbars = false;
        if (options.v_enable) {
            let vcontainer = document.createElementNS(knsxul, "vbox");
            vcontainer.id = "add-additional-vertical-container";
            vcontainer.setAttribute("vertautohide", options.v_autohide);
            vcontainer.setAttribute("v_vertical_bar_start", options.v_bar_start);
            vcontainer.setAttribute("hidden", "true");
            let verticalbox = document.createElementNS(knsxul, "vbox");
            verticalbox.id = "add-additional-vertical-box";
            verticalbox.setAttribute("vertautohide", options.v_autohide);
            verticalbox.setAttribute("v_vertical_bar_start", options.v_bar_start);
            verticalbox.setAttribute("flex", "1");
            let verticalbar = document.createElementNS(knsxul, "toolbar");
            verticalbar.id = "add-additional-vertical-bar";
            verticalbar.className = "toolbar-primary chromeclass-toolbar customization-target browser-toolbar";
            verticalbar.setAttribute("toolbarname", "Вертикальная панель");
            verticalbar.setAttribute("toolboxid", "navigator-toolbox");
            verticalbar.setAttribute("context", "toolbar-context-menu");
            verticalbar.setAttribute("mode", "icons");
            verticalbar.setAttribute("iconsize", "small");
            verticalbar.setAttribute("orient", "vertical");
            verticalbar.setAttribute("flex", "1");
            verticalbar.setAttribute("fullscreentoolbar", options.v_fullscreen);
            verticalbar.setAttribute("customizable", "true");
            verticalbar.setAttribute("collapsed", options.v_collapsed);
            verticalbox.append(verticalbar);
            vcontainer.append(verticalbox);
            if (options.v_bar_start)
                document.querySelector("#browser-border-start").after(vcontainer);
            else
                document.querySelector("#browser-border-end").before(vcontainer);
            this.verticalbar = verticalbar;
            this.verticalbox = verticalbox;
            document.documentElement.setAttribute("v_vertical_bar_start", options.v_bar_start);

            if (options.v_autohide) {
                document.documentElement.setAttribute("v_vertical_bar_autohide", "true");
                try {
                    Services.obs.addObserver(this, "browser-delayed-startup-finished", false);
                } catch(e) {}
            }
            navtoolbox.addEventListener("beforecustomization", this);
            externalToolbars = true;
            toolbarcreate = true;
        }

        if (options.b_enable) {
            let bottombar = document.createElementNS(knsxul, "toolbar");
            bottombar.id = "add-additional-bottom-bar";
            bottombar.className = "toolbar-primary chromeclass-toolbar customization-target browser-toolbar";
            bottombar.setAttribute("toolbarname", "Нижняя панель");
            bottombar.setAttribute("toolboxid", "navigator-toolbox");
            bottombar.setAttribute("context", "toolbar-context-menu");
            bottombar.setAttribute("mode", "icons");
            bottombar.setAttribute("iconsize", "small");
            bottombar.setAttribute("customizable", "true");
            bottombar.setAttribute("collapsed", options.b_collapsed);
            let closebutton = document.createElementNS(knsxul, "toolbarbutton");
            closebutton.id = "add-additional-bottom-closebutton";
            closebutton.className = "close-icon closebutton";
            closebutton.setAttribute("tooltiptext", "Скрыть панель");
            closebutton.setAttribute("removable", "false");
            closebutton.setAttribute("oncommand", "var bar = this.parentNode; setToolbarVisibility(bar, bar.collapsed);");
            bottombar.append(closebutton);
            document.querySelector("#browser-bottombox").append(bottombar);
            this.bottombar = bottombar;
            externalToolbars = true;
            toolbarcreate = true;
        }
        if (toolbarcreate) {
            window.addEventListener("toolbarvisibilitychange", this);
            window.addEventListener("unload", () => {
                this.destructor();
            }, { once: true });
        }
        if (!externalToolbars)
            return;
        if ("_lightweightTheme" in document.documentElement) {
            try {
                Services.obs.addObserver(this, "lightweight-theme-styling-update", false);
                this.observerthemeenable = true;
                this.setImagebar();
            } catch(e) {}
        }
        setTimeout(() => {
            var ViewToolbarsPopup = window.onViewToolbarsPopupShowing;
            if (typeof ViewToolbarsPopup != "function") return;
            var StringFn = `${ViewToolbarsPopup}`,
            RegRep = /toolbarNodes\s*=\s*(?:gNavToolbox\s*\.\s*(?:querySelectorAll\s*\(\s*(?:\"|\')\s*toolbar\s*(?:\"|\')\s*\)|childNodes|children)|getTogglableToolbars\s*\(\s*\))/g;
            if (!RegRep.test(StringFn)) return;
            window.onViewToolbarsPopupShowing = eval(`(${StringFn.replace(/^(async\s)?.*?onViewToolbarsPopupShowing/, "$1function onViewToolbarsPopupShowing")
                .replace(RegRep, 'toolbarNodes = Array.from(document.querySelectorAll("toolbar[toolbarname]"))')})`);
        }, 200);
    },
    destructor() {
        window.removeEventListener("toolbarvisibilitychange", this);
        var options = this.options;
        if (options.v_enable) {
            this.navtoolbox.removeEventListener("beforecustomization", this);
            if (options.v_autohide) {
                let verticalbox = this.verticalbox;
                verticalbox.removeEventListener("mouseenter", this);
                verticalbox.removeEventListener("mouseleave", this);
                verticalbox.removeEventListener("dragenter", this);
            }
        }
        if (this.observerthemeenable) {
            try {
                Services.obs.removeObserver(this, "lightweight-theme-styling-update");
            } catch(e) {}
        }
    },
    handleEvent(e) {
        this[e.type](e);
    },
    delayedstartup() {
        var panelcontainer = this.panelcontainer = gBrowser.tabpanels || gBrowser.mPanelContainer;
        var sidebarbox = this.sidebarbox = document.querySelector("#sidebar-box");
        if (!panelcontainer || !sidebarbox) return;
        var verticalbox = this.verticalbox;
        verticalbox.addEventListener("mouseenter", this);
        verticalbox.addEventListener("mouseleave", this);
        verticalbox.addEventListener("dragenter", this);
    },
    toolbarvisibilitychange(e) {
        if (e.target == this.verticalbar) {
            try {
                this.Prefs.setBoolPref("vertical_collapsed", this.verticalbar.collapsed);
            } catch(e) {}
        } else if (e.target == this.topbar) {
            try {
                this.Prefs.setBoolPref("top_collapsed", this.topbar.collapsed);
            } catch(e) {}
        } else if (e.target == this.bottombar) {
            try {
                this.Prefs.setBoolPref("bottom_collapsed", this.bottombar.collapsed);
            } catch(e) {}
        }
    },
    beforecustomization() {
        var toolbar = this.verticalbar;
        toolbar.removeAttribute("orient");
        this.navtoolbox.append(toolbar);
        this.verticalbar = document.querySelector("#add-additional-vertical-bar");
        this.navtoolbox.addEventListener("aftercustomization", this);
    },
    aftercustomization() {
        var toolbar = this.verticalbar;
        toolbar.setAttribute("orient", "vertical");
        this.verticalbox.append(toolbar);
        this.verticalbar = document.querySelector("#add-additional-vertical-bar");
        this.navtoolbox.removeEventListener("aftercustomization", this);
        this.setImagebar();
    },
    _setImagebar() {
        clearTimeout(this.timerImg);
        this.timerImg = setTimeout(() => {
            this.setImagebar();
        }, 500);
    },
    setImagebar() {
        if (!this.observerthemeenable) return;
        var docElm = document.documentElement;
        docElm.style.setProperty("--v-lwt-header-image", getComputedStyle(docElm).getPropertyValue("background-image"));
    },
    mouseenter(e) {
        if (e.currentTarget == this.verticalbox) {
            if (!this._visible) {
                this.isMouseSidebar = false;
                this.showToolbar();
            }
        } else if (e.currentTarget == this.verticalbar)
            this.isMouseOver = true;
        else {
            this.isMouseSidebar = e.currentTarget == this.sidebarbox;
            this.isMouseOver = false;
            this.hideToolbar();
        }
    },
    dragenter(e) {
        if (e.currentTarget == this.verticalbox) {
            if (!this._visible) {
                this.isMouseSidebar = false;
                this.showToolbar();
            }
        } else if (e.currentTarget == this.panelcontainer)
            this.hideToolbar();
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
            if (this.options.v_mouseenter_sidebar) {
                docElm.setAttribute("v_vertical_bar_sidebar", "false");
                this.sidebarbox.addEventListener("mouseenter", this);
            }
            var verticalbar = this.verticalbar;
            verticalbar.addEventListener("mouseenter", this);
            verticalbar.addEventListener("popupshown", this);
            verticalbar.addEventListener("popuphidden", this);
            var navtoolbox = this.navtoolbox;
            navtoolbox.addEventListener("popupshown", this);
            navtoolbox.addEventListener("popuphidden", this);
        }, this.options.v_showdelay);
    },
    hideToolbar() {
        clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => {
            if (this.isPopupOpen || this.isMouseOver) return;
            var panelcontainer = this.panelcontainer;
            panelcontainer.removeEventListener("mouseenter", this);
            panelcontainer.removeEventListener("dragenter", this);
            var docElm = document.documentElement;
            if (this.options.v_mouseenter_sidebar) {
                docElm.setAttribute("v_vertical_bar_sidebar", `${this.isMouseSidebar}`);
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
        }, this.options.v_hidedelay);
    }
};
