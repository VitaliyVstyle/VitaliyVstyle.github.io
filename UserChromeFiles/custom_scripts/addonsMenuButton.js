/**
@UCF @param {"prop":"JsBackground"} @UCF
*/
(async (
    id = "ucf-aom-button",
    label = "Add-ons",
    tooltiptext = "Left-click: Add-ons menu\nMidle-click: Debugging add-ons\nRight-click: Open Add-ons Manager",
    image = "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><path style='fill:none;stroke:context-fill rgb(142, 142, 152);stroke-opacity:context-fill-opacity;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;' d='M12.9 15.3H3.2c-.88 0-1.6-.6-1.6-1.4v-2.7c0-.4.33-.6.74-.6h1.72c.7 0 1.25-.64 1.25-1.2 0-.64-.55-1.15-1.25-1.15H2.34c-.41 0-.74-.32-.74-.68V5.84c0-.81.72-1.48 1.6-1.48h2.36V3.13c0-1.21.93-2.297 2.21-2.419C9.23.57 10.5 1.62 10.5 2.98v1.38h2.4c.9 0 1.5.67 1.5 1.48v8.06c0 .8-.6 1.4-1.5 1.4z'/></svg>",
    checkbox_img = "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' height='16' width='16' viewBox='0 0 16 16'><path d='M 3,7 7,11 13,5' style='fill:none;stroke:white;stroke-width:1;'/></svg>",
    show_version = true,
    show_description = true,
    user_permissions = true,
    show_hidden = true,
    show_disabled = true,
    enabled_first = true,
    exceptions_listset = new Set([

    ]),
    exceptions_type_listset = new Set([

    ]),
    locale1 = "Permissions:",
    locale2 = "Left-click: Settings",
    locale3 = "Ctrl+Left-click: Copy ID",
    locale4 = "Shift+Left-click: Copy UUID",
    locale5 = "Ctrl+Shift+Left-click: Author",
    locale6 = "Midle-click: Home page",
    locale7 = "Ctrl+Midle-click: Viewing the source",
    locale8 = "Shift+Midle-click: Viewing the source in the tab\nRight-click: Enable/Disable",
    locale9 = "Ctrl+Right-click: Remove",
    locale10 = "in the clipboard!",
    locale11 = "Delete",
) => CustomizableUI.createWidget({
    id,
    label,
    tooltiptext,
    type: "custom",
    localized: false,
    defaultArea: CustomizableUI.AREA_NAVBAR,
    onBuild(doc) {
        var btn = doc.createXULElement("toolbarbutton");
        var props = {
            id,
            label,
            context: "",
            tooltiptext,
            type: "menu",
            class: "toolbarbutton-1 chromeclass-toolbar-additional",
        };
        for (let p in props)
            btn.setAttribute(p, props[p]);
        btn.onclick = e => {
            if (e.button == 1) e.view.switchToTabHavingURI("about:debugging#/runtime/this-firefox", true, { ignoreFragment: "whenComparing", triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(), });
            else if (e.button == 2) {
                let win = e.view, viewID = "addons://list/extension";
                if ("openAddonsMgr" in win.BrowserAddonUI) win.BrowserAddonUI.openAddonsMgr(viewID);
                else win.BrowserOpenAddonsMgr(viewID);
            }
        };
        var mp = doc.createXULElement("menupopup");
        mp.id = `${id}-popup`;
        mp.oncontextmenu = e => {
            e.preventDefault();
            e.stopPropagation();
        };
        mp.addEventListener("popupshowing", e => this.populateMenu(e));
        btn.append(mp);
        var btnstyle = `data:text/css;charset=utf-8,${encodeURIComponent(`
#${id} {
list-style-image: url("${this.imageURL}") !important;
}
#${id}-popup menuitem {
fill: currentColor;
fill-opacity: .8;
--menuitem-icon: url("${this.imageURL}") !important;
list-style-image: url("${this.imageURL}") !important;
&::after {
display: flex !important;
content: "" !important;
height: 16px !important;
width: 16px !important;
padding: 0 !important;
border: 1px solid #0074e8 !important;
border-radius: 0 !important;
background-repeat: no-repeat !important;
background-position: center !important;
background-size: 16px !important;
background-color: #0074e8 !important;
background-image: url("${checkbox_img}") !important;
opacity: 1 !important;
}
&.ucf-disabled::after {
border-color: currentColor !important;
background-color: transparent !important;
background-image: none !important;
opacity: .25 !important;
}
&.ucf-disabled > label,
&.ucf-notoptions > label {
opacity: .6 !important;
}
&.ucf-system > label {
text-decoration: underline !important;
text-decoration-style: dotted !important;
}
& > label {
margin-inline-end: 0 !important;
}
& > label:last-child, & > :last-child {
display: flex !important;
padding: 4px !important;
margin: 0 !important;
opacity: 1 !important;
}
& > :last-child > * {
display: none !important;
}
& > :last-child::after {
display: flex !important;
content: "" !important;
height: 8px !important;
width: 8px !important;
border-radius: 4px !important;
background-color: transparent !important;
font-size: 0 !important;
}
&.ucf-type-dictionary > :last-child::after {
background-color: #e31b5d !important;
}
&.ucf-type-locale > :last-child::after {
background-color: #27ae81 !important;
}
&.ucf-type-theme > :last-child::after {
background-color: #f38525 !important;
}
}`)}`;
        try {
            let win = doc.defaultView;
            win.windowUtils.loadSheetUsingURIString(btnstyle, win.windowUtils.USER_SHEET);
        } catch {}
        return btn;
    },
    get imageURL() {
        Services.io.getProtocolHandler("resource")
            .QueryInterface(Ci.nsIResProtocolHandler)
            .setSubstitution(id, Services.io.newURI(image));
        delete this.imageURL;
        return this.imageURL = `resource://${id}`;
    },
    get AlertNotification() {
        delete this.AlertNotification;
        return this.AlertNotification = Components.Constructor("@mozilla.org/alert-notification;1", "nsIAlertNotification", "initWithObject");
    },
    get showAlert() {
        delete this.showAlert;
        var alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
        var {imageURL} = this;
        if (!("showAlertNotification" in alertsService))
            return this.showAlert = (title, text) => alertsService.showAlert(new this.AlertNotification({imageURL, title, text}));
        return this.showAlert = alertsService.showAlertNotification.bind(null, imageURL);
    },
    get clipboardHelp() {
        delete this.clipboardHelp;
        return this.clipboardHelp = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
    },
    get exceptions_type_listarr() {
        delete this.exceptions_type_listarr;
        var arr = ["extension", "theme", "locale", "dictionary"];
        if (!exceptions_type_listset.size) return this.exceptions_type_listarr = arr;
        return this.exceptions_type_listarr = arr.filter(type => !exceptions_type_listset.has(type));
    },
    async populateMenu(e) {
        var popup = e.target, doc = e.view.document;
        var addons = await AddonManager.getAddonsByTypes(this.exceptions_type_listarr);
        var addonsMap = new WeakMap();
        var setAttributesMenu = (mi, addon, extension) => {
            var permissions, uuid;
            var props = {
                label: `${addon.name} ${show_version ? addon.version : ""}`,
                class: "menuitem-iconic",
                tooltiptext: `${(show_description && addon.description) ? `${addon.description}\n` : ""}ID: ${addon.id}${addon.isActive && (uuid = extension?.uuid) ? `\nUUID: ${uuid}` : ""}${(user_permissions && (permissions = addon.userPermissions?.permissions)?.length) ? `\n${locale1} ${permissions.join(", ")}` : ""}\n${addon.optionsURL ? `\n${locale2}` : ""}\n${locale3}${uuid ? `\n${locale4}` : ""}${addon.creator?.url ? `\n${locale5}` : ""}${addon.homepageURL ? `\n${locale6}` : ""}${!addon.isBuiltin ? `\n${locale7}` : ""}\n${locale8}${(!addon.isSystem && !addon.isBuiltin) ? `\n${locale9}` : ""}`,
            };
            for (let p in props)
                mi.setAttribute(p, props[p]);
            if (addon.iconURL) mi.setAttribute("image", addon.iconURL);
            var cls = mi.classList;
            addon.isActive ? cls.remove("ucf-disabled") : cls.add("ucf-disabled");
            addon.optionsURL ? cls.remove("ucf-notoptions") : cls.add("ucf-notoptions");
            addon.isSystem ? cls.add("ucf-system") : cls.remove("ucf-system");
            cls.add(`ucf-type-${addon.type}`);
        };
        var { GlobalManager } = ExtensionParent;
        addons.filter(a => !a.getResourceURI().spec.startsWith("resource://search-extensions/")).sort((a, b) => {
            var ka = `${(enabled_first ? a.isActive ? "0" : "1" : "")}${a.type || ""}${a.name.toLowerCase()}`;
            var kb = `${(enabled_first ? b.isActive ? "0" : "1" : "")}${b.type || ""}${b.name.toLowerCase()}`;
            return (ka < kb) ? -1 : 1;
        }).forEach(addon => {
            if (!exceptions_listset.has(addon.id) &&
                (!addon.hidden || show_hidden) &&
                (!addon.userDisabled || show_disabled)) {
                let extension = GlobalManager.extensionMap.get(addon.id),
                mi = doc.createXULElement("menuitem");
                setAttributesMenu(mi, addon, extension);
                mi._Addon = addon;
                mi._Extension = extension;
                popup.append(mi);
                addonsMap.set(addon, mi);
            }
        });
        var click = e => {
            e.preventDefault();
            e.stopPropagation();
            this.handleClick(e);
        };
        popup.addEventListener("click", click);
        var listener = {
            onEnabled: addon => {
                var mi = addonsMap.get(addon);
                if (mi) setAttributesMenu(mi, addon, mi._Extension);
            },
            onDisabled: addon => {
                listener.onEnabled(addon);
            },
            onInstalled: addon => {
                var extension = GlobalManager.extensionMap.get(addon.id),
                mi = doc.createXULElement("menuitem");
                setAttributesMenu(mi, addon, extension);
                mi._Addon = addon;
                mi._Extension = extension;
                popup.prepend(mi);
                addonsMap.set(addon, mi);
            },
            onUninstalled: addon => {
                var mi = addonsMap.get(addon);
                if (mi) {
                    mi.remove();
                    addonsMap.delete(addon);
                }
            },
        };
        AddonManager.addAddonListener(listener);
        popup.addEventListener("popuphiding", () => {
            AddonManager.removeAddonListener(listener);
            popup.removeEventListener("click", click);
            addonsMap = null;
            for (let item of popup.querySelectorAll("menuitem"))
                item.remove();
        }, { once: true });
    },
    handleClick(e) {
        var win = e.view, mi = e.target;
        if (!("_Addon" in mi) || !("_Extension" in mi)) return;
        var addon = mi._Addon, extension = mi._Extension;
        switch (e.button) {
            case 0:
                if (e.getModifierState("Control") && e.shiftKey) {
                    if (addon.creator?.url) win.gBrowser.selectedTab = this.addTab(win, addon.creator.url);
                } else if (e.getModifierState("Control")) {
                    this.clipboardHelp.copyString(addon.id);
                    win.setTimeout(() => this.showAlert(`ID ${locale10}`, addon.id), 100);
                } else if (e.shiftKey) {
                    if (extension?.uuid) {
                        this.clipboardHelp.copyString(extension.uuid);
                        win.setTimeout(() => this.showAlert(`UUID ${locale10}`, extension.uuid), 100);
                    }
                } else if (addon.isActive && addon.optionsURL) this.openAddonOptions(addon, win);
                win.closeMenus(mi);
                break;
            case 1:
                if (e.getModifierState("Control")) {
                    if (!addon.isBuiltin) this.browseDir(addon);
                } else if (e.shiftKey) this.browseDir(addon, win);
                else if (addon.homepageURL) win.gBrowser.selectedTab = this.addTab(win, addon.homepageURL);
                win.closeMenus(mi);
                break;
            case 2:
                if (!e.getModifierState("Control")) {
                    let {userDisabled} = addon;
                    addon[userDisabled ? "enable" : "disable"]({allowSystemAddons: true});
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
                            break;
                    }
                } else if (!addon.isSystem && !addon.isBuiltin) {
                    win.closeMenus(mi);
                    if (Services.prompt.confirm(win, null, `${locale11} ${addon.name}?`)) addon.uninstall();
                }
                break;
        }
    },
    openAddonOptions(addon, win) {
        switch (addon.optionsType) {
            case 5:
                let viewID = `addons://detail/${encodeURIComponent(addon.id)}/preferences`;
                if ("openAddonsMgr" in win.BrowserAddonUI) win.BrowserAddonUI.openAddonsMgr(viewID);
                else win.BrowserOpenAddonsMgr(viewID);
                break;
            case 3:
                win.switchToTabHavingURI(addon.optionsURL, true);
                break;
        }
    },
    browseDir(addon, win) {
        try {
            if (!win) {
                let file = Services.io.getProtocolHandler("file")
                .QueryInterface(Ci.nsIFileProtocolHandler)
                .getFileFromURLSpec(addon.getResourceURI().QueryInterface(Ci.nsIJARURI).JARFile.spec);
                if (file.exists()) file.launch();
            } else win.gBrowser.selectedTab = this.addTab(win, addon.getResourceURI().spec);
        } catch {}
    },
    addTab(win, url, params = {}) {
        params.triggeringPrincipal = Services.scriptSecurityManager.getSystemPrincipal();
        params.index = params.tabIndex = win.gBrowser.selectedTab._tPos + 1;
        return win.gBrowser.addTab(url, params);
    },
}))();
