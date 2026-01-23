/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
(async (
    icon = "chrome://user_chrome_files/content/custom_scripts/svg/edit-delete.svg",
) => ({
    init() {
        var panel = this.panel = DownloadsPanel.panel;
        if (!panel) return;
        setUnloadMap(Symbol("cleardownloadsbutton"), this.destructor, this);
        panel.addEventListener("popupshowing", this);
    },
    destructor() {
        this.panel.removeEventListener("popupshowing", this);
        if (this.list) this.panel.removeEventListener("popuphiding", this, { once: true });
        this.btn?.removeEventListener("command", this);
    },
    handleEvent(e) {
        var dh = DownloadsView.downloadsHistory;
        var style = `data:text/css;charset=utf-8,${encodeURIComponent(`
vbox#downloadsFooterButtons {
display: grid !important;
grid-template-columns: repeat(2, 1fr);
grid-auto-rows: auto 1fr;
align-items: stretch !important;
grid-template-areas: "a a" "b c";
& > toolbarseparator:first-of-type {
grid-area: a;
align-self: start !important;
}
& > #downloadsHistory {
grid-area: b;
}
& > #ucf-cleardownloads-btn {
grid-area: c;
border: none !important;
}
& > button {
margin: 0 !important;
flex-grow: 1 !important;
justify-content: center !important;
align-items: center !important;
}
&.panel-footer.panel-footer-menulike > button {
margin-top: 4px !important;
}
& > #ucf-cleardownloads-btn {
list-style-image: url("${icon}") !important;
-moz-context-properties: fill, stroke, fill-opacity !important;
fill: color-mix(in srgb, currentColor 20%, #e31b5d) !important;
&[disabled] {
pointer-events: none !important;
}
}
}
`)}`;
        windowUtils.loadSheetUsingURIString(style, windowUtils.USER_SHEET);
        var btn = this.btn = document.createXULElement("button");
        btn.id = "ucf-cleardownloads-btn";
        btn.className = "downloadsPanelFooterButton subviewbutton panel-subview-footer-button toolbarbutton-1";
        btn.disabled = true;
        dh.after(btn);
        btn.addEventListener("command", this);
        (this.handleEvent = this.hEvent).call(this, e);
    },
    hEvent(e) {
        this[e.type](e);
    },
    command(e) {
        DownloadsCommon.getData(window, true).removeFinished();
        PlacesUtils.history.removeVisitsByFilter({
            transition: PlacesUtils.history.TRANSITIONS.DOWNLOAD,
        }).catch(Cu.reportError);
        this.btn.disabled = true;
    },
    async setbutton() {
        var {_downloads} = await DownloadsCommon.getData(window, true)._promiseList;
        for (let {stopped, canceled, hasPartialData} of _downloads) {
            if (stopped && !(canceled && hasPartialData)) {
                this.btn.disabled = false;
                return;
            }
        }
        this.btn.disabled = true;
    },
    popupshowing(e) {
        if (e.target != this.panel) return;
        this.setbutton();
        (this.list = DownloadsCommon.getData(window, true)).addView(this);
        this.panel.addEventListener("popuphiding", this, {once: true});
    },
    popuphiding(e) {
        if (e.target != this.panel) return;
        this.list.removeView(this);
        this.list = null;
    },
    onDownloadChanged() {
        this.setbutton();
    },
    onDownloadRemoved() {
        if (!this.btn.disabled) this.setbutton();
    },
}).init())();
