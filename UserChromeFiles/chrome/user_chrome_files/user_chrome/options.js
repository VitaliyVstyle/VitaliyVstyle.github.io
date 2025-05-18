const {UcfPrefs} = ChromeUtils.importESModule("chrome://user_chrome_files/content/user_chrome/UcfPrefs.mjs");
const filesMap = new Map(), allFilesMap = new Map();
const baseCSS = {prop: "styleschrome", type: "USER_SHEET", disable: true};
const baseJS = {prop: "scriptschrome.load", disable: true};
const baseMJS = {prop: "scriptsbackground", module: true, disable: true};
const chromeUrl = "chrome://user_chrome_files/content/user_chrome/";

const addPref = pref => {
    var prop = pref.prop.split(".");
    var prefs = prop.length === 1 ? UcfPrefs.prefs[prop[0]] : UcfPrefs.prefs[prop[0]][prop[1]];
    prefs.push(pref);
    createRow(pref.prop.replace(".", "_"), pref.path, JSON.stringify(pref, (key, val) => (key !== "func") ? val : decodeURIComponent(val)), pref.disable);
    filesMap.delete(`${pref.path}?${pref.prop}`);
    UcfPrefs.writeJSON();
};
const deletePref = async (prefs = [], path, elm, nowrite) => {
    elm?.remove();
    prefs.findIndex((pref, ind) => {
        if (pref.path === path) {
            prefs.splice(ind, 1);
            return true;
        }
    });
    if (!nowrite)
       await UcfPrefs.writeJSON();
};
const handleClick = ({target, currentTarget}) => {
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
                    row.children[3].value = JSON.stringify(pref, (key, val) => (key !== "func") ? val : decodeURIComponent(val));
                    return true;
                }
            });
            UcfPrefs.writeJSON();
            break;
        case "save":
            try {
                let pref = JSON.parse(row.children[3].value, (key, val) => (key !== "func") ? val : encodeURIComponent(val));
                if (!window[pref.prop.replace(".", "_")].classList.contains(path.match(/\.(css|js|mjs)$/)[1]))
                    throw null;
                pref.path ||= path;
                deletePref(prefs, path, null, true);
                addPref(pref);
                if (row.matches("#allfiles > :scope")) row.removeAttribute("unconnected");
                else row.remove();
            } catch {
                row.setAttribute("error", "true");
            }
            break;
        case "del":
            deletePref(prefs, path, row);
            initOptions();
            break;
    }
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
    else
        sec.onclick = e => handleClick(e);
    for (let pref of prefs) {
        var {path} = pref;
        filesMap.delete(path);
        filesMap.delete(`${path}?${id}`);
        if (!allFilesMap.has(path) && !/\.mjs$/.test(path)) {
            await deletePref(prefs, path);
            return;
        }
        createRow(_id, path, JSON.stringify(pref, (key, val) => (key !== "func") ? val : decodeURIComponent(val)), pref.disable);
    }
};
const createInp = (val, cls, type, img) => {
    let inp = document.createElement("input");
    inp.className = cls;
    inp.setAttribute("type", type);
    if (type === "checkbox") inp.checked = !val;
    else inp.value = val || "";
    if (img) inp.src = img;
    return inp;
};
const createRow = (id, val1, val2, disable, atr = {}) => {
    var tr = document.createElement("div");
    tr.className = "row";
    tr.append(createInp(disable, "enable", "checkbox"));
    tr.append(createInp(val1, "path", "text"));
    tr.append(createInp("", "save", "image", `${chromeUrl}svg/save.svg`));
    tr.append(createInp(val2, "pref", "text"));
    tr.append(createInp("", "del", "image", `${chromeUrl}svg/delete.svg`));
    for (let p in atr)
        tr.setAttribute(p, atr[p]);
    window[id].append(tr);
    return tr;
};
const initOptions = () => {
    filesMap.clear();
    allFilesMap.clear();
    var dir = Services.dirsvc.get("UChrm", Ci.nsIFile);
    dir.append("user_chrome_files");
    var rootpath = "", stp = "custom_styles", scp = "custom_scripts";
    var search = (file, sp) => {
        var fileExt;
        if (file.isDirectory())
            for(let f of file.directoryEntries)
                search(f, sp);
        else if ((sp === stp && (fileExt = "css") && /\.css$/.test(file.leafName))
            || (sp === scp && (((fileExt = "js") && /\.js$/.test(file.leafName)) || ((fileExt = "mjs") && /\.mjs$/.test(file.leafName))))) {
            let path = file.path.replace(rootpath, "").replace(/^(\\|\/)/, "").replace(/\\/g, "/");
            let str = Cu.readUTF8URI(Services.io.newURI(`chrome://user_chrome_files/content/${sp}/${path}`));
            if (fileExt === "mjs") path = `%UCFDIR%${path}`;
            if (str = str.match(/@UCF\s@param\s{.+?}\s@UCF/g)) {
                for (let pref of str)
                    try {
                        let p = JSON.parse(pref.match(/@UCF\s@param\s({.+?})\s@UCF/)[1], (key, val) => (key !== "func") ? val : encodeURIComponent(val));
                        p.path = path;
                        let pp = `${path}?${p.prop}`;
                        filesMap.set(pp, p);
                    } catch (e) {Cu.reportError(e);}
            } else
                filesMap.set(path, null);
            allFilesMap.set(path, fileExt);
        }
    };
    dir.append(stp);
    rootpath = dir.path;
    search(dir, stp);
    dir = dir.parent;
    dir.append(scp);
    rootpath = dir.path;
    search(dir, scp);
    createSection(UcfPrefs.prefs.styleschrome, "styleschrome");
    createSection(UcfPrefs.prefs.stylesall, "stylesall");
    createSection(UcfPrefs.prefs.stylescontent, "stylescontent");
    createSection(UcfPrefs.prefs.scriptsbackground, "scriptsbackground");
    createSection(UcfPrefs.prefs.scriptschrome.domload, "scriptschrome.domload");
    createSection(UcfPrefs.prefs.scriptschrome.load, "scriptschrome.load");
    createSection(UcfPrefs.prefs.scriptsallchrome.domload, "scriptsallchrome.domload");
    createSection(UcfPrefs.prefs.scriptsallchrome.load, "scriptsallchrome.load");
    createSection(UcfPrefs.prefs.scriptscontent.DOMWindowCreated, "scriptscontent.DOMWindowCreated");
    createSection(UcfPrefs.prefs.scriptscontent.DOMContentLoaded, "scriptscontent.DOMContentLoaded");
    createSection(UcfPrefs.prefs.scriptscontent.pageshow, "scriptscontent.pageshow");
    createSection([], "allfiles");
    for (let [path, pref] of filesMap)
        try {
            if (pref) addPref(pref);
            else {
                let base;
                if (/\.js$/.test(path)) base = baseJS;
                else if (/\.css$/.test(path)) base = baseCSS;
                else base = baseMJS;
                base.path = path;
                createRow("allfiles", path, JSON.stringify(base), true, {unconnected: "true"});
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
    document.querySelector("#restart").onclick = () => UcfPrefs.restartApp();
    document.querySelector("#restart_no_cache").onclick = () => UcfPrefs.restartApp(true);
    document.querySelector("#homepage").onclick = () => UcfPrefs.openHavingURI(window, "https://github.com/VitaliyVstyle/VitaliyVstyle.github.io/tree/main/UserChromeFiles");
    initOptions();
    window.addEventListener("input", handleInput);
    window.addEventListener("unload", () => {
        window.removeEventListener("input", handleInput);
        l10n.disconnectRoot(document.documentElement);
        UcfPrefs._options_open = false;
    }, { once: true });
};
initLoad();
