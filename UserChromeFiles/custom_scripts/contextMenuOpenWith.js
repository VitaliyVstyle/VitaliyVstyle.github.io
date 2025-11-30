/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
/**
* @param {Boolean} attrimage (required) Add icons or not
* @param {Boolean} submenu (required) Add submenu for items or not
* @param {String} rootmenuicon (required) Icon, if submenu = true
* @param {String} preitem (required) Prefix for items, if submenu = false
* @param {String} menuname (required) Menu name, if submenu = true
* @param {String} selector (required) Selector in context menu before which to add items
*
* @param {String} name: (required)
*   'Name',
* @param {String} path: (required)
*   'Path to the application',
* @param {String} args: (optional)
*   `Space separated arguments "what is in double quotes is considered one argument"`,
*   Own arguments:
*   %OpenURL% - URL
*   %ProfD% - Firefox profile path
*   %FilePicker% - select a folder, for example for downloading
*   %FilePickerR% - Right-click: select a folder, for example for downloading
*   %Prompt(message)% - open a dialog box to change text, such as the name of a media file
*   %quot% - double quotes
* @param {Boolean} clipboard: (optional) Address from clipboard
* @param {String} iconpath: (optional)
*   'Path to icon',
*/
(async (
    // -- Settings -->
    attrimage = true,
    submenu = true,
    rootmenuicon = "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' height='16' width='16' viewBox='0 0 16 16'><rect x='0' y='0' width='16' height='16' rx='3' ry='3' style='fill:rgb(64, 64, 72);'/><path style='fill:none;stroke:white;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;' d='M 2.6,3.6 7,8 2.6,12.4 m 5,0 h 5.8'/></svg>",
    preitem = "",
    menuname = "Open in...",
    selector = "#context-sep-open",
    prompttitle = "Prompt",
    filename = "Enter the name",
    selectfolder = "Select folder",

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
            name: 'Yt-dlp (Sub, Socks, Cookie)',
            path: '/usr/bin/konsole',
            // yt-dlp download video and subtitles (en.*), using cookies.txt, preferably .mp4, with hevc|h265|avc|h264 codec, with resolution <=1080
            args: `--hold --workdir %FilePickerR% -e "~/bin/yt-dlp --cookies cookies.txt --proxy socks5://127.0.0.1:1080/ --write-subs --sub-langs %quot%en.*%quot% -f %quot%bv[height<=1080][ext=mp4][vcodec~='^(hevc|h265|avc|h264)']+ba[ext~='(aac|m4a)']/best[height<=1080][ext=mp4]/best[height<=1080]/best%quot% %OpenURL%"`,
            iconpath: 'moz-icon://stock/youtube-dl?size=menu',
        },
        {
            name: 'FFmpeg (ClipboardURL)',
            path: '/usr/bin/konsole',
            // ffmpeg copies video-audio stream to mp4 container
            args: `--hold --workdir %FilePickerR% -e "ffmpeg -i %OpenURL% -c copy -f mp4 %Prompt(VideoName.mp4)%"`,
            clipboard: true,
            iconpath: 'moz-icon://stock/utilities-terminal?size=menu',
        },
        {
            name: 'FFmpeg (VideoURL+AudioURL)',
            path: '/usr/bin/konsole',
            // ffmpeg copies video only + audio only stream to mp4 container
            args: `--hold --workdir %FilePickerR% -e "ffmpeg -i %Prompt(VideoURL)% -i %Prompt(AudioURL)% -c copy -f mp4 %Prompt(VideoName.mp4)%"`,
            clipboard: true,
            iconpath: 'moz-icon://stock/utilities-terminal?size=menu',
        },
    ],
    Windows = [
        {
            name: 'VLC',
            path: 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe',
        },
        {
            name: 'PotPlayer',
            path: 'C:\\Program Files\\DAUM\\PotPlayer\\PotPlayerMini64.exe',
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
    get DfltDwnld() {
        delete this.DfltDwnld;
        try {
            return this.DfltDwnld = Services.dirsvc.get("DfltDwnld", Ci.nsIFile).path;
        } catch {
            return this.DfltDwnld = Services.dirsvc.get("Desk", Ci.nsIFile).path;
        }
    },
    get FilePath() {
        delete this.FilePath;
        return this.FilePath = Components.Constructor("@mozilla.org/file/local;1", Ci.nsIFile, "initWithPath");
    },
    get ProcessInit() {
        delete this.ProcessInit;
        return this.ProcessInit = Components.Constructor("@mozilla.org/process/util;1", Ci.nsIProcess, "init");
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
            var {name, path, args = "", clipboard, iconpath} = item;
            if (!name || !path) return;
            var mitem = document.createXULElement("menuitem");
            mitem.id = `ucf-menu-open-with-${++itemId}`;
            mitem.className = "ucf-menu-open-with";
            mitem.setAttribute("label", `${submenu ? "" : preitem}${name}`);
            mitem.apppath = path;
            mitem.appargs = args;
            mitem.appclipboard = clipboard;
            if (attrimage) {
                mitem.classList.add("menuitem-iconic");
                mitem.style.cssText = `--menuitem-icon:url("${iconpath || `moz-icon://${PathUtils.toFileURI(path)}?size=menu`}");list-style-image:var(--menuitem-icon);-moz-context-properties:fill,stroke,fill-opacity;stroke:currentColor;fill:currentColor;fill-opacity:var(--toolbarbutton-icon-fill-opacity,.8);`;
            }
            fragment.append(mitem);
            this.addCListener(mitem, "click", this);
        });
        if (submenu) {
            let rootmenu = this.rootmenu = document.createXULElement("menu");
            rootmenu.id = "ucf-menu-open-with-submenu";
            rootmenu.className = "ucf-menu-open-with";
            if (rootmenuicon) {
                rootmenu.classList.add("menu-iconic");
                rootmenu.style.cssText = `--menuitem-icon:url("${rootmenuicon}");list-style-image:var(--menuitem-icon);-moz-context-properties:fill,stroke,fill-opacity;stroke:currentColor;fill:currentColor;fill-opacity:var(--toolbarbutton-icon-fill-opacity,.8);`;
            }
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
            let mitem = e.currentTarget;
            let {appargs: args, apppath: path, appclipboard: clipboard, applastfpdir: lastfpdir} = mitem;
            let file = new this.FilePath(path);
            if (!file.exists()) return;
            if (file.isExecutable()) {
                let process = new this.ProcessInit(file);
                let fpdir;
                let URL = !clipboard === !(e.shiftKey || e.button === 1) ? (gContextMenu?.linkURI?.displaySpec || this.getOriginalUrl(gBrowser.selectedBrowser.currentURI).displaySpec) : this.readFromClipboard();
                if (args = args.trim()) {
                    let quot = /^"/.test(args);
                    let temp = [];
                    for (let frag of args.split(/\s*"\s*/)) {
                        if (!frag) continue;
                        if (!quot) frag = frag.split(/\s+/);
                        else frag = [frag];
                        quot = !quot;
                        temp = temp.concat(frag);
                    }
                    args = temp;
                    for (let [ind, sp] of args.entries()) {
                        sp = sp.replace(/%quot%/g, '"').replace(/%ProfD%/g, () => this.ProfD).replace(/%OpenURL%/g, URL);
                        if (/%FilePicker%/.test(sp)) {
                            fpdir = await this.filePicker(lastfpdir || this.DfltDwnld);
                            if (!fpdir) throw "Cancel!";
                            sp = sp.replace(/%FilePicker%/g, fpdir);
                        }
                        if (/%FilePickerR%/.test(sp)) {
                            if (e.button === 2) {
                                fpdir = await this.filePicker(lastfpdir || this.DfltDwnld);
                                if (!fpdir) throw "Cancel!";
                            }
                            sp = sp.replace(/%FilePickerR%/g, fpdir || lastfpdir || this.DfltDwnld);
                        }
                        if (/%Prompt\(.*?\)%/.test(sp))
                            sp = sp.replace(/%Prompt\(.*?\)%/g, match => {
                                let newName = { value: match.match(/%Prompt\((.*?)\)%/)[1] };
                                if (!Services.prompt.prompt(window, prompttitle, filename, newName, null, {})) throw "Cancel!";
                                return newName.value;
                            });
                        args[ind] = sp;
                    }
                } else args = [URL];
                process.runwAsync(args, args.length);
                if (fpdir && (lastfpdir !== fpdir)) mitem.applastfpdir = fpdir;
            } else file.launch();
        } catch (e) {console.warn(e);}
    },
    filePicker(lastfpdir) {
        return new Promise(resolve => {
            var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
            try {
                fp.init(window.browsingContext, selectfolder, fp.modeGetFolder);
            } catch {
                fp.init(window, selectfolder, fp.modeGetFolder);
            }
            if (lastfpdir) {
                let dir = new this.FilePath(lastfpdir);
                if (dir.exists() && dir.isDirectory()) fp.displayDirectory = dir;
            }
            fp.open(res => resolve(res === fp.returnOK ? fp.file.path : null));
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
