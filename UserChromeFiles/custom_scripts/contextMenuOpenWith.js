/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
/**
* @param {Boolean} attrimage (required) Add icons (attribute "image") or not
* @param {Boolean} submenu (required) Add submenu for items or not
* @param {String} preitem (required) Prefix for items where Prefix is ​​not specified in name
* @param {String} menuname (required) Menu name if submenu = true
* @param {String} selector (required) Selector in context menu before which to add items
*
* @param {String} name: (required)
*   'Prefix |Name',
* @param {String} path: (required)
*   'Path to the application',
* @param {String} tooltip: (optional)
*   'Hint for menu item',
* @param {String} args: (optional)
*   `Space separated arguments "what is in double quotes is considered one argument"`,
*   Own arguments:
*   %OpenURL% - URL
*   %ProfD% - Firefox profile path
*   %FilePicker% - select a folder, for example for downloading
*   %Prompt(message)% - open a dialog box to change text, such as the name of a media file
*   %quot% - double quotes
* @param {String} rcargs: (optional)
*   Same as "args" but done with right click
* @param {Boolean} clipboard: (optional)
*   Address from clipboard
* @param {String} iconpath: (optional)
*   'Path to icon',
*/
(async (
    // -- Settings -->
    attrimage = true,
    submenu = true,
    preitem = "Open in ",
    menuname = "Open in...",
    selector = "#context-sep-open",

    Linux = [
        {
            name: 'VLC',
            path: '/usr/bin/vlc',
            iconpath: 'moz-icon://stock/vlc?size=menu',
        },
        {
            name: 'Haruna',
            path: '/usr/bin/haruna',
            iconpath: 'moz-icon://stock/haruna?size=menu',
        },
        {
            name: 'Download in |Yt-dlp (sub, socks, cookie)',
            path: '/usr/bin/konsole',
            tooltip: 'Right-click: Download in Yt-dlp (sub, socks, cookie) with folder selection',
            // yt-dlp download video and subtitles (en.*), using browser cookies, preferably .mp4, with hevc|h265|avc|h264 codec, with resolution <=1080
            args: `--hold --workdir ~/Downloads -e "yt-dlp --cookies-from-browser firefox:%ProfD% --proxy socks5://127.0.0.1:1080/ --write-subs --sub-langs %quot%en.*%quot% -f %quot%bv[height<=1080][ext=mp4][vcodec~='^(hevc|h265|avc|h264)']+ba[ext~='(aac|m4a)']/best[height<=1080][ext=mp4]/best[height<=1080]/best%quot% %OpenURL%"`,
            // the same, but with folder selection
            rcargs: `--hold --workdir %FilePicker% -e "yt-dlp --cookies-from-browser firefox:%ProfD% --proxy socks5://127.0.0.1:1080/ --write-subs --sub-langs %quot%en.*%quot% -f %quot%bv[height<=1080][ext=mp4][vcodec~='^(hevc|h265|avc|h264)']+ba[ext~='(aac|m4a)']/best[height<=1080][ext=mp4]/best[height<=1080]/best%quot% %OpenURL%"`,
            iconpath: 'moz-icon://stock/youtube-dl?size=menu',
        },
        {
            name: 'Download from buffer in |FFmpeg',
            path: '/usr/bin/konsole',
            tooltip: 'Right-click: Download from buffer in FFmpeg with selection of folder and file name',
            // ffmpeg copies video-audio stream to mp4 container
            args: `--hold --workdir ~/Downloads -e "ffmpeg -i %OpenURL% -c copy -f mp4 Video.mp4"`,
            // the same, but with the choice of folder and file name
            rcargs: `--hold --workdir %FilePicker% -e "ffmpeg -i %OpenURL% -c copy -f mp4 %Prompt(Video.mp4)%"`,
            clipboard: true,
            iconpath: 'moz-icon://stock/utilities-terminal?size=menu',
        },
    ],
    Windows = [
        {
            name: 'VLC',
            path: 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
        },
    ],
    macOS = [

    ],
    // <-- Settings --

    showing = (e, g) => (e.target != e.currentTarget || g.webExtBrowserType === "popup"
    || (g.isTextSelected || g.onEditable || g.onPassword || g.onImage || g.onVideo || g.onAudio || g.inFrame) && !g.linkURL),
    hiding = e => (e.target != e.currentTarget),
) => ({
    get ProfD() {
        delete this.ProfD;
        return this.ProfD = Services.dirsvc.get("ProfD", Ci.nsIFile).path;
    },
    _eventListeners: [],
    _eventCListeners: [],
    init() {
        switch (Services.appinfo.OS) {
            case "Linux":
                this.arrOS = Linux;
                break;
            case "WINNT":
                this.arrOS = Windows;
                break;
            case "Darwin":
                this.arrOS = macOS;
                break;
            default:
                return;
        }
        var alength = this.arrOS.length;
        if (!alength) return;
        if (alength === 1) submenu = false;
        setUnloadMap(Symbol("contextmenuopenwith"), this.destructor, this);
        this.addListener(this.popup = document.querySelector("#contentAreaContextMenu"), "popupshowing", this);
    },
    addListener(elm, type, listener) {
        elm.addEventListener(type, listener);
        this._eventListeners.push({elm, type, listener});
    },
    addCListener(elm, type, listener) {
        elm.addEventListener(type, listener);
        this._eventCListeners.push({elm, type, listener});
    },
    handleEvent(e) {
        this[e.type](e);
    },
    popupshowing(e) {
        if (showing(e, gContextMenu)) return;
        var contextsel = this.popup.querySelector(`:scope > ${selector}`) || this.popup.querySelector(":scope > menuseparator:last-of-type");
        var fragment = document.createDocumentFragment();
        var itemId = 0;
        this.arrOS.forEach(item => {
            var {name, path, tooltip, args, rcargs, clipboard, iconpath} = item;
            if (!name) name = "contextmenuopenwith";
            name = name.split("|");
            var mitem = document.createXULElement("menuitem");
            mitem.id = `ucf-menu-open-with-${++itemId}`;
            mitem.className = "menuitem-iconic ucf-menu-open-with";
            var str = name.join(""), len = name.length > 1;
            if (submenu) {
                mitem.setAttribute("label", len ? name.slice(1).join("") : str);
                if (tooltip) mitem.tooltipText = `${str}\n${tooltip}`;
                else if (len) mitem.tooltipText = str;
            } else {
                mitem.setAttribute("label", `${len ? "" : preitem}${str}`);
                if (tooltip) mitem.tooltipText = tooltip;
            }
            mitem.apppath = path;
            mitem.appargs = args;
            mitem.apprcargs = rcargs;
            mitem.appclipboard = clipboard;
            if (attrimage) mitem.setAttribute("image", iconpath || `moz-icon://file://${path}?size=16`);
            fragment.append(mitem);
            this.addCListener(mitem, "click", this);
        });
        if (submenu) {
            let rootmenu = this.rootmenu = document.createXULElement("menu");
            rootmenu.id = "ucf-menu-open-with-submenu";
            rootmenu.className = "ucf-menu-open-with";
            rootmenu.setAttribute("label", menuname);
            let mpopup = document.createXULElement("menupopup");
            mpopup.append(fragment);
            rootmenu.append(mpopup);
            contextsel.before(rootmenu);
            this.popupshowing = this.menuShow;
            this.popuphiding = this.menuHide;
        } else {
            contextsel.before(fragment);
            this.popupshowing = this.itemsShow;
            this.popuphiding = this.itemsHide;
        }
        this.addListener(this.popup, "popuphiding", this);
    },
    menuShow(e) {
        if (showing(e, gContextMenu)) return;
        this.rootmenu.hidden = false;
    },
    itemsShow(e) {
        if (showing(e, gContextMenu)) return;
        for (let {elm} of this._eventCListeners)
            elm.hidden = false;
    },
    menuHide(e) {
        if (hiding(e)) return;
        this.rootmenu.hidden = true;
    },
    itemsHide(e) {
        if (hiding(e)) return;
        for (let {elm} of this._eventCListeners)
            elm.hidden = true;
    },
    async click(e) {
        try {
            let {appargs = "", apprcargs = "", apppath: path, appclipboard: clipboard} = e.currentTarget, file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
            file.initWithPath(path);
            if (!file.exists()) return;
            if (file.isExecutable()) {
                let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
                process.init(file);
                let args = !(e.button === 2 && apprcargs) ? appargs : apprcargs;
                let URL = !clipboard === !(e.shiftKey || e.button === 1) ? (gContextMenu?.linkURI?.displaySpec || this.getOriginalUrl(gBrowser.selectedBrowser.currentURI).displaySpec) : this.readFromClipboard();
                if (args = args.trim()) {
                    let openuri = false;
                    let quot = /^"/.test(args) ? true : false;
                    args = args.split(/\s*"\s*/);
                    let temp = [];
                    for (let frag of args) {
                        if (!frag) continue;
                        if (!quot) frag = frag.split(/\s+/);
                        else frag = [frag];
                        quot = !quot;
                        temp = temp.concat(frag);
                    }
                    args = temp;
                    for (let [ind, sp] of args.entries()) {
                        sp = sp.replace(/%quot%/g, '"').replace("%ProfD%", this.ProfD);
                        if (/%FilePicker%/.test(sp)) {
                            let filePicker = await this.filePicker();
                            if (!filePicker) throw "Cancel!";
                            sp = sp.replace(/%FilePicker%/, filePicker);
                        }
                        let match = sp.match(/%Prompt\((.*?)\)%/);
                        if (match) {
                            let newName = { value: match[1] };
                            if (!Services.prompt.prompt(window, "Request", "Enter the name", newName, null, {})) throw "Cancel!";
                            sp = sp.replace(/%Prompt\(.*?\)%/, newName.value);
                        }
                        if (/%OpenURL%/.test(sp)) {
                            openuri = true;
                            sp = sp.replace("%OpenURL%", URL);
                        }
                        args[ind] = sp;
                    }
                    if (!openuri) args.push(URL);
                } else args = [URL];
                process.runwAsync(args, args.length);
            } else file.launch();
        } catch (e) {console.warn(e);}
    },
    filePicker() {
        return new Promise(resolve => {
            var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
            try {
                fp.init(window.browsingContext, "Select folder", fp.modeGetFolder);
            } catch {
                fp.init(window, "Select folder", fp.modeGetFolder);
            }
            fp.open(res => resolve(res == fp.returnOK ? fp.file.path : null));
        });
    },
    getOriginalUrl(URI) {
        var url = URI.spec;
        if (!url.startsWith("about:reader?")) return URI;
        var outerHash = "";
        try {
            let uriObj = Services.io.newURI(url);
            url = uriObj.specIgnoringRef;
            outerHash = uriObj.ref;
        } catch { }
        let searchParams = new URLSearchParams(url.substring("about:reader?".length));
        if (!searchParams.has("url")) return URI;
        let originalUrl = searchParams.get("url");
        if (outerHash)
            try {
                let uriObj = Services.io.newURI(originalUrl);
                uriObj = Services.io.newURI(`#${outerHash}`, null, uriObj);
                originalUrl = uriObj.spec;
            } catch { }
        try {
            return Services.io.newURI(originalUrl);
        } catch {
            return URI;
        }
    },
    readFromClipboard() {
        let trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
        trans.init(docShell.QueryInterface(Ci.nsILoadContext));
        trans.addDataFlavor("text/plain");
        let {clipboard} = Services, data = {}, url = "";
        clipboard.getData(trans, clipboard.kGlobalClipboard);
        trans.getTransferData("text/plain", data);
        if (data.value) url = data.value.QueryInterface(Ci.nsISupportsString).data.trim();
        if (/^(?:https?|ftp):/.test(url)) return url;
        throw "No address in clipboard!";
    },
    destructor() {
        for (let {elm, type, listener} of this._eventListeners)
            elm.removeEventListener(type, listener);
        for (let {elm, type, listener} of this._eventCListeners)
            elm.removeEventListener(type, listener);
    },
}).init())();
