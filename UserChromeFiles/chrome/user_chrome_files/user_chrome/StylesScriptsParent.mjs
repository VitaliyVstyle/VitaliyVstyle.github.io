export class UcfCustomStylesScriptsParent extends JSWindowActorParent {
    receiveMessage({data}) {
        try {
            let {_CssContent, _JsContent} = this.browsingContext.top.embedderElement.ownerGlobal.UcfPrefs;
            this.sendAsyncMessage("UcfCustomStylesScriptsActor:events", {type: data.type, prefs: {_CssContent, _JsContent}});
        } catch {}
    }
}
