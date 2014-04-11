function Controller() {
    function editBtn() {
        alert("You Clicked the Edit Button");
    }
    function addBtn() {
        var addSite = Alloy.createController("addSiteSurvey").getView();
        $.navGroupWin.openWindow(addSite);
    }
    require("alloy/controllers/BaseController").apply(this, Array.prototype.slice.call(arguments));
    this.__controllerPath = "index";
    arguments[0] ? arguments[0]["__parentSymbol"] : null;
    arguments[0] ? arguments[0]["$model"] : null;
    arguments[0] ? arguments[0]["__itemTemplate"] : null;
    var $ = this;
    var exports = {};
    var __defers = {};
    $.__views.__alloyId0 = Ti.UI.createWindow({
        backgroundColor: "white",
        title: "Site Surveys",
        id: "__alloyId0"
    });
    $.__views.editSite = Ti.UI.createButton({
        id: "editSite",
        title: "Edit"
    });
    editBtn ? $.__views.editSite.addEventListener("click", editBtn) : __defers["$.__views.editSite!click!editBtn"] = true;
    $.__views.__alloyId0.leftNavButton = $.__views.editSite;
    $.__views.addSite = Ti.UI.createButton({
        id: "addSite",
        title: "Add"
    });
    addBtn ? $.__views.addSite.addEventListener("click", addBtn) : __defers["$.__views.addSite!click!addBtn"] = true;
    $.__views.__alloyId0.rightNavButton = $.__views.addSite;
    var __alloyId4 = [];
    $.__views.row1 = Ti.UI.createTableViewRow({
        title: "Row 1",
        id: "row1"
    });
    __alloyId4.push($.__views.row1);
    $.__views.__alloyId3 = Ti.UI.createTableView({
        data: __alloyId4,
        id: "__alloyId3"
    });
    $.__views.__alloyId0.add($.__views.__alloyId3);
    $.__views.navGroupWin = Ti.UI.iOS.createNavigationWindow({
        window: $.__views.__alloyId0,
        id: "navGroupWin"
    });
    $.__views.navGroupWin && $.addTopLevelView($.__views.navGroupWin);
    exports.destroy = function() {};
    _.extend($, $.__views);
    $.row1.addEventListener("click", function() {
        var transects = Alloy.createController("transects").getView();
        $.navGroupWin.openWindow(transects);
    });
    $.navGroupWin.open();
    __defers["$.__views.editSite!click!editBtn"] && $.__views.editSite.addEventListener("click", editBtn);
    __defers["$.__views.addSite!click!addBtn"] && $.__views.addSite.addEventListener("click", addBtn);
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;