/**
@UCF @param {"prop":"JsBackground"} @UCF
*/
(async (
    id = "ucf-aom-button",
    label = "Add-ons",
    tooltiptext = "Add-ons menu",
    image = (size = "width='16' height='16'") => `data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' ${size} viewBox='0 0 16 16'><path style='fill:none;stroke:context-fill rgb(142, 142, 152);stroke-opacity:context-fill-opacity;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;' d='M12.9 15.3H3.2c-.88 0-1.6-.6-1.6-1.4v-2.7c0-.4.33-.6.74-.6h1.72c.7 0 1.25-.64 1.25-1.2 0-.64-.55-1.15-1.25-1.15H2.34c-.41 0-.74-.32-.74-.68V5.84c0-.81.72-1.48 1.6-1.48h2.36V3.13c0-1.21.93-2.297 2.21-2.419C9.23.57 10.5 1.62 10.5 2.98v1.38h2.4c.9 0 1.5.67 1.5 1.48v8.06c0 .8-.6 1.4-1.5 1.4z'/></svg>`,
    opts_img = "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' height='16' width='16' viewBox='0 0 16 16'><g style='fill:none;stroke:context-fill rgb(142, 142, 152);stroke-opacity:context-fill-opacity;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;'><path d='M8.66 15.4h-1.2c-.69 0-1.3-.5-1.5-1.2L5.58 13c-.26-.1-.51-.3-.76-.5l-1.41.4c-.65.1-1.37-.1-1.72-.8l-.6-.9c-.342-.7-.252-1.45.22-1.87l1-1v-.81l-.99-.97C.842 6.06.748 5.36 1.1 4.78l.6-.98c.34-.58 1.05-.87 1.7-.72l1.44.32c.26-.16.5-.3.74-.41l.38-1.27c.2-.64.81-1.089 1.5-1.091h1.2c.69 0 1.28.441 1.34 1.071l.4 1.3c.3.11.5.25.8.4l1.3-.32c.7-.15 1.5.14 1.8.72l.6.98c.4.57.3 1.28-.2 1.77l-1 .97v.81l1 1c.5.42.6 1.17.2 1.87l-.6.9c-.3.7-1.1.9-1.8.8l-1.3-.4c-.3.2-.5.4-.8.5l-.4 1.2c-.1.7-.64 1.2-1.34 1.2'/><circle cx='8' cy='8' r='2.4'/></g></svg>",
    copy_img = "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><path style='fill:none;stroke:context-fill rgb(142, 142, 152);stroke-opacity:context-fill-opacity;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;' d='M6 .5h6c.8 0 1.5.7 1.5 1.5v10c0 .8-.7 1.5-1.5 1.5H6c-.8 0-1.5-.7-1.5-1.5V2c0-.8.7-1.5 1.5-1.5m5.5 15H5c-1.5 0-2.5-1-2.5-2.5V2.5'/></svg>",
    open_img = "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><path style='fill:none;stroke:context-fill rgb(142, 142, 152);stroke-opacity:context-fill-opacity;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;' d='M8 1 .6 8.4h1v5c0 1 1 2 2 2h8.8c1 0 2-1 2-2v-5h1zm2.4 14v-4c0-3.2-4.8-3.2-4.8 0v4'/></svg>",
    view_img = "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><path style='fill:none;stroke:context-fill rgb(142, 142, 152);stroke-opacity:context-fill-opacity;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;' d='m5.5 14.5 5-13m-7 10-3-3 3-3m9 0 3 3-3 3'/></svg>",
    uninstall_img = "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><path style='fill:none;stroke:context-fill rgb(227, 27, 93);stroke-opacity:context-fill-opacity;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;' d='M4.5 1.5v1m6 0H1c-.6 0-.6 1 0 1h.5V9c0 4 1.5 6.5 2.5 6.5h7c1 0 2.5-2.5 2.5-6.5V3.5h.5c.6 0 .6-1 0-1zm0 0v-1c0-.5-.5-1-1-1h-4c-.5 0-1 .5-1 1m0 4v7m3-7v7m3-7v7'/></svg>", show_version = true,
    show_description = true,
    user_permissions = true,
    show_hidden = true,
    show_disabled = true,
    show_default_icon = true,
    max_width_main_item = 16,
    max_height_popup,
    enabled_first = true,
    exceptions_ids_listset = new Set([

    ]),
    exceptions_type_listset = new Set([

    ]),
    locale1 = "Description:",
    locale2 = "Permissions:",
    locale3 = "L: Settings",
    locale4 = "R: Control",
    locale5 = "L: Copy ID",
    locale6 = "R: Copy UUID",
    locale7 = "L: Home page",
    locale8 = "R: Author",
    locale9 = "L: Viewing the source",
    locale10 = "R: Viewing the source in external application",
    locale11 = "Enable/Disable",
    locale12 = "Uninstall",
    locale13 = "in the clipboard!",
    locale14 = "Add-ons Manager",
    locale15 = "L: Add-ons Manager\nR: Check for Add-ons updates",
    locale16 = "Debugging Add-ons",
) => CustomizableUI.createWidget({
    id, label, tooltiptext, type: "custom", localized: false, defaultArea: CustomizableUI.AREA_NAVBAR,
    onBuild(doc) {
        var btn = doc.createXULElement("toolbarbutton");
        var props = {
            id, label, tooltiptext, type: "menu", class: "toolbarbutton-1 chromeclass-toolbar-additional",
        };
        for (let p in props)
            btn.setAttribute(p, props[p]);
        var mp = doc.createXULElement("menupopup");
        mp.id = `${id}-popup`;
        mp.setAttribute("flip", "both");
        mp.setAttribute("position", "after_end");
        mp.oncontextmenu = e => {
            e.preventDefault();
            e.stopPropagation();
        };
        mp.addEventListener("popupshowing", e => this.populateMenu(e));
        btn.append(mp);
        var btnstyle = `data:text/css;charset=utf-8,${encodeURIComponent(`
#${id} {
list-style-image: url("${this.image}") !important;
}
#${id}-popup {${max_height_popup ? `
max-height: ${max_height_popup}em !important;` : ""}
&>menugroup {
display: flex !important;
flex-direction: row !important;
padding: 0 !important;
margin: 0 !important;
&:hover {
background-color: color-mix(in srgb, currentColor 10%, transparent);
border-radius: var(--menuitem-border-radius, calc(var(--panel-border-radius, 0px) / 2));
}
&>menuitem {
max-width: none !important;
fill: currentColor;
fill-opacity: .8;
margin-inline: 0 !important;
padding-inline: max(6px, .35em) !important;
&:not([iname=main],[iname=manager],[iname=debugging]) {
flex: 0 !important;
&>.menu-icon, &>.menu-iconic-left {
margin-inline: 0 !important;
}
&>label, &>.menu-accel-container {
display: none !important;
}
}
&[iname=manager], &[iname=debugging] {
max-width: 0 !important;
min-width: calc(100% / 2) !important;
}
&[iname=toogle]>.menu-icon {
display: revert !important;
}
&[iname=main] {
padding-inline: 0 !important;
flex: 1 !important;
max-width: ${max_width_main_item}em !important;
${show_default_icon ? `--menuitem-icon: url("${this.image}") !important;
list-style-image: url("${this.image}") !important;
&>:is(.menu-icon,.menu-iconic-left) {
margin-inline-start: 0 !important;
}` : `&:not([image])>:is(.menu-icon,.menu-iconic-left) {
display: none !important;
}`}
&::after {
display: flex !important;
content: "" !important;
height: 8px !important;
width: 8px !important;
border-radius: 4px !important;
background-color: transparent !important;
opacity: 1 !important;
}
}
&[iname=uninstall] {
fill: color-mix(in srgb, currentColor 20%, #e31b5d) !important;
&[disabled]:not([disabled=false]) {
opacity: .4 !important;
}
}
&[disabled]:not([disabled=false]) {
opacity: .6 !important;
}
}
&.ucf-type-dictionary>menuitem[iname=main]::after {
background-color: color-mix(in srgb, currentColor 20%, #e31b5d) !important;
}
&.ucf-type-locale>menuitem[iname=main]::after {
background-color: color-mix(in srgb, currentColor 20%, #27ae81) !important;
}
&.ucf-type-theme>menuitem[iname=main]::after {
background-color: color-mix(in srgb, currentColor 20%, #f38525) !important;
}
&.ucf-type-plugin>menuitem[iname=main]::after {
background-color: color-mix(in srgb, currentColor 20%, #0074e8) !important;
}
&.ucf-type-mlmodel>menuitem[iname=main]::after {
background-color: color-mix(in srgb, currentColor 20%, #f325e2) !important;
}
&.ucf-system>menuitem[iname=main]>label {
text-decoration: underline !important;
text-decoration-style: dotted !important;
}
&.ucf-warning>menuitem[iname=main]>label {
text-decoration: underline !important;
text-decoration-style: dotted !important;
text-decoration-color: color-mix(in srgb, currentColor 20%, #f38525) !important;
}
&.ucf-error>menuitem[iname=main]>label {
text-decoration: line-through !important;
text-decoration-style: solid !important;
text-decoration-color: color-mix(in srgb, currentColor 20%, #e31b5d) !important;
}
&.ucf-options>menuitem[iname=opts] {
fill: color-mix(in srgb, currentColor 20%, #0074e8) !important;
}
}
}`)}`;
        var win = doc.defaultView;
        win.windowUtils.loadSheetUsingURIString(btnstyle, win.windowUtils.USER_SHEET);
        return btn;
    },
    get image() {
        delete this.image;
        return this.image = this.setSubstitution(id, image());
    },
    get imageURL() {
        delete this.imageURL;
        return this.imageURL = image("width='96' height='96'");
    },
    get opts_img() {
        delete this.opts_img;
        return this.opts_img = this.setSubstitution(`${id}_opts_img`, opts_img);
    },
    get copy_img() {
        delete this.copy_img;
        return this.copy_img = this.setSubstitution(`${id}_copy_img`, copy_img);
    },
    get open_img() {
        delete this.open_img;
        return this.open_img = this.setSubstitution(`${id}_open_img`, open_img);
    },
    get view_img() {
        delete this.view_img;
        return this.view_img = this.setSubstitution(`${id}_view_img`, view_img);
    },
    get uninstall_img() {
        delete this.uninstall_img;
        return this.uninstall_img = this.setSubstitution(`${id}_uninstall_img`, uninstall_img);
    },
    get clipboardHelp() {
        delete this.clipboardHelp;
        return this.clipboardHelp = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
    },
    get exceptions_type_listarr() {
        delete this.exceptions_type_listarr;
        var arr = ["extension", "theme", "locale", "dictionary", "plugin", "mlmodel"];
        if (!exceptions_type_listset.size) return this.exceptions_type_listarr = arr;
        return this.exceptions_type_listarr = arr.filter(type => !exceptions_type_listset.has(type));
    },
    setSubstitution(root, img) {
        Services.io.getProtocolHandler("resource")
            .QueryInterface(Ci.nsIResProtocolHandler)
            .setSubstitution(root, Services.io.newURI(img));
        return `resource://${root}`;
    },
    async populateMenu(e) {
        var addons = AddonManager.getAddonsByTypes(this.exceptions_type_listarr);
        var popup = e.target, doc = e.view.document;
        var addonsMap = new Map();
        var createGroup = (addon, extension) => {
            var groop = doc.createXULElement("menugroup");
            var _uuid = (addon.isActive && extension?.uuid) || "";
            for (let [name, tooltip, img, lab, checkbox] of [
                ["toogle", ("userDisabled" in addon) ? locale11 : "", "", "", true],
                ["main", `${addon.name} ${addon.version}\n${(show_description && addon.description) ? `${locale1} ${addon.description}\n` : ""}ID: ${addon.id}\n${_uuid ? `UUID: ${_uuid}\n` : ""}${(user_permissions && addon.userPermissions?.permissions?.length) ? `${locale2} ${addon.userPermissions.permissions.join(", ")}` : ""}`, addon.iconURL, `${addon.name} ${show_version ? addon.version : ""}`],
                ["opts", !addon.isSystem ? `${addon.optionsURL ? `${locale3}\n` : ""}${locale4}` : "", this.opts_img],
                ["open", `${addon.homepageURL ? `${locale7}\n` : ""}${addon.creator?.url ? locale8 : ""}`, this.open_img],
                ["copy", `${locale5}\n${_uuid ? locale6 : ""}`, this.copy_img],
                ["view", ("getResourceURI" in addon) ? `${!addon.isBuiltin ? `${locale9}\n${locale10}` : locale9}` : "", this.view_img],
                ["uninstall", ("uninstall" in addon && !addon.isSystem && !addon.isBuiltin) ? locale12 : "", this.uninstall_img]
            ]) {
                let item = doc.createXULElement("menuitem");
                item.setAttribute("iname", name);
                item.setAttribute("closemenu", "none");
                if (lab) item.label = lab;
                if (img) item.image = img;
                if (checkbox) {
                    item.setAttribute("type", "checkbox");
                    if (addon.isActive) item.setAttribute("checked", true);
                } else item.className = "menuitem-iconic";
                if (tooltip) item.tooltipText = tooltip;
                else item.disabled = true;
                groop.append(item);
            }
            groop.className = `ucf-type-${addon.type}`;
            if (addon.isSystem) groop.classList.add("ucf-system");
            else if (addon.optionsURL) groop.classList.add("ucf-options");
            if (addon.isCorrectlySigned === false) groop.classList.add("ucf-warning");
            if (addon.blocklistState || !addon.isCompatible) groop.classList.add("ucf-error");
            groop._addon = addon;
            groop._extension = extension;
            return groop;
        };
        var { GlobalManager } = ExtensionParent;
        var frag = doc.createDocumentFragment();
        (await addons).filter(a => !a.getResourceURI?.().spec.startsWith("resource://search-extensions/")).sort((a, b) => {
            var ka = `${(enabled_first ? a.isActive ? "0" : "1" : "")}${a.type || ""}${a.name.toLowerCase()}`;
            var kb = `${(enabled_first ? b.isActive ? "0" : "1" : "")}${b.type || ""}${b.name.toLowerCase()}`;
            return (ka < kb) ? -1 : 1;
        }).forEach(addon => {
            if (!exceptions_ids_listset.has(addon.id) &&
                (!addon.hidden || show_hidden) &&
                (addon.isActive || show_disabled)) {
                let extension = GlobalManager.extensionMap.get(addon.id);
                let gp = createGroup(addon, extension);
                frag.append(gp);
                addonsMap.set(addon.id, gp);
            }
        });
        var groop = doc.createXULElement("menugroup");
        for (let [name, tooltip, img, lab] of [
            ["manager", locale15, this.image, locale14],
            ["debugging", locale16, this.view_img, locale16],
        ]) {
            let item = doc.createXULElement("menuitem");
            item.className = "menuitem-iconic";
            item.setAttribute("iname", name);
            item.setAttribute("closemenu", "none");
            item.label = lab;
            item.image = img;
            item.tooltipText = tooltip;
            groop.append(item);
        }
        var sep = doc.createXULElement("menuseparator");
        sep.id = `${id}-separator`;
        frag.prepend(sep);
        frag.prepend(groop);
        popup.append(frag);
        var click = e => {
            e.preventDefault();
            e.stopPropagation();
            this.handleClick(e);
        };
        popup.addEventListener("click", click);
        var listener = {
            onEnabled(addon) {
                var gp = addonsMap.get(addon.id);
                if (gp) {
                    let g = createGroup(addon, gp._extension);
                    gp.replaceWith(g);
                    addonsMap.set(addon.id, g);
                }
            },
            onDisabled(addon) {
                this.onEnabled(addon);
            },
            onInstalled(addon) {
                var g = createGroup(addon, GlobalManager.extensionMap.get(addon.id));
                var gp = addonsMap.get(addon.id);
                if (gp) gp.replaceWith(g);
                else popup.querySelector(`:scope>#${id}-separator`).after(g);
                addonsMap.set(addon.id, g);
            },
            onUninstalled(addon) {
                var gp = addonsMap.get(addon.id);
                if (gp) {
                    gp.remove();
                    addonsMap.delete(addon.id);
                }
            },
        };
        AddonManager.addAddonListener(listener);
        popup.addEventListener("popuphiding", () => {
            AddonManager.removeAddonListener(listener);
            popup.removeEventListener("click", click);
            addonsMap.clear();
            for (let item of popup.querySelectorAll(":scope>*"))
                item.remove();
        }, { once: true });
    },
    handleClick(e) {
        var mi = e.target;
        if (mi.disabled) return;
        var win = e.view, gp = mi.parentElement, addon = gp._addon, extension = gp._extension;
        switch (mi.getAttribute("iname")) {
            case "main":
                if (e.button && !addon.isSystem && addon.optionsURL) this.openAddonOptions(addon, win);
                else if (!("userDisabled" in addon)) return;
            case "toogle": {
                if (e.button) return;
                let { userDisabled } = addon;
                addon[userDisabled ? "enable" : "disable"]({ allowSystemAddons: true });
                switch (addon.id) {
                    case "formautofill@mozilla.org":
                        Services.prefs.setBoolPref("dom.forms.autocomplete.formautofill", userDisabled);
                        break;
                    case "pictureinpicture@mozilla.org":
                        Services.prefs.setBoolPref("extensions.pictureinpicture.enable_picture_in_picture_overrides", userDisabled);
                        break;
                    case "webcompat@mozilla.org":
                    case "webcompat-reporter@mozilla.org":
                        Services.prefs.setBoolPref("extensions.webcompat-reporter.enabled", userDisabled);
                        break;
                    case "screenshots@mozilla.org":
                        Services.prefs.setBoolPref("extensions.screenshots.disabled", !userDisabled);
                }
                break;
            }
            case "opts":
                if (!e.button) this.openAddonOptions(addon, win);
                else {
                    let viewID = `addons://detail/${encodeURIComponent(addon.id)}`;
                    if ("openAddonsMgr" in win.BrowserAddonUI) win.BrowserAddonUI.openAddonsMgr(viewID);
                    else win.BrowserOpenAddonsMgr(viewID);
                }
                break;
            case "copy":
                if (!e.button) {
                    let { imageURL } = this;
                    this.clipboardHelp.copyStringToClipboard(addon.id, Ci.nsIClipboard.kGlobalClipboard);
                    win.setTimeout(() => UcfPrefs.showAlert({ imageURL, title: `ID ${locale13}`, text: addon.id, silent: true }), 100);
                } else if (extension?.uuid) {
                    let { imageURL } = this;
                    this.clipboardHelp.copyStringToClipboard(extension.uuid, Ci.nsIClipboard.kGlobalClipboard);
                    win.setTimeout(() => UcfPrefs.showAlert({ imageURL, title: `UUID ${locale13}`, text: extension.uuid, silent: true }), 100);
                }
                break;
            case "open":
                if (!e.button) {
                    if (addon.homepageURL) win.gBrowser.selectedTab = this.addTab(win, addon.homepageURL);
                } else if (addon.creator?.url) win.gBrowser.selectedTab = this.addTab(win, addon.creator.url);
                break;
            case "view":
                if (!e.button) this.browseDir(addon, win);
                else if (!addon.isBuiltin) this.browseDir(addon);
                break;
            case "uninstall":
                if (e.button) return;
                win.closeMenus(mi);
                if (Services.prompt.confirm(win, null, `${locale12} ${addon.name}?`)) addon.uninstall();
                break;
            case "manager":
                this.openAddonsMgrOrUpdate(win, e.button, mi);
                break;
            case "debugging":
                if (!e.button) win.switchToTabHavingURI("about:debugging#/runtime/this-firefox", true, { ignoreFragment: "whenComparing", triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(), });
        }
    },
    async openAddonsMgrOrUpdate(win, button, mi) {
        var viewID = "addons://list/extension", page;
        if ("openAddonsMgr" in win.BrowserAddonUI) page = await win.BrowserAddonUI.openAddonsMgr(viewID);
        else page = await win.BrowserOpenAddonsMgr(viewID);
        if (!button || !page) return;
        win.closeMenus(mi);
        var updateBtn = page.document.querySelector("[action=\"check-for-updates\"]");
        if (updateBtn && !updateBtn.disabled) updateBtn.click();
    },
    openAddonOptions(addon, win) {
        switch (addon.optionsType) {
            case 5: {
                let viewID = `addons://detail/${encodeURIComponent(addon.id)}/preferences`;
                if ("openAddonsMgr" in win.BrowserAddonUI) win.BrowserAddonUI.openAddonsMgr(viewID);
                else win.BrowserOpenAddonsMgr(viewID);
                break;
            }
            case 3:
                win.switchToTabHavingURI(addon.optionsURL, true);
                break;
            case 1: {
                let wins = Services.wm.getEnumerator(null);
                while (wins.hasMoreElements()) {
                    let w = wins.getNext();
                    if (!w.closed && w.document.documentURI === addon.optionsURL) return w.focus();
                }
                win.openDialog(addon.optionsURL, addon.id, `chrome,titlebar,toolbar,centerscreen${Services.prefs.getBoolPref("browser.preferences.instantApply", false) ? ",dialog=no" : ""}`);
            }
        }
    },
    browseDir(addon, win) {
        if (win) win.gBrowser.selectedTab = this.addTab(win, addon.getResourceURI().spec);
        else {
            let file = Services.io.getProtocolHandler("file")
                .QueryInterface(Ci.nsIFileProtocolHandler)
                .getFileFromURLSpec(addon.getResourceURI().QueryInterface(Ci.nsIJARURI).JARFile.spec);
            if (file.exists()) file.launch();
        }
    },
    addTab(win, url, params = {}) {
        params.triggeringPrincipal = Services.scriptSecurityManager.getSystemPrincipal();
        params.index = params.tabIndex = win.gBrowser.selectedTab._tPos + 1;
        return win.gBrowser.addTab(url, params);
    },
}))();
