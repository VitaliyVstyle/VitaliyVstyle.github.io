export class UcfCustomStylesScriptsParent extends JSWindowActorParent {
    receiveMessage({data}) {
        try {
            let {_stylescontent, _scriptscontent} = this.browsingContext.top.embedderElement.ownerGlobal.UcfPrefs;
            this.sendAsyncMessage("UcfCustomStylesScriptsActor:events", {type: data.type, prefs: {_stylescontent, _scriptscontent}});
        } catch(ex) {Cu.reportError(ex);}
    }
}
