/**
@UCF @param {"prop":"JsChrome.load","ucfobj":true} @UCF
*/
(async (
    id = "ucf-favicon-in-urlbar",
    iconDefault = "chrome://global/skin/icons/info.svg",
    handlers = true,
    tooltip = "L: Copy current page address\nM|R: More site information",
    confirmText = "Copied to clipboard!",
) => ({
    init() {
        var style = "data:text/css;charset=utf-8," + encodeURIComponent(`
#${id}-box {
--v-favicon-in-urlbar: url("${iconDefault}");
padding-inline: var(--urlbar-icon-padding, 3px) !important;
align-items: center !important;
background-color: var(--urlbar-box-bgcolor, color-mix(in srgb, currentColor 12%, transparent));
border-radius: var(--urlbar-inner-border-radius, calc(var(--toolbarbutton-border-radius, 1px) - 1px)) !important;
&[busy] {
--v-favicon-in-urlbar: url("${iconDefault}") !important;
}
&:hover {
background-color: var(--urlbar-box-hover-bgcolor, color-mix(in srgb, currentColor 20%, transparent));
}
&:hover:active {
background-color: var(--urlbar-box-active-bgcolor, color-mix(in srgb, currentColor 10%, transparent));
}
#${id}-img {
list-style-image: var(--v-favicon-in-urlbar) !important;
pointer-events: none !important;
height: 16px !important;
width: 16px !important;
-moz-context-properties: fill, fill-opacity;
fill: currentColor;
fill-opacity: var(--urlbar-icon-fill-opacity, 1);
}
}
`);
        windowUtils.loadSheetUsingURIString(style, windowUtils.USER_SHEET);
        var box = document.createXULElement("box");
        box.id = `${id}-box`;
        var img = document.createXULElement("image");
        img.id = `${id}-img`;
        box.append(img);
        gURLBar._inputContainer.prepend(box);
        var { STATE_START, STATE_STOP, STATE_IS_NETWORK } = Ci.nsIWebProgressListener;
        var updatefavicon = (image, isimg) => {
            if (image) box.style.setProperty("--v-favicon-in-urlbar", `url("${image}")`);
            else box.style.removeProperty("--v-favicon-in-urlbar");
            if (isimg && box.hasAttribute("busy")) box.removeAttribute("busy");
        };
        this.handleEvent = e => {
            var tab = e.target, isimg;
            if (tab.selected && ((isimg = e.detail.changed.includes("image")) || e.detail.changed.includes("selected"))) updatefavicon(tab.image, isimg);
        };
        this.onStateChange = (progress, request, flags) => {
            if (flags & STATE_IS_NETWORK && progress?.isTopLevel) {
                if (flags & STATE_START) box.setAttribute("busy", "true");
                else if (flags & STATE_STOP) updatefavicon(gBrowser.selectedTab.image, true);
            }
        };
        setUnloadMap(Symbol(id), this.destructor, this);
        gBrowser.tabContainer.addEventListener("TabAttrModified", this);
        gBrowser.addProgressListener(this);
        if (!handlers) return;
        box.toggleAttribute("context", true);
        box.tooltipText = tooltip;
        var show = Cu.evalInSandbox(
            `(function ${ConfirmationHint.show})`.replace(/(\)\s+{)/, `$1
                var MozXULElement = { insertFTLIfNeeded() {} };
                var document = { l10n: { setAttributes: msg => msg.textContent = "${confirmText}" } };
            `),
            sandboxWinSysPrincipal
        );
        var helper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper);
        box.onclick = e => {
            e.stopPropagation();
            switch (e.button) {
                case 0:
                    helper.copyStringToClipboard(gURLBar.makeURIReadable(gBrowser.selectedBrowser.currentURI).displaySpec, Ci.nsIClipboard.kGlobalClipboard);
                    show.call(ConfirmationHint, box, "", { event: e, hideArrow: true });
                    break;
                case 1:
                case 2:
                    if ("BrowserCommands" in window) BrowserCommands.pageInfo();
                    else BrowserPageInfo();
            }
        };
    },
    destructor() {
        gBrowser.tabContainer.removeEventListener("TabAttrModified", this);
        gBrowser.removeProgressListener(this);
    }
}).init())();
