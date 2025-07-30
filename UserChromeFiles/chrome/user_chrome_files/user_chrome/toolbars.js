var ucf_toolbars_win = {
    navtoolbox: null,
    verticalbox: null,
    verticalbar: null,
    topbox: null,
    topbar: null,
    bottombar: null,
    externalToolbars: [],
    eventListeners: new Map(),
    init() {
        var navtoolbox = this.navtoolbox = window.gNavToolbox || document.querySelector("#navigator-toolbox");
        if (!navtoolbox) return;
        var {prefs} = UcfPrefs, toolbarcreate = false, t_autohide = false, v_autohide = false;
        var l10nFile = "toolbars.ftl", l10nKeys = [
            "ucf-additional-top-bar",
            "ucf-additional-vertical-bar",
            "ucf-additional-bottom-bar",
            "ucf-additional-bottom-closebutton",
        ];
        if (prefs.t_enable) {
            try {
                let topbar = document.createXULElement("toolbar");
                UcfPrefs.formatMessages(l10nFile, l10nKeys).then(attr => {
                    topbar.setAttribute("toolbarname", attr[0].value);
                });
                topbar.id = "ucf-additional-top-bar";
                topbar.className = "toolbar-primary chromeclass-toolbar customization-target browser-toolbar";
                topbar.setAttribute("context", "toolbar-context-menu");
                topbar.setAttribute("mode", "icons");
                topbar.setAttribute("accesskey", "");
                topbar.setAttribute("key", "");
                topbar.setAttribute("iconsize", "small");
                topbar.setAttribute("fullscreentoolbar", "true");
                topbar.setAttribute("customizable", "true");
                if (prefs.t_collapsed) topbar.collapsed = true;
                let sel = prefs.t_next_navbar ? "#nav-bar" : ":scope > :nth-last-child(1 of toolbar:not(#notifications-toolbar))";
                if (prefs.t_autohide) {
                    let tcontainer = document.createXULElement("vbox");
                    tcontainer.id = "ucf-additional-top-container";
                    tcontainer.setAttribute("topautohide", "true");
                    let topbox = document.createXULElement("vbox");
                    topbox.id = "ucf-additional-top-box";
                    topbox.setAttribute("topautohide", "true");
                    topbox.append(topbar);
                    tcontainer.append(topbox);
                    navtoolbox.querySelector(sel).after(tcontainer);
                    this.topbox = topbox;
                    this.topbar = topbar;
                    document.documentElement.setAttribute("v_top_bar_autohide", "true");
                    t_autohide = true;
                } else {
                    navtoolbox.querySelector(sel).after(topbar);
                    this.topbar = topbar;
                }
                toolbarcreate = true;
            } catch {}
        }
        var externalToolbars = false;
        if (prefs.v_enable) {
            try {
                let vcontainer = document.createXULElement("vbox");
                vcontainer.id = "ucf-additional-vertical-container";
                vcontainer.setAttribute("vertautohide", `${prefs.v_autohide}`);
                vcontainer.setAttribute("v_vertical_bar_start", `${prefs.v_bar_start}`);
                vcontainer.hidden = true;
                let verticalbox = document.createXULElement("vbox");
                verticalbox.id = "ucf-additional-vertical-box";
                verticalbox.setAttribute("vertautohide", `${prefs.v_autohide}`);
                verticalbox.setAttribute("v_vertical_bar_start", `${prefs.v_bar_start}`);
                verticalbox.setAttribute("flex", "1");
                let verticalbar = document.createXULElement("toolbar");
                UcfPrefs.formatMessages(l10nFile, l10nKeys).then(attr => {
                    verticalbar.setAttribute("toolbarname", attr[1].value);
                });
                verticalbar.id = "ucf-additional-vertical-bar";
                verticalbar.className = "toolbar-primary chromeclass-toolbar customization-target browser-toolbar";
                verticalbar.setAttribute("toolboxid", "navigator-toolbox");
                verticalbar.setAttribute("context", "toolbar-context-menu");
                verticalbar.setAttribute("mode", "icons");
                verticalbar.setAttribute("iconsize", "small");
                verticalbar.setAttribute("accesskey", "");
                verticalbar.setAttribute("key", "");
                verticalbar.setAttribute("orient", "vertical");
                verticalbar.setAttribute("fullscreentoolbar", `${prefs.v_fullscreen}`);
                verticalbar.setAttribute("customizable", "true");
                if (prefs.v_collapsed) verticalbar.collapsed = true;
                verticalbox.append(verticalbar);
                vcontainer.append(verticalbox);
                let browser = document.querySelector("hbox#browser");
                if (prefs.v_bar_start) {
                    browser.prepend(vcontainer);
                    document.documentElement.setAttribute("v_vertical_bar_start", "true");
                } else {
                    browser.append(vcontainer);
                    document.documentElement.setAttribute("v_vertical_bar_start", "false");
                }
                this.verticalbar = verticalbar;
                this.verticalbox = verticalbox;
                if (prefs.v_autohide) {
                    document.documentElement.setAttribute("v_vertical_bar_autohide", "true");
                    v_autohide = true;
                }
                this.addListener("navtoolbox_beforecustomization", navtoolbox, "beforecustomization", this);
                this.externalToolbars.push(verticalbar);
                externalToolbars = true;
                toolbarcreate = true;
            } catch {}
        }
        if (prefs.b_enable) {
            try {
                let bottombar = document.createXULElement("toolbar");
                bottombar.id = "ucf-additional-bottom-bar";
                bottombar.className = "toolbar-primary chromeclass-toolbar customization-target browser-toolbar";
                bottombar.setAttribute("toolboxid", "navigator-toolbox");
                bottombar.setAttribute("context", "toolbar-context-menu");
                bottombar.setAttribute("mode", "icons");
                bottombar.setAttribute("iconsize", "small");
                bottombar.setAttribute("accesskey", "");
                bottombar.setAttribute("key", "");
                bottombar.setAttribute("customizable", "true");
                if (prefs.b_collapsed) bottombar.collapsed = true;
                let closebutton = document.createXULElement("toolbarbutton");
                UcfPrefs.formatMessages(l10nFile, l10nKeys).then(attr => {
                    bottombar.setAttribute("toolbarname", attr[2].value);
                    closebutton.setAttribute("tooltiptext", attr[3].value);
                });
                closebutton.id = "ucf-additional-bottom-closebutton";
                closebutton.className = "close-icon closebutton";
                closebutton.setAttribute("removable", "false");
                this.addListener("closebutton_command", closebutton, "command", e => {
                    var bar = e.target.parentNode;
                    setToolbarVisibility(bar, bar.collapsed);
                });
                bottombar.append(closebutton);
                let bottombox = document.querySelector("#browser-bottombox");
                if (!bottombox) {
                    bottombox = document.createXULElement("vbox");
                    bottombox.id = "browser-bottombox";
                    document.body.append(bottombox);
                }
                bottombox.append(bottombar);
                this.bottombar = bottombar;
                this.externalToolbars.push(bottombar);
                externalToolbars = true;
                toolbarcreate = true;
            } catch {}
        }
        if (toolbarcreate) {
            this.addListener("window_toolbarvisibilitychange", window, "toolbarvisibilitychange", this);
            window.addEventListener("unload", () => this.destructor(), { once: true });
            UcfPrefs.viewToolbars(window, externalToolbars).then(script => script.executeInGlobal(window));
            delayedStartupPromise.then(() => {
                if (t_autohide) this.top_autohide.init();
                if (v_autohide) this.vert_autohide.init();
                if (!externalToolbars) return;
                for (let {type, listenerObject: listener, capturing} of Services.els.getListenerInfoFor(navtoolbox)) {
                    if (typeof listener === "function" && Cu.getFunctionSourceLocation(listener)
                        .filename === "chrome://browser/content/navigator-toolbox.js")
                        for (let elm of this.externalToolbars)
                            this.addListener(Symbol(), elm, type, listener, capturing);
                }
            });
        }
    },
    addListener(key, elm, type, listener, capturing = false) {
        elm.addEventListener(type, listener, capturing);
        this.eventListeners.set(key, {elm, type, listener, capturing});
    },
    delListener(key) {
        var {eventListeners} = this, getkey = eventListeners.get(key);
        if (!getkey) return;
        var {elm, type, listener, capturing} = getkey;
        elm.removeEventListener(type, listener, capturing);
        eventListeners.delete(key);
    },
    destructor() {
        var {prefs} = UcfPrefs;
        if (prefs.t_enable && prefs.t_autohide) this.top_autohide.destructor();
        if (prefs.v_enable && prefs.v_autohide) this.vert_autohide.destructor();
        this.eventListeners.forEach(({elm, type, listener, capturing}) => elm.removeEventListener(type, listener, capturing));
    },
    handleEvent(e) {
        this[e.type](e);
    },
    toolbarvisibilitychange(e) {
        switch (e.target) {
            case this.verticalbar:
                UcfPrefs.setPrefs("v_collapsed", this.verticalbar.collapsed);
                break;
            case this.topbar:
                UcfPrefs.setPrefs("t_collapsed", this.topbar.collapsed);
                break;
            case this.bottombar:
                UcfPrefs.setPrefs("b_collapsed", this.bottombar.collapsed);
                break;
        }
    },
    beforecustomization() {
        this.verticalbar.removeAttribute("orient");
        var {navtoolbox} = this;
        navtoolbox.querySelector(":scope > toolbar:last-of-type").after(this.verticalbar);
        this.addListener("navtoolbox_aftercustomization", navtoolbox, "aftercustomization", this);
    },
    aftercustomization() {
        var {verticalbar} = this;
        verticalbar.setAttribute("orient", "vertical");
        this.verticalbox.append(verticalbar);
        this.delListener("navtoolbox_aftercustomization");
    },
    top_autohide: {
        _visible: false,
        isMouseOver: false,
        isPopupOpen: false,
        showTimer: null,
        hideTimer: null,
        tabpanels: null,
        init() {
            var tabpanels = this.tabpanels = gBrowser.tabpanels;
            if (!tabpanels) return;
            this.eventListeners = new Map();
            var hoverbox = this.hoverbox = document.querySelector(UcfPrefs.prefs.t_hoversel) || document.querySelector("#nav-bar");
            var {navtoolbox, topbar} = ucf_toolbars_win;
            this.addListener("hoverbox_mouseenter", hoverbox, "mouseenter", this);
            this.addListener("hoverbox_mouseleave", hoverbox, "mouseleave", this);
            this.addListener("hoverbox_dragenter", hoverbox, "dragenter", this);
            this.addListener("navtoolbox_popupshown", navtoolbox, "popupshown", this);
            this.addListener("navtoolbox_popuphidden", navtoolbox, "popuphidden", this);
            setTimeout(() => {
                document.documentElement.style.setProperty("--v-top-bar-height", `${topbar.getBoundingClientRect().height}px`);
            }, 0);
        },
        handleEvent(e) {
            this[e.type](e);
        },
        addListener(key, elm, type, listener) {
            elm.addEventListener(type, listener);
            this.eventListeners.set(key, {elm, type, listener});
        },
        delListener(key) {
            var {eventListeners} = this, getkey = eventListeners.get(key);
            if (!getkey) return;
            var {elm, type, listener} = getkey;
            elm.removeEventListener(type, listener);
            eventListeners.delete(key);
        },
        destructor() {
            this.eventListeners.forEach(({elm, type, listener}) => {
                elm.removeEventListener(type, listener);
            });
        },
        popupshown(e) {
            if (e.target.localName !== "tooltip") return;
            this.isPopupOpen = true;
        },
        popuphidden(e) {
            if (e.target.localName !== "tooltip") return;
            this.isPopupOpen = false;
            this.hideToolbar();
        },
        mouseenter(e) {
            switch (e.currentTarget) {
                case this.hoverbox:
                    this.isMouseOver = true;
                    if (!this._visible && !this.isPopupOpen) this.showToolbar();
                    break;
                case ucf_toolbars_win.topbar:
                    this.isMouseOver = true;
                    break;
                default:
                    this.isMouseOver = false;
                    this.hideToolbar();
                    break;
            }
        },
        dragenter(e) {
            switch (e.currentTarget) {
                case this.hoverbox:
                    if (!this._visible) this.showToolbar();
                    break;
                default:
                    this.hideToolbar(true);
                    break;
            }
        },
        mouseleave() {
            clearTimeout(this.showTimer);
        },
        mouseup(e) {
            if (e.button) return;
            this.hideToolbar(true);
        },
        showToolbar() {
            clearTimeout(this.showTimer);
            this.showTimer = setTimeout(() => {
                this._visible = true;
                var docElm = document.documentElement;
                var {tabpanels} = this;
                var {topbar, topbox, navtoolbox} = ucf_toolbars_win;
                var tbrect = topbar.getBoundingClientRect();
                var height = tbrect.height;
                var overlaps = tbrect.bottom + height - navtoolbox.getBoundingClientRect().bottom;
                topbox.setAttribute("v_top_bar_visible", "true");
                docElm.setAttribute("v_top_bar_visible", "true");
                if (overlaps > 0) {
                    docElm.style.setProperty("--v-top-bar-overlaps", `${overlaps}px`);
                    docElm.setAttribute("v_top_bar_overlaps", "true");
                }
                docElm.style.setProperty("--v-top-bar-height", `${height}px`);
                this.addListener("tabpanels_mouseenter", tabpanels, "mouseenter", this);
                this.addListener("tabpanels_dragenter", tabpanels, "dragenter", this);
                this.addListener("tabpanels_mouseup", tabpanels, "mouseup", this);
                this.addListener("topbar_mouseenter", topbar, "mouseenter", this);
                this.addListener("topbar_popupshown", topbar, "popupshown", this);
                this.addListener("topbar_popuphidden", topbar, "popuphidden", this);
            }, UcfPrefs.prefs.t_showdelay);
        },
        hideToolbar(nodelay) {
            clearTimeout(this.hideTimer);
            var onTimeout = () => {
                if (this.isPopupOpen || this.isMouseOver) return;
                var docElm = document.documentElement;
                var {topbox} = ucf_toolbars_win;
                this.delListener("tabpanels_mouseenter");
                this.delListener("tabpanels_dragenter");
                this.delListener("tabpanels_mouseup");
                this.delListener("topbar_mouseenter");
                this.delListener("topbar_popupshown");
                this.delListener("topbar_popuphidden");
                topbox.setAttribute("v_top_bar_visible", "false");
                docElm.setAttribute("v_top_bar_visible", "false");
                docElm.setAttribute("v_top_bar_overlaps", "false");
                docElm.style.setProperty("--v-top-bar-overlaps", `${0}px`);
                this._visible = false;
            };
            if (!nodelay) this.hideTimer = setTimeout(onTimeout, UcfPrefs.prefs.t_hidedelay);
            else onTimeout();
        },
    },
    vert_autohide: {
        _visible: false,
        isMouseSidebar: false,
        isMouseOver: false,
        isPopupOpen: false,
        showTimer: null,
        hideTimer: null,
        tabpanels: null,
        init() {
            var tabpanels = this.tabpanels = gBrowser.tabpanels;
            var sidebarbox = this.sidebarbox = document.querySelector("#sidebar-box");
            this.sidebar_tabs = document.querySelector("#st_toolbox");
            if (!tabpanels || !sidebarbox) return;
            this.eventListeners = new Map();
            var {verticalbox, verticalbar} = ucf_toolbars_win;
            this.addListener("verticalbox_mouseenter", verticalbox, "mouseenter", this);
            this.addListener("verticalbox_mouseleave", verticalbox, "mouseleave", this);
            this.addListener("verticalbox_dragenter", verticalbox, "dragenter", this);
            setTimeout(() => {
                document.documentElement.style.setProperty("--v-vertical-bar-width", `${verticalbar.getBoundingClientRect().width}px`);
            }, 0);
        },
        handleEvent(e) {
            this[e.type](e);
        },
        addListener(key, elm, type, listener) {
            elm.addEventListener(type, listener);
            this.eventListeners.set(key, {elm, type, listener});
        },
        delListener(key) {
            var {eventListeners} = this, getkey = eventListeners.get(key);
            if (!getkey) return;
            var {elm, type, listener} = getkey;
            elm.removeEventListener(type, listener);
            eventListeners.delete(key);
        },
        destructor() {
            this.eventListeners.forEach(({elm, type, listener}) => {
                elm.removeEventListener(type, listener);
            });
        },
        popupshown(e) {
            if (e.target.localName !== "tooltip") return;
            this.isPopupOpen = true;
        },
        popuphidden(e) {
            if (e.target.localName !== "tooltip") return;
            this.isPopupOpen = false;
            this.hideToolbar();
        },
        mouseenter(e) {
            switch (e.currentTarget) {
                case ucf_toolbars_win.verticalbox:
                    this.isMouseOver = true;
                    this.isMouseSidebar = false;
                    if (!this._visible) this.showToolbar();
                    break;
                case ucf_toolbars_win.verticalbar:
                    this.isMouseOver = true;
                    this.isMouseSidebar = false;
                    break;
                case this.sidebarbox:
                case this.sidebar_tabs:
                    this.isMouseOver = false;
                    this.isMouseSidebar = true;
                    this.hideToolbar();
                    break;
                default:
                    this.isMouseOver = this.isMouseSidebar = false;
                    this.hideToolbar();
                    break;
            }
        },
        dragenter(e) {
            switch (e.currentTarget) {
                case ucf_toolbars_win.verticalbox:
                    this.isMouseSidebar = false;
                    if (!this._visible) this.showToolbar();
                    break;
                default:
                    this.isMouseSidebar = false;
                    this.hideToolbar(true);
                    break;
            }
        },
        mouseleave() {
            clearTimeout(this.showTimer);
        },
        mouseup(e) {
            if (e.button) return;
            this.hideToolbar(true);
        },
        showToolbar() {
            clearTimeout(this.showTimer);
            this.showTimer = setTimeout(() => {
                this._visible = true;
                var docElm = document.documentElement;
                var {tabpanels, sidebarbox, sidebar_tabs} = this;
                var {verticalbar, navtoolbox, verticalbox} = ucf_toolbars_win;
                verticalbox.setAttribute("v_vertical_bar_visible", "visible");
                docElm.setAttribute("v_vertical_bar_visible", "visible");
                docElm.style.setProperty("--v-vertical-bar-width", `${verticalbar.getBoundingClientRect().width}px`);
                docElm.setAttribute("v_vertical_bar_sidebar", `${this.isMouseSidebar}`);
                if (UcfPrefs.prefs.v_mouseenter_sidebar) {
                    this.addListener("sidebarbox_mouseenter", sidebarbox, "mouseenter", this);
                    if (sidebar_tabs) this.addListener("sidebar_tabs_mouseenter", sidebar_tabs, "mouseenter", this);
                }
                this.addListener("tabpanels_mouseenter", tabpanels, "mouseenter", this);
                this.addListener("tabpanels_dragenter", tabpanels, "dragenter", this);
                this.addListener("tabpanels_mouseup", tabpanels, "mouseup", this);
                this.addListener("verticalbar_mouseenter", verticalbar, "mouseenter", this);
                this.addListener("verticalbar_popupshown", verticalbar, "popupshown", this);
                this.addListener("verticalbar_popuphidden", verticalbar, "popuphidden", this);
                this.addListener("navtoolbox_popupshown", navtoolbox, "popupshown", this);
                this.addListener("navtoolbox_popuphidden", navtoolbox, "popuphidden", this);
            }, UcfPrefs.prefs.v_showdelay);
        },
        hideToolbar(nodelay) {
            clearTimeout(this.hideTimer);
            var docElm = document.documentElement;
            var {verticalbox} = ucf_toolbars_win;
            verticalbox.setAttribute("v_vertical_bar_visible", "visible_hidden");
            docElm.setAttribute("v_vertical_bar_visible", "visible_hidden");
            docElm.setAttribute("v_vertical_bar_sidebar", `${this.isMouseSidebar}`);
            var onTimeout = () => {
                if (this.isPopupOpen || this.isMouseOver) return;
                this.delListener("tabpanels_mouseenter");
                this.delListener("tabpanels_dragenter");
                this.delListener("tabpanels_mouseup");
                this.delListener("verticalbar_mouseenter");
                this.delListener("verticalbar_popupshown");
                this.delListener("verticalbar_popuphidden");
                this.delListener("navtoolbox_popupshown");
                this.delListener("navtoolbox_popuphidden");
                verticalbox.setAttribute("v_vertical_bar_visible", "hidden");
                docElm.setAttribute("v_vertical_bar_visible", "hidden");
                docElm.setAttribute("v_vertical_bar_sidebar", "false");
                if (UcfPrefs.prefs.v_mouseenter_sidebar) {
                    this.delListener("sidebarbox_mouseenter");
                    this.delListener("sidebar_tabs_mouseenter");
                }
                this._visible = false;
            };
            if (!nodelay) this.hideTimer = setTimeout(onTimeout, UcfPrefs.prefs.v_hidedelay);
            else onTimeout();
        },
    },
};
ucf_toolbars_win.init();
