/**
@UCF @param {"prop":"JsAllChrome.load","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|places))\\.xhtml"} @UCF
@UCF @param {"prop":"JsContent.pageshow","urlregxp":"^chrome:\\/\\/browser\\/content\\/(?:browser|places\\/(?:bookmarksSidebar|places))\\.xhtml"} @UCF
*/
(async (
	label = "Export folder to HTML",
	image = "chrome://global/skin/icons/arrows-updown.svg",
) => ({
	get dps() {
		delete this.dps;
		return this.dps = windowRoot.ownerGlobal.DownloadPaths || ChromeUtils.importESModule("resource://gre/modules/DownloadPaths.sys.mjs").DownloadPaths;
	},
	get exporter() {
		delete this.exporter;
		return this.exporter = windowRoot.ownerGlobal.UcfPrefs.dbg.ref("BookmarkExporter",
			(windowRoot.ownerGlobal.BookmarkHTMLUtils || ChromeUtils.importESModule("resource://gre/modules/BookmarkHTMLUtils.sys.mjs").BookmarkHTMLUtils).exportToFile);
	},
	init() {
		var sep = document.querySelector("#placesContext > #placesContext_openSeparator");
		if (!sep) return;
		var item = document.createXULElement("menuitem");
		item.id = "placesContext_exportFolder";
		item.label = label;
		if (image) {
			item.className = "menuitem-iconic";
			item.style.cssText = `list-style-image:url("${image}");-moz-context-properties:fill;fill:currentColor;`;
		}
		item.setAttribute("selection-type", "single");
		item.setAttribute("node-type", "folder");
		item.onclick = e => this.export(e.currentTarget.parentElement);
		sep.before(item);
	},
	async export(popup) {
		var tn = popup.triggerNode, pu = PlacesUtils, bm = pu.bookmarks, node;
		if (tn.matches("treechildren")) node = popup._view.selectedNode;
		else if (tn.id == "OtherBookmarks") node = {bookmarkGuid: bm.unfiledGuid, title: tn.getAttribute("label")};
		else node = tn._placesNode || popup._view.result.root;
		var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
		fp.init(browsingContext, PlacesUIUtils.promptLocalization.formatValueSync("places-bookmarks-export"), fp.modeSave);
		fp.appendFilters(fp.filterHTML);
		fp.defaultString = `${(node.title ? this.dps.sanitize(node.title) : "untitled")}.html`;
		if (await new Promise(fp.open) !== fp.returnOK) return;
		var tree = await pu.promiseBookmarksTree(pu.getConcreteItemGuid(node), {includeItemIds: true});
		tree.title = bm.getLocalizedTitle(tree);
		var bookmarks = {children: [
			{root: "toolbarFolder"},
			{root: "unfiledBookmarksFolder"},
			{root: "bookmarksMenuFolder", children: [tree], guid: bm.menuGuid}
		]};
		new this.exporter(bookmarks).exportToFile(fp.file.path);
	},
}).init())();
