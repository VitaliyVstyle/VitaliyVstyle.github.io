const lazy = {}
export class UcfWinActorParent extends JSWindowActorParent {
    receiveMessage() {
        return lazy.prefs ??= this.browsingContext.top.embedderElement.ownerGlobal.UcfPrefs._CssJsContent;
    }
}
