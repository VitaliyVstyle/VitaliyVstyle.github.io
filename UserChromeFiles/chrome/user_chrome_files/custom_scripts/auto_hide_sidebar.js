(this.autohidesidebar = {
    events: ["dragenter", "drop", "dragexit", "MozLayerTreeReady"],
    init() {
        var sidebar = this.sidebar = document.querySelector("#sidebar-box");
        if (!sidebar) return;
        for (let type of this.events)
            sidebar.addEventListener(type, this);
        ucf_custom_script_win.unloadlisteners.push("autohidesidebar");
        var popup = this.popup = document.querySelector("#sidebarMenu-popup");
        if (!popup) return;
        popup.addEventListener("popupshowing", this);
    },
    destructor() {
        var sidebar = this.sidebar;
        for (let type of this.events)
            sidebar.removeEventListener(type, this);
        if (!this.popup) return;
        this.popup.removeEventListener("popupshowing", this);
    },
    handleEvent(e) {
        this[e.type](e);
    },
    MozLayerTreeReady(e) {
        if (e.originalTarget?.id == "webext-panels-browser" && !this.sidebar.hasAttribute("sidebardrag")) {
            window.addEventListener("mousedown", () => {
                this.drop();
            }, { once: true });
            this.dragenter();
        }
    },
    popupshowing() {
        this.popup.addEventListener("popuphidden", () => {
            this.drop();
        }, { once: true });
        this.dragenter();
    },
    dragenter() {
        if (!this.sidebar.hasAttribute("sidebardrag"))
            this.sidebar.setAttribute("sidebardrag", "true");
    },
    drop() {
        if (this.sidebar.hasAttribute("sidebardrag"))
            this.sidebar.removeAttribute("sidebardrag");
    },
    dragexit(e) {
        var sidebar = this.sidebar;
        var boxObj = sidebar.getBoundingClientRect(), boxScrn = !sidebar.boxObject ? sidebar : sidebar.boxObject;
        if ((!e.relatedTarget || e.screenY <= (boxScrn.screenY + 5) || e.screenY  >= (boxScrn.screenY + boxObj.height - 5)
            || e.screenX <= (boxScrn.screenX + 5) || e.screenX >= (boxScrn.screenX + boxObj.width - 5))
            && sidebar.hasAttribute("sidebardrag"))
            sidebar.removeAttribute("sidebardrag");
    }
}).init(this);
