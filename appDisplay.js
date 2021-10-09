const { Gio, Meta, Shell, Clutter, GObject, Graphene, St } = imports.gi;
const Main = imports.ui.main;

function override() {
    let appDisplay = Main.overview._overview._controls._appDisplay;
    
    appDisplay._orientation = Clutter.Orientation.VERTICAL;    
    appDisplay._grid.layoutManager._orientation = Clutter.Orientation.VERTICAL;
    appDisplay._scrollView.set_policy(St.PolicyType.NEVER, St.PolicyType.EXTERNAL);
}

function reset() {
    let appDisplay = Main.overview._overview._controls._appDisplay;
    
    appDisplay._orientation = Clutter.Orientation.HORIZONTAL;
    appDisplay._grid.layoutManager._orientation = Clutter.Orientation.HORIZONTAL;
    appDisplay._scrollView.set_policy(St.PolicyType.EXTERNAL, St.PolicyType.NEVER);
}
