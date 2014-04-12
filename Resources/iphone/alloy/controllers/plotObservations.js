function Controller() {
    function editBtn() {
        alert("You Clicked the Edit Button");
    }
    function addBtn() {
        var addObservation = Alloy.createController("addPlotObservation").getView();
        $.navGroupWin.openWindow(addObservation);
    }
    require("alloy/controllers/BaseController").apply(this, Array.prototype.slice.call(arguments));
    this.__controllerPath = "plotObservations";
    arguments[0] ? arguments[0]["__parentSymbol"] : null;
    arguments[0] ? arguments[0]["$model"] : null;
    arguments[0] ? arguments[0]["__itemTemplate"] : null;
    var $ = this;
    var exports = {};
    var __defers = {};
    $.__views.__alloyId16 = Ti.UI.createWindow({
        backgroundColor: "white",
        title: "Plot Observations",
        id: "__alloyId16"
    });
    $.__views.editObservations = Ti.UI.createButton({
        id: "editObservations",
        title: "Edit"
    });
    editBtn ? $.__views.editObservations.addEventListener("click", editBtn) : __defers["$.__views.editObservations!click!editBtn"] = true;
    $.__views.__alloyId16.leftNavButton = $.__views.editObservations;
    $.__views.addObservation = Ti.UI.createButton({
        id: "addObservation",
        title: "Add"
    });
    addBtn ? $.__views.addObservation.addEventListener("click", addBtn) : __defers["$.__views.addObservation!click!addBtn"] = true;
    $.__views.__alloyId16.rightNavButton = $.__views.addObservation;
    $.__views.__alloyId19 = Ti.UI.createTableView({
        id: "__alloyId19"
    });
    $.__views.__alloyId16.add($.__views.__alloyId19);
    $.__views.navGroupWin = Ti.UI.iOS.createNavigationWindow({
        window: $.__views.__alloyId16,
        id: "navGroupWin"
    });
    $.__views.navGroupWin && $.addTopLevelView($.__views.navGroupWin);
    exports.destroy = function() {};
    _.extend($, $.__views);
    __defers["$.__views.editObservations!click!editBtn"] && $.__views.editObservations.addEventListener("click", editBtn);
    __defers["$.__views.addObservation!click!addBtn"] && $.__views.addObservation.addEventListener("click", addBtn);
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;