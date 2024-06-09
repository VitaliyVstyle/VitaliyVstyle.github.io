(async (
    id = Symbol("autohidesidebar"),
    events = ["dragenter", "drop", "dragexit", "MozLayerTreeReady"],
    sidebar = document.querySelector("#sidebar-box"),
    popup = document.querySelector("#sidebarMenu-popup"),
) => (this[id] = {
    init() {
        if (!sidebar || !popup || Services.prefs.getBoolPref("sidebar.revamp", false)) return;
        for (let type of events)
            sidebar.addEventListener(type, this);
        popup.addEventListener("popupshowing", this);
        setUnloadMap(id, () => {
            for (let type of events)
                sidebar.removeEventListener(type, this);
            popup.removeEventListener("popupshowing", this);
        }, this);
    },
    handleEvent(e) {
        this[e.type](e);
    },
    MozLayerTreeReady(e) {
        if (e.originalTarget?.id == "webext-panels-browser" && !sidebar.hasAttribute("sidebardrag")) {
            window.addEventListener("mousedown", () => {
                this.drop();
            }, { once: true });
            this.dragenter();
        }
    },
    popupshowing() {
        popup.addEventListener("popuphidden", () => {
            this.drop();
        }, { once: true });
        this.dragenter();
    },
    dragenter() {
        if (!sidebar.hasAttribute("sidebardrag"))
            sidebar.setAttribute("sidebardrag", "true");
    },
    drop() {
        if (sidebar.hasAttribute("sidebardrag"))
            sidebar.removeAttribute("sidebardrag");
    },
    dragexit(e) {
        var boxObj = sidebar.getBoundingClientRect(), boxScrn = !sidebar.boxObject ? sidebar : sidebar.boxObject;
        if ((!e.relatedTarget || e.screenY <= (boxScrn.screenY + 5) || e.screenY  >= (boxScrn.screenY + boxObj.height - 5)
            || e.screenX <= (boxScrn.screenX + 5) || e.screenX >= (boxScrn.screenX + boxObj.width - 5))
            && sidebar.hasAttribute("sidebardrag"))
            sidebar.removeAttribute("sidebardrag");
    },
}).init())();
