const lazy = {}
export class UcfWinActorParent extends JSWindowActorParent {
    receiveMessage() {
        return lazy._prefs ??= this.browsingContext.top.embedderElement.ownerGlobal.UcfPrefs._CssJsContent;
    }
}
