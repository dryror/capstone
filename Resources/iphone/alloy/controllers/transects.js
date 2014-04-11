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
    $.__views.__alloyId15 = Ti.UI.createWindow({
        backgroundColor: "white",
        title: "Transects",
        id: "__alloyId15"
    });
    $.__views.editTransects = Ti.UI.createButton({
        id: "editTransects",
        title: "Edit"
    });
    editBtn ? $.__views.editTransects.addEventListener("click", editBtn) : __defers["$.__views.editTransects!click!editBtn"] = true;
    $.__views.__alloyId15.leftNavButton = $.__views.editTransects;
    $.__views.addTransect = Ti.UI.createButton({
        id: "addTransect",
        title: "Add"
    });
    addBtn ? $.__views.addTransect.addEventListener("click", addBtn) : __defers["$.__views.addTransect!click!addBtn"] = true;
    $.__views.__alloyId15.rightNavButton = $.__views.addTransect;
    var __alloyId19 = [];
    $.__views.row1 = Ti.UI.createTableViewRow({
        title: "Row 1",
        id: "row1"
    });
    __alloyId19.push($.__views.row1);
    $.__views.__alloyId18 = Ti.UI.createTableView({
        data: __alloyId19,
        id: "__alloyId18"
    });
    $.__views.__alloyId15.add($.__views.__alloyId18);
    $.__views.navGroupWin = Ti.UI.iOS.createNavigationWindow({
        window: $.__views.__alloyId15,
        id: "navGroupWin"
    });
    $.__views.navGroupWin && $.addTopLevelView($.__views.navGroupWin);
    exports.destroy = function() {};
    _.extend($, $.__views);
    $.row1.addEventListener("click", function() {
        var plots = Alloy.createController("plots").getView();
        $.navGroupWin.openWindow(plots);
    });
    __defers["$.__views.editTransects!click!editBtn"] && $.__views.editTransects.addEventListener("click", editBtn);
    __defers["$.__views.addTransect!click!addBtn"] && $.__views.addTransect.addEventListener("click", addBtn);
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;