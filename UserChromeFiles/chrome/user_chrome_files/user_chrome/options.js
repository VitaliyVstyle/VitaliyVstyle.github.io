const {UcfPrefs} = ChromeUtils.importESModule("chrome://user_chrome_files/content/user_chrome/UcfPrefs.mjs");
const filesMap = new Map(), filesSet = new Set();
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
const getPrefs = prop => prop.length === 1 ? UcfPrefs.prefs[prop[0]] : UcfPrefs.prefs[prop[0]][prop[1]];
const getJsonStr = pref => JSON.stringify(pref, (key, val) => {
    switch (key) {
        case "path":
            return undefined;
        default:
            return val;
    }
});
const addPref = async (pref, nocreate, nowrite) => {
    getPrefs(pref.prop.split(".")).push(pref);
    if (!nowrite)
        await UcfPrefs.writeJSON();
    if (!nocreate)
        createRow(pref.prop.replace(".", "_"), pref.path, getJsonStr(pref), pref.disable, false, {rebootrequired: true});
    UcfPrefs.rebootSet.add(`${pref.path}?${pref.prop}`);
};
const deletePref = async (prefs, path, nowrite) => {
    if (!Array.isArray(prefs)) return;
    prefs.findIndex((pref, ind) => {
        if (pref.path !== path) return false;
        prefs.splice(ind, 1);
        return true;
    });
    if (!nowrite)
       await UcfPrefs.writeJSON();
};
const handleClick = async ({target, currentTarget}) => {
    if (!/checkbox|image/.test(target.type)) return;
    var prop = currentTarget.id.split("_");
    var row = target.parentElement;
    var path = row.children[1].value;
    switch (target.className) {
        case "enable":
            getPrefs(prop).findIndex(pref => {
                if (pref.path !== path) return false;
                if (!target.checked) pref.disable = true;
                else if ("disable" in pref) delete pref.disable;
                row.children[6].value = getJsonStr(pref);
                UcfPrefs.writeJSON();
                UcfPrefs.rebootSet.add(`${pref.path}?${pref.prop}`);
                row.setAttribute("rebootrequired", "true");
                return true;
            });
            break;
        case "save":
            try {
                let pref = JSON.parse(row.children[6].value);
                if (!window[pref.prop.replace(".", "_")].classList.contains(path.match(/\.(css|js|mjs)$/)[1]))
                    throw null;
                pref.path = path;
                if (!row.matches("#addfile > :scope")) {
                    await deletePref(getPrefs(pref.prop.split(".")), path, true);
                    await addPref(pref, true);
                } else
                    await openOrCreateFile(path, pref);
                initOptions();
            } catch {
                row.setAttribute("error", "true");
            }
            break;
        case "reload":
            await deletePref(getPrefs(prop), path);
            initOptions();
            break;
        case "open":
            openOrCreateFile(path);
            break;
        case "expand":
            try {
                let item = row.children[6];
                if (item.rows === 1) {
                    let val = item.value ? JSON.stringify(JSON.parse(item.value), null, 4) : "";
                    item.rows = 20;
                    item.value = val;
                    row.setAttribute("expand", "true");
                } else {
                    let val = item.value ? JSON.stringify(JSON.parse(item.value)) : "";
                    item.rows = 1;
                    item.value = val;
                    row.removeAttribute("expand");
                }
            } catch {
                row.setAttribute("error", "true");
            }
            break;
    }
};
const openFileOrDir = async (file, ppath, pargs) => {
    let editor = UcfPrefs.getPref(ppath, "").trim();
    if (editor) {
        let itwp = getFile(editor);
        let process = Cc["@mozilla.org/process/util;1"].createInstance(Ci.nsIProcess);
        process.init(itwp);
        let args = (UcfPrefs.getPref(pargs, "").trim() || null)?.split(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/) || [];
        for (let [ind, sp] of args.entries())
            args[ind] = sp.replace(/^["']+|["']+$/g, "");
        args.push(file.path);
        process.runwAsync(args, args.length);
    } else file.launch();
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
    if (!pref) return openFileOrDir(file, "custom_editor_path", "custom_editor_args");
    await IOUtils.writeUTF8(file.path, `/**
@UCF @param ${getJsonStr(pref)} @UCF
*/`, { mode: "create" });
    await addPref(pref, true);
};
const handleInput = ({target: {parentElement: row}}) => {
    if (row.hasAttribute("error"))
        row.removeAttribute("error");
};
const comparePrefs = (pref1, pref2) => {
    var sort = p => Object.fromEntries(Object.entries(p).sort());
    var stringify = p => JSON.stringify(sort(p), (key, val) => {
        switch (key) {
            case "prop":
            case "path":
            case "disable":
                return undefined;
            case "isos":
                return val.sort();
            case "ver":
                return sort(val);
            default:
                return val;
        }
    });
    return stringify(pref1) === stringify(pref2);
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
        let fpref = `${path}?${id}`;
        let attrs = {};
        if (filesMap.has(path)) filesMap.delete(path);
        if (filesMap.has(fpref)) {
            try {
                if (!comparePrefs(pref, filesMap.get(fpref)))
                    attrs.prefdifferent = true;
            } catch {attrs.error = true;}
            filesMap.delete(fpref);
        } else attrs.noprefinfile = true;
        if (UcfPrefs.rebootSet.has(fpref)) attrs.rebootrequired = true;
        if (!filesSet.has(path)) {
            delprefs.push(path);
            continue;
        }
        createRow(_id, path, getJsonStr(pref), pref.disable, false, attrs);
    }
    for (let path of delprefs)
        await deletePref(prefs, path);
};
const createItem = (elm, val, cls, type, img, write, rows = 1) => {
    var item = document.createElement(elm);
    item.className = cls;
    item.rows &&= rows;
    item.autocomplete = "off";
    if (!write) item.readOnly = true;
    item.type = type;
    if (type === "checkbox") item.checked = !val;
    else if (val) item.value = val;
    if (img) item.src = img;
    return item;
};
const createRow = (id, val1, val2, disable, write, atr = {}) => {
    var row = document.createElement("div");
    row.className = "row";
    row.append(createItem("input", disable, "enable", "checkbox", null, true));
    row.append(createItem("input", val1, "path", "text", null, write));
    row.append(createItem("input", null, "open", "image", `${chromeUrl}svg/open.svg`, true));
    row.append(createItem("input", null, "reload", "image", `${chromeUrl}svg/reload.svg`, true));
    row.append(createItem("input", null, "save", "image", `${chromeUrl}svg/save.svg`, true));
    row.append(createItem("input", null, "expand", "image", `${chromeUrl}svg/expand.svg`, true));
    row.append(createItem("textarea", val2, "pref", "textarea", null, true));
    for (let p in atr)
        row.setAttribute(p, atr[p]);
    window[id].append(row);
    return row;
};
const initOptions = async () => {
    filesMap.clear();
    filesSet.clear();
    var dir = getFile(UcfPrefs.manifestPath).parent;
    var rootpath = "";
    var search = (file, sp) => {
        if (file.isDirectory())
            for(let f of file.directoryEntries)
                search(f, sp);
        else if ((sp === STP && /\.css$/.test(file.leafName)) || (sp === SCP && (/\.js$/.test(file.leafName) || /\.mjs$/.test(file.leafName)))) {
            let path = file.path.replace(rootpath, "").replace(/\\/g, "/").replace(/^\//, "");
            let str = Cu.readUTF8File(file);
            if (str = str.match(/@UCF\s@param\s{.+?}\s@UCF/gs))
                for (let pref of str)
                    try {
                        let p = JSON.parse(pref.match(/@UCF\s@param\s({.+?})\s@UCF/s)[1]);
                        p.path = path;
                        filesMap.set(`${path}?${p.prop}`, p);
                    } catch (e) {console.error(path, e);}
            else
                filesMap.set(path, null);
            filesSet.add(path);
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
    var addpref = false;
    for (let [path, pref] of filesMap)
        try {
            if (pref) {
                await addPref(pref, false, true);
                addpref = true;
            } else {
                let base;
                if (/\.js$/.test(path)) base = baseJS;
                else if (/\.css$/.test(path)) base = baseCSS;
                else base = baseMJS;
                createRow("allfiles", path, JSON.stringify(base), true, false, {unconnected: true});
            }
        } catch (e) {Cu.reportError(e);}
    for (let path of filesSet)
        try {
            if (!filesMap.has(path)) createRow("allfiles", path, "", true);
        } catch (e) {Cu.reportError(e);}
    if (addpref)
        await UcfPrefs.writeJSON();
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
    document.querySelector("#open_edit_ucf").onclick = () => openFileOrDir(getFile(UcfPrefs.manifestPath).parent, "custom_folder_editor_path", "custom_folder_editor_args");
    document.querySelector("#restart").onclick = () => UcfPrefs.restartApp();
    document.querySelector("#restart_no_cache").onclick = () => UcfPrefs.restartApp(true);
    document.querySelector("#homepage").onclick = () => UcfPrefs.openHavingURI(window, "https://github.com/VitaliyVstyle/VitaliyVstyle.github.io/tree/main/UserChromeFiles");
    window.addEventListener("input", handleInput);
    window.addEventListener("unload", () => {
        window.removeEventListener("input", handleInput);
        l10n.disconnectRoot(document.documentElement);
        UcfPrefs._options_open = false;
    }, { once: true });
    initOptions();
};
initLoad();
