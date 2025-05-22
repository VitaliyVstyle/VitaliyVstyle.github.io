const {UcfPrefs} = ChromeUtils.importESModule("chrome://user_chrome_files/content/user_chrome/UcfPrefs.mjs");
const filesMap = new Map(), allFilesMap = new Map();
const baseCSS = {prop: "CssChrome", type: "USER_SHEET", disable: true};
const baseJS = {prop: "JsChrome.load", disable: true};
const baseMJS = {prop: "JsBackground", module: true, disable: true};
const chromeUrl = "chrome://user_chrome_files/content/user_chrome/";
const STP = "custom_styles", SCP = "custom_scripts";
const getFile = path => {
    var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    file.initWithPath(path);
    return file;
};
const addPref = async pref => {
    var prop = pref.prop.split(".");
    var prefs = prop.length === 1 ? UcfPrefs.prefs[prop[0]] : UcfPrefs.prefs[prop[0]][prop[1]];
    prefs.push(pref);
    createRow(pref.prop.replace(".", "_"), pref.path, JSON.stringify(pref, (key, val) => (key !== "func") ? val : decodeURIComponent(val)), pref.disable);
    filesMap.delete(`${pref.path}?${pref.prop}`);
    await UcfPrefs.writeJSON();
};
const deletePref = async (prefs, path, elm, nowrite) => {
    elm?.remove();
    if (!Array.isArray(prefs)) return;
    prefs.findIndex((pref, ind) => {
        if (pref.path === path) {
            prefs.splice(ind, 1);
            return true;
        }
    });
    if (!nowrite)
       await UcfPrefs.writeJSON();
};
const handleClick = async ({target, currentTarget}) => {
    if (!/checkbox|image/.test(target.type)) return;
    var prop = currentTarget.id.split("_");
    var prefs = prop.length === 1 ? UcfPrefs.prefs[prop[0]] : UcfPrefs.prefs[prop[0]][prop[1]];
    var row = target.parentElement;
    var path = row.children[1].value;
    switch (target.className) {
        case "enable":
            prefs.findIndex(pref => {
                if (pref.path === path) {
                    if (!target.checked) pref.disable = true;
                    else if ("disable" in pref) delete pref.disable;
                    row.children[5].value = JSON.stringify(pref, (key, val) => (key !== "func") ? val : decodeURIComponent(val));
                    UcfPrefs.writeJSON();
                    return true;
                }
            });
            break;
        case "save":
            try {
                let pref = JSON.parse(row.children[5].value, (key, val) => (key !== "func") ? val : encodeURIComponent(val));
                if (!window[pref.prop.replace(".", "_")].classList.contains(path.match(/\.(css|js|mjs)$/)[1]))
                    throw null;
                pref.path ||= path;
                if (!row.matches("#addfile > :scope")) {
                    let all = row.matches("#allfiles > :scope");
                    if (!all) await deletePref(prefs, path, null, true);
                    await addPref(pref);
                    if (all) {
                        row.removeAttribute("unconnected");
                        row.children[5].value = "";
                    }
                    if (!all) initOptions();
                    return;
                }
                if (!/\.mjs$/.test(path)) await openOrCreateFile(path, pref);
                else await addPref(pref);
                row.children[1].value = row.children[5].value = "";
            } catch {
                row.setAttribute("error", "true");
            }
            break;
        case "reload":
            await deletePref(prefs, path, row);
            initOptions();
            break;
        case "open":
            openOrCreateFile(path);
            break;
    }
};
const openOrCreateFile = async (path, pref) => {
    var cdir = /\.css$/.test(path) ? STP : SCP;
    var sp = path.split("/");
    var fn = sp.pop();
    var file = getFile(UcfPrefs.manifestPath).parent;
    file.append(cdir);
    if (sp.length)
        for (let d of sp) {
            file.append(d);
            if (pref) await IOUtils.makeDirectory(file.path, { permissions: 0o700, ignoreExisting: true });
        }
    file.append(fn);
    if (!pref) {
        let editor = UcfPrefs.getPref("custom_editor_path", "").trim();
        if (editor) {
            let itwp = getFile(editor);
            let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
            process.init(itwp);
            let args = (UcfPrefs.getPref("custom_editor_args", "").trim() || null)?.split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/) || [];
            for (let [ind, sp] of args.entries()) {
                sp = sp.replace(/^["']+|["']+$/g, "");
                args[ind] = sp;
            }
            args.push(file.path);
            process.runwAsync(args, args.length);
        } else file.launch();
        return;
    }
    delete pref.path;
    await IOUtils.writeUTF8(file.path, `/**
@UCF @param ${JSON.stringify(pref, (key, val) => (key !== "func") ? val : decodeURIComponent(val))} @UCF
*/`, { mode: "create" });
    pref.path = path;
    addPref(pref);
};
const handleInput = ({target: {parentElement: row}}) => {
    if (row.hasAttribute("error"))
        row.removeAttribute("error");
};
const createSection = async (prefs, id) => {
    var _id = id.replace(".", "_");
    var sec = window[_id] ||= document.querySelector(`#${_id}`);
    var children = sec.querySelectorAll(":scope > .row");
    if (children.length)
        for (let child of children)
            child.remove();
    else if (!sec.onclick)
        sec.onclick = e => handleClick(e);
    var delprefs = [];
    for (let pref of prefs) {
        let {path} = pref;
        filesMap.delete(path);
        filesMap.delete(`${path}?${id}`);
        if (!allFilesMap.has(path) && !/\.mjs$/.test(path)) {
            delprefs.push(path);
            continue;
        }
        createRow(_id, path, JSON.stringify(pref, (key, val) => (key !== "func") ? val : decodeURIComponent(val)), pref.disable);
    }
    for (let path of delprefs)
        await deletePref(prefs, path);
};
const createInp = (val, cls, type, img, write) => {
    var inp = document.createElement("input");
    inp.className = cls;
    inp.autocomplete = "off";
    if (!write) inp.readOnly = true;
    inp.setAttribute("type", type);
    if (type === "checkbox") inp.checked = !val;
    else inp.value = val || "";
    if (img) inp.src = img;
    return inp;
};
const createRow = (id, val1, val2, disable, write, atr = {}) => {
    var tr = document.createElement("div");
    tr.className = "row";
    tr.append(createInp(disable, "enable", "checkbox", null, true));
    tr.append(createInp(val1, "path", "text", null, write));
    tr.append(createInp("", "open", "image", `${chromeUrl}svg/open.svg`, true));
    tr.append(createInp("", "reload", "image", `${chromeUrl}svg/reload.svg`, true));
    tr.append(createInp("", "save", "image", `${chromeUrl}svg/save.svg`, true));
    tr.append(createInp(val2, "pref", "text", null, true));
    for (let p in atr)
        tr.setAttribute(p, atr[p]);
    window[id].append(tr);
    return tr;
};
const initOptions = async () => {
    filesMap.clear();
    allFilesMap.clear();
    var dir = getFile(UcfPrefs.manifestPath).parent;
    var rootpath = "";
    var search = (file, sp) => {
        var fileExt;
        if (file.isDirectory())
            for(let f of file.directoryEntries)
                search(f, sp);
        else if ((sp === STP && (fileExt = "css") && /\.css$/.test(file.leafName))
            || (sp === SCP && (((fileExt = "js") && /\.js$/.test(file.leafName)) || ((fileExt = "mjs") && /\.mjs$/.test(file.leafName))))) {
            let path = file.path.replace(rootpath, "").replace(/\\/g, "/").replace(/^\//, "");
            let str = Cu.readUTF8URI(Services.io.newURI(`chrome://user_chrome_files/content/${sp}/${path}`));
            if (fileExt === "mjs") path = `%UCFDIR%${path}`;
            if (str = str.match(/@UCF\s@param\s{.+?}\s@UCF/g)) {
                for (let pref of str)
                    try {
                        let p = JSON.parse(pref.match(/@UCF\s@param\s({.+?})\s@UCF/)[1], (key, val) => (key !== "func") ? val : encodeURIComponent(val));
                        p.path = path;
                        let pp = `${path}?${p.prop}`;
                        filesMap.set(pp, p);
                    } catch (e) {console.error(path, e);}
            } else
                filesMap.set(path, null);
            allFilesMap.set(path, fileExt);
        }
    };
    dir.append(STP);
    rootpath = dir.path;
    search(dir, STP);
    dir = dir.parent;
    dir.append(SCP);
    rootpath = dir.path;
    search(dir, SCP);
    await createSection(UcfPrefs.prefs.CssChrome, "CssChrome");
    await createSection(UcfPrefs.prefs.CssAllFrame, "CssAllFrame");
    await createSection(UcfPrefs.prefs.CssContent, "CssContent");
    await createSection(UcfPrefs.prefs.JsBackground, "JsBackground");
    await createSection(UcfPrefs.prefs.JsChrome.DOMContentLoaded, "JsChrome.DOMContentLoaded");
    await createSection(UcfPrefs.prefs.JsChrome.load, "JsChrome.load");
    await createSection(UcfPrefs.prefs.JsAllChrome.DOMContentLoaded, "JsAllChrome.DOMContentLoaded");
    await createSection(UcfPrefs.prefs.JsAllChrome.load, "JsAllChrome.load");
    await createSection(UcfPrefs.prefs.JsContent.DOMWindowCreated, "JsContent.DOMWindowCreated");
    await createSection(UcfPrefs.prefs.JsContent.DOMContentLoaded, "JsContent.DOMContentLoaded");
    await createSection(UcfPrefs.prefs.JsContent.pageshow, "JsContent.pageshow");
    createSection([], "addfile");
    createRow("addfile", "", "", true, true);
    createSection([], "allfiles");
    for (let [path, pref] of filesMap)
        try {
            if (pref) await addPref(pref);
            else {
                let base;
                if (/\.js$/.test(path)) base = baseJS;
                else if (/\.css$/.test(path)) base = baseCSS;
                else base = baseMJS;
                base.path = path;
                createRow("allfiles", path, JSON.stringify(base), true, false, {unconnected: "true"});
            }
        } catch (e) {Cu.reportError(e);}
    for (let [path] of allFilesMap)
        try {
            if (!filesMap.has(path)) createRow("allfiles", path, "", true);
        } catch (e) {Cu.reportError(e);}
};
const initLoad = () => {
    if (UcfPrefs._options_open) {
        browsingContext.top.embedderElement.closeBrowser();
        return;
    }
    UcfPrefs._options_open = true;
    var l10n = UcfPrefs.doMLocalization("prefs.ftl");
    l10n.connectRoot(document.documentElement);
    l10n.translateRoots();
    document.querySelector("#open_ucf").onclick = () => getFile(UcfPrefs.manifestPath).parent.launch();
    document.querySelector("#restart").onclick = () => UcfPrefs.restartApp();
    document.querySelector("#restart_no_cache").onclick = () => UcfPrefs.restartApp(true);
    document.querySelector("#homepage").onclick = () => UcfPrefs.openHavingURI(window, "https://github.com/VitaliyVstyle/VitaliyVstyle.github.io/tree/main/UserChromeFiles");
    window.addEventListener("input", handleInput);
    initOptions();
    window.addEventListener("unload", () => {
        window.removeEventListener("input", handleInput);
        l10n.disconnectRoot(document.documentElement);
        UcfPrefs._options_open = false;
    }, { once: true });
};
initLoad();
