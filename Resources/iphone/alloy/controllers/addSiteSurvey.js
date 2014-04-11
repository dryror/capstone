function Controller() {
    function doneBtn() {
        alert("You Clicked the Done Button");
    }
    require("alloy/controllers/BaseController").apply(this, Array.prototype.slice.call(arguments));
    this.__controllerPath = "addSiteSurvey";
    arguments[0] ? arguments[0]["__parentSymbol"] : null;
    arguments[0] ? arguments[0]["$model"] : null;
    arguments[0] ? arguments[0]["__itemTemplate"] : null;
    var $ = this;
    var exports = {};
    var __defers = {};
    $.__views.addSiteSurvey = Ti.UI.createWindow({
        backgroundColor: "white",
        title: "Add Survey",
        id: "addSiteSurvey"
    });
    $.__views.addSiteSurvey && $.addTopLevelView($.__views.addSiteSurvey);
    $.__views.doneAddSite = Ti.UI.createButton({
        id: "doneAddSite",
        title: "Done"
    });
    doneBtn ? $.__views.doneAddSite.addEventListener("click", doneBtn) : __defers["$.__views.doneAddSite!click!doneBtn"] = true;
    $.__views.addSiteSurvey.rightNavButton = $.__views.doneAddSite;
    $.__views.parkLbl = Ti.UI.createLabel({
        font: {
            fontSize: 20
        },
        left: 40,
        top: 40,
        id: "parkLbl",
        text: "Park Name:"
    });
    $.__views.addSiteSurvey.add($.__views.parkLbl);
    $.__views.parkSrch = Ti.UI.createSearchBar({
        left: 200,
        top: 30,
        width: 500,
        id: "parkSrch"
    });
    $.__views.addSiteSurvey.add($.__views.parkSrch);
    $.__views.biomeLbl = Ti.UI.createLabel({
        font: {
            fontSize: 20
        },
        left: 40,
        top: 100,
        id: "biomeLbl",
        text: "Biome:"
    });
    $.__views.addSiteSurvey.add($.__views.biomeLbl);
    $.__views.protocolLbl = Ti.UI.createLabel({
        font: {
            fontSize: 20
        },
        left: 40,
        top: 160,
        id: "protocolLbl",
        text: "Protocol:"
    });
    $.__views.addSiteSurvey.add($.__views.protocolLbl);
    exports.destroy = function() {};
    _.extend($, $.__views);
    __defers["$.__views.doneAddSite!click!doneBtn"] && $.__views.doneAddSite.addEventListener("click", doneBtn);
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;