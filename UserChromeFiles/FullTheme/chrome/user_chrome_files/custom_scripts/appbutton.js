/**
@UCF @param {"prop":"JsChrome.DOMContentLoaded","ucfobj":true} @UCF
*/
(async (
    id = Symbol("appbutton"),
    SHOWDELAY = 300,
    HIDEDELAY = 2000,
) => (this[id] = {
    _visible: false,
    isMouseOver: false,
    showTimer: null,
    hideTimer: null,
    eventListeners: new Map(),
    init() {
        var menubar = this.menubar = document.querySelector("#toolbar-menubar > #menubar-items > #main-menubar");
        if (!menubar) return;
        var origitems = menubar.parentElement;
        var tool_menubar = this.tool_menubar = origitems.parentElement;
        var items = this.items = document.createElementNS("http://www.w3.org/1999/xhtml", "html:div");
        origitems.before(items);
        items.append(menubar);
        origitems.remove();
        items.id = "menubar-items";
        var popover = document.querySelector("div#urlbar[popover]");
        if (popover) this.addListener("urlbar_toggle", popover, "toggle", this);
        else this.toggle({newState: "open"});
        this.addListener("items_mouseenter", items, "mouseenter", this);
        this.addListener("items_mouseleave", items, "mouseleave", this);
        this.addListener("items_dragenter", items, "dragenter", this);
        this.addListener("items_mouseup", items, "mouseup", this);
        this.autohidechange = new MutationObserver(() => this.toggle({newState: "open"}));
        this.autohidechange.observe(tool_menubar, {
            attributeFilter: ["autohide"],
            attributes: true,
        });
        setUnloadMap(id, this.destructor, this);
    },
    toggle(e, {items} = this) {
        items.removeAttribute("popover");
        if (e.newState === "open" && this.tool_menubar.getAttribute("autohide") === "true") {
            items.setAttribute("popover", "manual");
            items.showPopover();
        }
    },
    handleEvent(e) {
        this[e.type](e);
    },
    mouseenter({currentTarget, target}) {
        switch (currentTarget) {
            case this.items:
                if (currentTarget != target) return;
                this.isMouseOver = true;
                if (!this._visible)
                    this.showToolbar();
                break;
            default:
                this.isMouseOver = false;
                this.hideToolbar();
                break;
        }
    },
    mouseleave() {
        clearTimeout(this.showTimer);
    },
    dragenter({target}) {
        switch (target) {
            case this.items:
                if (!this._visible)
                    this.showToolbar();
                break;
        }
    },
    showToolbar(nodelay) {
        clearTimeout(this.showTimer);
        var onTimeout = () => {
            this._visible = true;
            this.items.setAttribute("menubar_visible", "true");
            var tabpanels = this.tabpanels ||= gBrowser.tabpanels;
            this.addListener("tabpanels_mouseenter", tabpanels, "mouseenter", this);
            this.addListener("tabpanels_mouseup", tabpanels, "mouseup", this);
        };
        if (!nodelay) this.showTimer = setTimeout(onTimeout, SHOWDELAY);
        else onTimeout();
    },
    hideToolbar(nodelay) {
        clearTimeout(this.hideTimer);
        var onTimeout = () => {
            if (this.isMouseOver) return;
            this.delListener("tabpanels_mouseenter");
            this.delListener("tabpanels_mouseup");
            this.items.setAttribute("menubar_visible", "false");
            this._visible = false;
        };
        if (!nodelay) this.hideTimer = setTimeout(onTimeout, HIDEDELAY);
        else onTimeout();
    },
    mouseup({currentTarget, target, detail}) {
        switch (currentTarget) {
            case this.items:
                if (currentTarget != target || !detail) return;
                if (!this._visible)
                    this.showToolbar(true);
                else {
                    this.isMouseOver = false;
                    this.hideToolbar(true);
                }
                break;
            default:
                this.hideToolbar(true);
                break;
        }
    },
    delListener(key) {
        var {eventListeners} = this, getkey = eventListeners.get(key);
        if (!getkey) return;
        var {elm, type, listener} = getkey;
        elm.removeEventListener(type, listener);
        eventListeners.delete(key);
    },
    addListener(key, elm, type, listener) {
        elm.addEventListener(type, listener);
        this.eventListeners.set(key, {elm, type, listener});
    },
    destructor() {
        this.eventListeners.forEach(({elm, type, listener}) => {
            elm.removeEventListener(type, listener);
        });
        this.autohidechange.disconnect();
    },
}).init())();
