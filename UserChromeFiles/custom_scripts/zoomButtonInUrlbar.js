/**
@UCF @param {"prop":"JsBackground"} @UCF
*/
(async (
    fullZoomPref = "browser.zoom.full",
    siteSpecificPref = "browser.zoom.siteSpecific",
    zoomBtnId = "urlbar-zoom-button",
    // -- User Settings -->
    id = "ucf-zoom-button",
    title = "Zoom Button",
    tooltip = `Left-click: Toggle ${fullZoomPref}\nMidle-click: Toggle ${siteSpecificPref}\nMidle-wheel: Change Zoom\nShift+Midle-wheel: Change default Zoom\nRight-click: Reset Zoom\nShift+Right-click: Reset default Zoom`,
    selector = "#star-button-box",
    badged = true,
    hideDefaultButton = true,
    // <-- User Settings --
) => PageActions.addAction(new PageActions.Action({
    id,
    title,
    tooltip,
    urlbarIDOverride: id,
    _urlbarNodeInMarkup: true,
    pinnedToUrlbar: true,
    onBeforePlacedInWindow(win) {
        var { document } = win;
        var node = document.querySelector(`#page-action-buttons > ${selector}`);
        if (!node) return;
        var btn = document.createXULElement("toolbarbutton");
        btn.id = id;
        btn.tooltipText = tooltip;
        btn.setAttribute("label", `${Math.round(win.ZoomManager.zoom * 100)}%`);
        if (badged) {
            btn.setAttribute("badged", "true");
            win.ZoomUI.getGlobalValue().then(val => btn.setAttribute("badge", Math.round(val * 100)));
            let { onContentPrefSet } = win.FullZoom;
            win.FullZoom.onContentPrefSet = function (group, name, val) {
                if (!group) btn.setAttribute("badge", Math.round(val * 100));
                return onContentPrefSet.apply(this, arguments);
            };
        }
        btn.setAttribute("useFullZoom", win.ZoomManager.useFullZoom);
        btn.setAttribute("siteSpecific", win.FullZoom.siteSpecific);
        var uzbtn = node.id !== zoomBtnId ? node.parentElement.querySelector(`#${zoomBtnId}`) : node;
        var desc = Object.getOwnPropertyDescriptor(XULElement.prototype, "hidden");
        var { set } = desc;
        desc.set = async val => {
            btn.setAttribute("label", `${Math.round(win.ZoomManager.zoom * 100)}%`);
            set.call(uzbtn, val);
        };
        Object.defineProperty(uzbtn, "hidden", desc);
        var { observe } = win.FullZoom;
        win.FullZoom.observe = function (subject, topic, data) {
            var func = observe.apply(this, arguments);
            switch (data) {
                case fullZoomPref:
                    btn.setAttribute("useFullZoom", win.ZoomManager.useFullZoom);
                    break;
                case siteSpecificPref:
                    btn.setAttribute("siteSpecific", this.siteSpecific);
                    break;
            }
            return func;
        };
        btn.onclick = e => {
            e.stopPropagation();
            switch (e.button) {
                case 0:
                    win.ZoomManager.toggleZoom();
                    break;
                case 1:
                    Services.prefs.setBoolPref(siteSpecificPref, !Services.prefs.getBoolPref(siteSpecificPref));
                    break;
                case 2:
                    if (e.shiftKey) win.FullZoom._cps2.setGlobal(win.FullZoom.name, 1, Cu.createLoadContext());
                    win.FullZoom.reset();
                    break;
            }
        };
        btn.onwheel = e => {
            e.stopPropagation();
            if (e.deltaY > 0) win.FullZoom.reduce();
            else win.FullZoom.enlarge();
            if (e.shiftKey) win.FullZoom._cps2.setGlobal(win.FullZoom.name, win.ZoomManager.zoom, Cu.createLoadContext());
        };
        var style = `data:text/css;charset=utf-8,${encodeURIComponent(
            `#page-action-buttons > #${id} {
appearance: none !important;
font-size: .8em !important;
font-weight: normal !important;
padding: 0 !important;
border-radius: var(--urlbar-icon-border-radius, 0) !important;
background-color: var(--urlbar-box-bgcolor, color-mix(in srgb, currentColor 16%, transparent)) !important;
color: var(--urlbar-box-text-color, inherit) !important;
margin: 0 !important;
align-self: stretch !important;
align-items: center !important;
justify-content: stretch !important;
overflow: hidden !important;
min-width: 3.5em !important;
.toolbarbutton-icon {
display: none !important;
}
.toolbarbutton-text {
display: flex !important;
justify-content: center !important;
margin: 0 !important;
padding: 0 !important;
}
&[useFullZoom=false] {
font-weight: bold !important;
}
&[siteSpecific=false]:not([badged]) .toolbarbutton-text {
text-decoration-line: underline !important;
text-decoration-style: solid !important;
text-decoration-color: currentColor !important;
text-decoration-thickness: 1px !important;
text-decoration-skip-ink: none !important;
text-underline-offset: .2em !important;
}
&[badged] {
display: grid !important;
position: relative !important;
& > * {
grid-area: 1 / 1 !important;
z-index: 0 !important;
}
stack {
display: flex !important;
align-self: start !important;
justify-self: end !important;
z-index: 1 !important;
.toolbarbutton-badge {
background: #0074e8 !important;
color: #ffffff !important;
border-radius: var(--urlbar-icon-border-radius, 0) !important;
font-size: 10px !important;
font-weight: normal !important;
line-height: 10px !important;
box-shadow: none !important;
text-shadow: none !important;
margin: 0 !important;
padding: 1px !important;
min-width: 0 !important;
}
}
&[siteSpecific=false] stack .toolbarbutton-badge {
font-weight: bold !important;
}
.toolbarbutton-text {
justify-content: start !important;
padding-inline-start: 2px !important;
}
}
}
${hideDefaultButton ? `#${zoomBtnId} {
display: none !important;
}` : ""}`)}`;
        win.windowUtils.loadSheetUsingURIString(style, win.windowUtils.AGENT_SHEET);
        node.after(btn);
    },
})))();
