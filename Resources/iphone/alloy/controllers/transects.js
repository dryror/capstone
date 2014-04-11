function Controller() {
    function editBtn() {
        alert("You Clicked the Edit Button");
    }
    function addBtn() {
        var addTransect = Alloy.createController("addTransect").getView();
        $.navGroupWin.openWindow(addTransect);
    }
    require("alloy/controllers/BaseController").apply(this, Array.prototype.slice.call(arguments));
    this.__controllerPath = "transects";
    arguments[0] ? arguments[0]["__parentSymbol"] : null;
    arguments[0] ? arguments[0]["$model"] : null;
    arguments[0] ? arguments[0]["__itemTemplate"] : null;
    var $ = this;
    var exports = {};
    var __defers = {};
    $.__views.__alloyId13 = Ti.UI.createWindow({
        backgroundColor: "white",
        title: "Transects",
        id: "__alloyId13"
    });
    $.__views.editTransects = Ti.UI.createButton({
        id: "editTransects",
        title: "Edit"
    });
    editBtn ? $.__views.editTransects.addEventListener("click", editBtn) : __defers["$.__views.editTransects!click!editBtn"] = true;
    $.__views.__alloyId13.leftNavButton = $.__views.editTransects;
    $.__views.addTransect = Ti.UI.createButton({
        id: "addTransect",
        title: "Add"
    });
    addBtn ? $.__views.addTransect.addEventListener("click", addBtn) : __defers["$.__views.addTransect!click!addBtn"] = true;
    $.__views.__alloyId13.rightNavButton = $.__views.addTransect;
    $.__views.__alloyId16 = Ti.UI.createTableView({
        id: "__alloyId16"
    });
    $.__views.__alloyId13.add($.__views.__alloyId16);
    $.__views.navGroupWin = Ti.UI.iOS.createNavigationWindow({
        window: $.__views.__alloyId13,
        id: "navGroupWin"
    });
    $.__views.navGroupWin && $.addTopLevelView($.__views.navGroupWin);
    exports.destroy = function() {};
    _.extend($, $.__views);
    __defers["$.__views.editTransects!click!editBtn"] && $.__views.editTransects.addEventListener("click", editBtn);
    __defers["$.__views.addTransect!click!addBtn"] && $.__views.addTransect.addEventListener("click", addBtn);
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;