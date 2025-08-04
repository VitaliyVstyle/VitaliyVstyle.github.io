/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
(async (
    delay = 150,
    clickreloadtab = false,
    previewmode = false,
    returndelay = 50,
) => ({
    init() {
        this.tid = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
        this.target = false;
        var contain = this.contain = gBrowser.tabContainer;
        this.reload = document.querySelector("commandset#mainCommandSet > command[id='Browser:Reload']");
        setUnloadMap(Symbol(), this.destructor, this);
        if (!previewmode) {
            this.onMouseIn = this._onMouseIn;
            this.onMouseOut = this._onMouseOut;
            this.onMouseClicked = this._onMouseClicked;
        } else {
            this.onMouseIn = this.__onMouseIn;
            this.onMouseOut = this.__onMouseOut;
            this.onMouseClicked = this.__onMouseClicked;
            this.previewTid = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
            this.previewTab = gBrowser.selectedTab;
            this.onTabClose_ = this.onTabClose.bind(this);
            contain.addEventListener("TabClose", this.onTabClose_);
        }
        this.onMouseIn_ = this.onMouseIn.bind(this);
        contain.addEventListener("mouseover", this.onMouseIn_);
        this.onMouseOut_ = this.onMouseOut.bind(this);
        contain.addEventListener("mouseout", this.onMouseOut_);
        this.onMouseClicked_ = this.onMouseClicked.bind(this);
        contain.addEventListener("click", this.onMouseClicked_);
    },
    destructor() {
        var {contain} = this;
        contain.removeEventListener("mouseover", this.onMouseIn_);
        contain.removeEventListener("mouseout", this.onMouseOut_);
        contain.removeEventListener("click", this.onMouseClicked_);
        if (!previewmode) return;
        contain.removeEventListener("TabClose", this.onTabClose_);
    },
    callback(tab) {
        gBrowser.selectedTab = tab;
        this.target = false;
    },
    previewCallback(tab) {
        gBrowser.selectedTab = tab;
    },
    _onMouseIn(e) {
        var tab = e.target.closest?.("tab.tabbrowser-tab:not([selected])");
        if (!tab) return;
        this.target = true;
        this.tid.initWithCallback(() => this.callback(tab), delay, this.tid.TYPE_ONE_SHOT);
    },
    __onMouseIn(e) {
        this.previewTid.cancel();
        var tab = e.target.closest?.("tab.tabbrowser-tab:not([selected])");
        if (!tab) return;
        this.target = true;
        this.tid.initWithCallback(() => this.callback(tab), delay, this.tid.TYPE_ONE_SHOT);
    },
    _onMouseOut() {
        this.tid.cancel();
        this.target = false;
    },
    __onMouseOut() {
        this.tid.cancel();
        this.target = false;
        if (!this.previewTab) return;
        this.previewTid.cancel();
        this.previewTid.initWithCallback(() => this.previewCallback(this.previewTab), returndelay, this.previewTid.TYPE_ONE_SHOT);
    },
    _onMouseClicked(e) {
        if (clickreloadtab && e.detail === 1 && e.button === 0 && !this.target && (e.composedTarget || e.target).matches("tab.tabbrowser-tab :not(toolbarbutton, image):scope, tab.tabbrowser-tab image.tab-icon-image:scope"))
            this.reload.doCommand();
        this.tid.cancel();
        this.target = false;
    },
    __onMouseClicked(e) {
        this.previewTid.cancel();
        var tab = gBrowser.selectedTab;
        if (clickreloadtab && e.detail === 1 && e.button === 0 && !this.target && this.previewTab == tab && (e.composedTarget || e.target).matches("tab.tabbrowser-tab :not(toolbarbutton, image):scope, tab.tabbrowser-tab image.tab-icon-image:scope"))
            this.reload.doCommand();
        this.tid.cancel();
        this.target = false;
        this.previewTab = tab;
    },
    onTabClose(e) {
        if (e.target == this.previewTab) this.previewTab = gBrowser.selectedTab;
    },
}).init())();
