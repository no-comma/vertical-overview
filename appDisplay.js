const { Gio, Meta, Shell, Clutter, GObject, Graphene, St } = imports.gi;
const Main = imports.ui.main;
const AppDisplay = imports.ui.appDisplay;

const Self = imports.misc.extensionUtils.getCurrentExtension();
const Util = Self.imports.util;

const PAGE_PREVIEW_ANIMATION_START_OFFSET = 100;
const PAGE_PREVIEW_MAX_ARROW_OFFSET = 80;
const MAX_PAGE_PADDING = 200;

var SidePages = {
    NONE: 0,
    PREVIOUS: 1 << 0,
    NEXT: 1 << 1,
    DND: 1 << 2,
};

function override() {
    let appDisplay = Main.overview._overview._controls._appDisplay;
    
    appDisplay._orientation = Clutter.Orientation.VERTICAL;    
    appDisplay._grid.layoutManager._orientation = Clutter.Orientation.VERTICAL;
    appDisplay._scrollView.set_policy(St.PolicyType.NEVER, St.PolicyType.EXTERNAL);

    appDisplay._grid.y_align = Clutter.ActorAlign.START;

    appDisplay._pageIndicators.y_expand = true;
    appDisplay._pageIndicators.vertical = true;
    appDisplay._pageIndicators.y_align = Clutter.ActorAlign.CENTER;

    appDisplay._nextPageIndicator.x_align = Clutter.ActorAlign.FILL;
    appDisplay._nextPageIndicator.y_align = Clutter.ActorAlign.END;
    appDisplay._nextPageIndicator.add_style_class_name('vertical-overview');
    appDisplay._prevPageIndicator.x_align = Clutter.ActorAlign.FILL;
    appDisplay._prevPageIndicator.y_align = Clutter.ActorAlign.START;
    appDisplay._prevPageIndicator.add_style_class_name('vertical-overview');
    
    appDisplay._nextPageArrow.x_align = Clutter.ActorAlign.CENTER;
    appDisplay._nextPageArrow.y_align = Clutter.ActorAlign.END;
    appDisplay._nextPageArrow.y_expand = true;
    appDisplay._nextPageArrow.rotation_angle_z = -90;
    appDisplay._prevPageArrow.x_align = Clutter.ActorAlign.CENTER;
    appDisplay._prevPageArrow.y_align = Clutter.ActorAlign.START;
    appDisplay._prevPageArrow.y_expand = true;
    appDisplay._prevPageArrow.rotation_angle_z = -90;
    appDisplay._prevPageArrow.y = 24;

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

    appDisplay._nextPageIndicator.x_align = Clutter.ActorAlign.END;
    appDisplay._nextPageIndicator.y_align = Clutter.ActorAlign.FILL;
    appDisplay._nextPageIndicator.remove_style_class_name('vertical-overview');
    appDisplay._prevPageIndicator.x_align = Clutter.ActorAlign.START;
    appDisplay._prevPageIndicator.y_align = Clutter.ActorAlign.FILL;
    appDisplay._prevPageIndicator.remove_style_class_name('vertical-overview');

    appDisplay._nextPageArrow.x_align = Clutter.ActorAlign.END;
    appDisplay._nextPageArrow.y_align = Clutter.ActorAlign.CENTER;
    appDisplay._nextPageArrow.y_expand = false;
    appDisplay._nextPageArrow.rotation_angle_z = 0;
    appDisplay._prevPageArrow.x_align = Clutter.ActorAlign.START;
    appDisplay._prevPageArrow.y_align = Clutter.ActorAlign.CENTER;
    appDisplay._prevPageArrow.y_expand = false;
    appDisplay._prevPageArrow.rotation_angle_z = 0;
    appDisplay._prevPageArrow.y = 0;
    
    appDisplay._box.vertical = true;

    Util.overrideProto(AppDisplay.BaseAppView.prototype, global.vertical_overview.GSFunctions['BaseAppView']);
}

var BaseAppViewOverride = {
    _pageForCoords(x, y) {
        const { allocation } = this._grid;

        const [success, pointerX, pointerY] = this._scrollView.transform_stage_point(x, y);
        if (!success)
            return SidePages.NONE;

        if (pointerY < allocation.y1)
            return SidePages.PREVIOUS;
        else if (pointerY > allocation.y2)
            return SidePages.NEXT;

        return SidePages.NONE;
    },
    
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

    _getIndicatorOffset(page, progress, baseOffset) {
        const translationY =
            (1 - progress) * PAGE_PREVIEW_ANIMATION_START_OFFSET;

        return (translationY - baseOffset) * page;
    },

    _setupPagePreview(page, state) {        
        if (this._previewedPages.has(page))
            return this._previewedPages.get(page).adjustment;

        const adjustment = new St.Adjustment({
            actor: this,
            lower: 0,
            upper: 1,
        });

        const indicator = page > 0
            ? this._nextPageIndicator : this._prevPageIndicator;

        const notifyId = adjustment.connect('notify::value', () => {
            const nextPage = this._grid.currentPage + page;
            const hasFollowingPage = nextPage >= 0 &&
                nextPage < this._grid.nPages;

            if (hasFollowingPage) {
                const items = this._grid.getItemsAtPage(nextPage);
                items.forEach(item => {
                    item.translation_y =
                        this._getIndicatorOffset(page, adjustment.value, 0);
                });

                if (!(state & SidePages.DND)) {
                    const pageArrow = page > 0
                        ? this._nextPageArrow
                        : this._prevPageArrow;
                    pageArrow.set({
                        visible: true,
                        opacity: adjustment.value * 255,
                        translation_y: this._getIndicatorOffset(
                            page, adjustment.value,
                            this._pageArrowOffset),
                    });
                }
            }
            if (hasFollowingPage ||
                (page > 0 &&
                 this._grid.layout_manager.allow_incomplete_pages &&
                 (state & SidePages.DND) !== 0)) {
                indicator.set({
                    visible: true,
                    opacity: adjustment.value * 255,
                    height: (this.height - this._grid.height) / 2,
                    translation_y: this._getIndicatorOffset(
                        page, adjustment.value,
                        0),
                });
            }
            this._syncClip();
        });

        this._previewedPages.set(page, {
            adjustment,
            notifyId,
        });

        return adjustment;
    }
}
