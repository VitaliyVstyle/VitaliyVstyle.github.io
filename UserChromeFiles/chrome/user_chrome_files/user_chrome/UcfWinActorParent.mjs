const lazy = {}
export class UcfWinActorParent extends JSWindowActorParent {
    receiveMessage({name, data}) {
        if (name === "UcfWinActor:Event")
            return lazy.prefs ??= this.browsingContext.top.embedderElement.ownerGlobal.UcfPrefs._CssJsContent;
        try {
            let {ucfobj, id, fname} = data;
            return this.browsingContext.top.embedderElement.ownerGlobal[ucfobj][id][fname](data);
        } catch {}
    }
}
