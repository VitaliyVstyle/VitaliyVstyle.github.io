/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
(async (
    delay = 150,
    clickreloadtab = true,
    previewmode = false,
    returndelay = 50,
) => ({
    init() {
        this.tid = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        this.target = false;
        var tabs = this.tabs = gBrowser.tabContainer;
        if (clickreloadtab) this.reload = document.querySelector("commandset#mainCommandSet > command[id='Browser:Reload']");
        setUnloadMap(Symbol(), this.destructor, this);
        if (previewmode) {
            this.onMouseIn = this._onMouseIn;
            this.onMouseOut = this._onMouseOut;
            this.onMouseClicked = this._onMouseClicked;
            this.previewTid = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
            this.previewTab = gBrowser.selectedTab;
            this.onTabClose = this.onTabClose.bind(this);
            tabs.addEventListener("TabClose", this.onTabClose);
        }
        this.onMouseIn = this.onMouseIn.bind(this);
        tabs.addEventListener("mouseover", this.onMouseIn);
        this.onMouseOut = this.onMouseOut.bind(this);
        tabs.addEventListener("mouseout", this.onMouseOut);
        this.onMouseClicked = this.onMouseClicked.bind(this);
        tabs.addEventListener("click", this.onMouseClicked);
    },
    destructor() {
        var {tabs} = this;
        tabs.removeEventListener("mouseover", this.onMouseIn);
        tabs.removeEventListener("mouseout", this.onMouseOut);
        tabs.removeEventListener("click", this.onMouseClicked);
        if (!previewmode) return;
        tabs.removeEventListener("TabClose", this.onTabClose);
    },
    callback(tab) {
        gBrowser.selectedTab = tab;
        this.target = false;
    },
    previewCallback(tab) {
        gBrowser.selectedTab = tab;
    },
    onMouseIn(e) {
        var tab = e.target.closest?.("tab.tabbrowser-tab:not([selected])");
        if (!tab) return;
        this.target = true;
        this.tid.initWithCallback(() => this.callback(tab), delay, this.tid.TYPE_ONE_SHOT);
    },
    _onMouseIn(e) {
        this.previewTid.cancel();
        var tab = e.target.closest?.("tab.tabbrowser-tab:not([selected])");
        if (!tab) return;
        this.target = true;
        this.tid.initWithCallback(() => this.callback(tab), delay, this.tid.TYPE_ONE_SHOT);
    },
    onMouseOut() {
        this.tid.cancel();
        this.target = false;
    },
    _onMouseOut() {
        this.tid.cancel();
        this.target = false;
        if (!this.previewTab) return;
        this.previewTid.cancel();
        this.previewTid.initWithCallback(() => this.previewCallback(this.previewTab), returndelay, this.previewTid.TYPE_ONE_SHOT);
    },
    onMouseClicked(e) {
        if (clickreloadtab && e.detail === 1 && e.button === 0 && !this.target && e.composedTarget.matches("tab.tabbrowser-tab :not(toolbarbutton, image):scope, tab.tabbrowser-tab image.tab-icon-image:scope"))
            this.reload.doCommand();
        this.tid.cancel();
        this.target = false;
    },
    _onMouseClicked(e) {
        this.previewTid.cancel();
        var tab = gBrowser.selectedTab;
        if (clickreloadtab && e.detail === 1 && e.button === 0 && !this.target && this.previewTab == tab && e.composedTarget.matches("tab.tabbrowser-tab :not(toolbarbutton, image):scope, tab.tabbrowser-tab image.tab-icon-image:scope"))
            this.reload.doCommand();
        this.tid.cancel();
        this.target = false;
        this.previewTab = tab;
    },
    onTabClose(e) {
        if (e.target == this.previewTab) this.previewTab = gBrowser.selectedTab;
    },
}).init())();
