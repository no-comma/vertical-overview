const { Gio, Meta, Shell, Clutter, GObject, Graphene, St } = imports.gi;
const Main = imports.ui.main;
const AppDisplay = imports.ui.appDisplay;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Util = Self.imports.util;

var SidePages = {
    NONE: 0,
    PREVIOUS: 1 << 0,
    NEXT: 1 << 1,
    DND: 1 << 2,
};

function override() {
    global.vertical_overview.GSFunctions['BaseAppView'] = Util.overrideProto(AppDisplay.BaseAppView.prototype, BaseAppViewOverride);
    
    let appDisplay = Main.overview._overview._controls._appDisplay;

    appDisplay._orientation = Clutter.Orientation.VERTICAL;    
    appDisplay._grid.layoutManager._orientation = Clutter.Orientation.VERTICAL;
    appDisplay._scrollView.set_policy(St.PolicyType.NEVER, St.PolicyType.EXTERNAL);

    appDisplay._hintContainer.opacity = 0;

    appDisplay._box.vertical = false;

    appDisplay._pageIndicators.y_expand = true;
    appDisplay._pageIndicators.vertical = true;
    appDisplay._pageIndicators.y_align = Clutter.ActorAlign.CENTER;
}

function reset() {
    Util.overrideProto(AppDisplay.BaseAppView.prototype, global.vertical_overview.GSFunctions['BaseAppView']);
    
    let appDisplay = Main.overview._overview._controls._appDisplay;

    appDisplay._orientation = Clutter.Orientation.HORIZONTAL;
    appDisplay._grid.layoutManager._orientation = Clutter.Orientation.HORIZONTAL;
    appDisplay._scrollView.set_policy(St.PolicyType.EXTERNAL, St.PolicyType.NEVER);

    appDisplay._hintContainer.opacity = 255;

    appDisplay._box._vertical = true;

    appDisplay._pageIndicators.y_expand = false;
    appDisplay._pageIndicators.vertical = false;
    appDisplay._pageIndicators.y_align = Clutter.ActorAlign.END;
}

var BaseAppViewOverride = {
    _pageForCoords(x, y) {
        return SidePages.NONE;
    }
}
