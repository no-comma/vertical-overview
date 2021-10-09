const { Gio, Meta, Shell, Clutter, GObject, Graphene, St } = imports.gi;
const Main = imports.ui.main;
const AppDisplay = imports.ui.appDisplay;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Util = Self.imports.util;

const PAGE_PREVIEW_MAX_ARROW_OFFSET = 80;
const MAX_PAGE_PADDING = 200;

function override() {
    let appDisplay = Main.overview._overview._controls._appDisplay;
    
    appDisplay._orientation = Clutter.Orientation.VERTICAL;    
    appDisplay._grid.layoutManager._orientation = Clutter.Orientation.VERTICAL;
    appDisplay._scrollView.set_policy(St.PolicyType.NEVER, St.PolicyType.EXTERNAL);

    appDisplay._grid.y_align = Clutter.ActorAlign.START;

    appDisplay._pageIndicators.y_expand = true;
    appDisplay._pageIndicators.vertical = true;
    appDisplay._pageIndicators.y_align = Clutter.ActorAlign.CENTER;

    appDisplay._box.vertical = false;

    global.vertical_overview.GSFunctions['BaseAppView'] = Util.overrideProto(AppDisplay.BaseAppView.prototype, BaseAppViewOverride);
}

function reset() {
    let appDisplay = Main.overview._overview._controls._appDisplay;
    
    appDisplay._orientation = Clutter.Orientation.HORIZONTAL;
    appDisplay._grid.layoutManager._orientation = Clutter.Orientation.HORIZONTAL;
    appDisplay._scrollView.set_policy(St.PolicyType.EXTERNAL, St.PolicyType.NEVER);

    appDisplay._grid.y_align = Clutter.ActorAlign.FILL;

    appDisplay._pageIndicators.y_expand = false;
    appDisplay._pageIndicators.vertical = false;
    appDisplay._pageIndicators.y_align = Clutter.ActorAlign.END;

    appDisplay._box.vertical = true;

    Util.overrideProto(AppDisplay.BaseAppView.prototype, global.vertical_overview.GSFunctions['BaseAppView']);
}

var BaseAppViewOverride = {
    adaptToSize(width, height) {
        let box = new Clutter.ActorBox({
            x2: width,
            y2: height,
        });
        box = this.get_theme_node().get_content_box(box);
        box = this._scrollView.get_theme_node().get_content_box(box);
        box = this._grid.get_theme_node().get_content_box(box);
                 
        const availWidth = box.get_width();
        const availHeight = box.get_height();

        let pageWidth = availWidth;
        let pageHeight = Math.ceil(availHeight * 0.8);
        this._grid.layout_manager.pagePadding.top =
            Math.floor(availHeight * 0.02);
        this._grid.layout_manager.pagePadding.bottom =
            Math.ceil(availHeight * 0.02);
        
        this._grid.adaptToSize(pageWidth, pageHeight);
        this._grid.height = pageHeight;

        const leftPadding = Math.floor(
            (availWidth - this._grid.layout_manager.pageWidth) / 2);
        const rightPadding = Math.ceil(
            (availWidth - this._grid.layout_manager.pageWidth) / 2);
        const topPadding = Math.floor(
            (availHeight - this._grid.layout_manager.pageHeight) / 2);
        const bottomPadding = Math.ceil(
            (availHeight - this._grid.layout_manager.pageHeight) / 2);

        this._scrollView.content_padding = new Clutter.Margin({
            left: leftPadding,
            right: rightPadding,
            top: topPadding,
            bottom: bottomPadding,
        });

        this._availWidth = availWidth;
        this._availHeight = availHeight;

        this._pageIndicatorOffset = leftPadding;
        this._pageArrowOffset = Math.max(
            leftPadding - PAGE_PREVIEW_MAX_ARROW_OFFSET, 0);
    },
    
}
