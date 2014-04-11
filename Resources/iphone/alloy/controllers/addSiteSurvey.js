function Controller() {
    function doneBtn() {
        alert("You Clicked the Done Button");
    }
    function biomeBtn() {
        $.formView.opacity = .2;
        $.biomePkrView.visible = true;
        $.protocolPkrView.visible = false;
    }
    function protocolBtn() {
        $.formView.opacity = .2;
        $.protocolPkrView.visible = true;
        $.biomePkrView.visible = false;
    }
    function doneBiomePkrBtn() {
        $.pickBiome.text = $.biomePkr.getSelectedRow(0).title;
        $.formView.opacity = 1;
        $.biomePkrView.visible = false;
    }
    function doneProtocolPkrBtn() {
        $.pickProtocol.text = $.protocolPkr.getSelectedRow(0).title;
        $.formView.opacity = 1;
        $.protocolPkrView.visible = false;
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
    $.__views.formView = Ti.UI.createView({
        id: "formView"
    });
    $.__views.addSiteSurvey.add($.__views.formView);
    $.__views.parkLbl = Ti.UI.createLabel({
        font: {
            fontSize: 20
        },
        left: 40,
        top: 40,
        id: "parkLbl",
        text: "Park Name:"
    });
    $.__views.formView.add($.__views.parkLbl);
    $.__views.parkSrch = Ti.UI.createSearchBar({
        left: 200,
        top: 30,
        width: 500,
        id: "parkSrch"
    });
    $.__views.formView.add($.__views.parkSrch);
    $.__views.biomeLbl = Ti.UI.createLabel({
        font: {
            fontSize: 20
        },
        left: 40,
        top: 100,
        id: "biomeLbl",
        text: "Biome:"
    });
    $.__views.formView.add($.__views.biomeLbl);
    $.__views.pickBiome = Ti.UI.createLabel({
        font: {
            fontSize: 20
        },
        left: 200,
        top: 100,
        color: "#157DFB",
        id: "pickBiome",
        text: "Select"
    });
    $.__views.formView.add($.__views.pickBiome);
    biomeBtn ? $.__views.pickBiome.addEventListener("click", biomeBtn) : __defers["$.__views.pickBiome!click!biomeBtn"] = true;
    $.__views.protocolLbl = Ti.UI.createLabel({
        font: {
            fontSize: 20
        },
        left: 40,
        top: 160,
        id: "protocolLbl",
        text: "Protocol:"
    });
    $.__views.formView.add($.__views.protocolLbl);
    $.__views.pickProtocol = Ti.UI.createLabel({
        font: {
            fontSize: 20
        },
        left: 200,
        top: 160,
        color: "#157DFB",
        id: "pickProtocol",
        text: "Select"
    });
    $.__views.formView.add($.__views.pickProtocol);
    protocolBtn ? $.__views.pickProtocol.addEventListener("click", protocolBtn) : __defers["$.__views.pickProtocol!click!protocolBtn"] = true;
    $.__views.biomePkrView = Ti.UI.createView({
        id: "biomePkrView",
        visible: "false"
    });
    $.__views.addSiteSurvey.add($.__views.biomePkrView);
    $.__views.doneBiomePkr = Ti.UI.createButton({
        font: {
            fontSize: 20
        },
        bottom: 220,
        id: "doneBiomePkr",
        title: "Done"
    });
    $.__views.biomePkrView.add($.__views.doneBiomePkr);
    doneBiomePkrBtn ? $.__views.doneBiomePkr.addEventListener("click", doneBiomePkrBtn) : __defers["$.__views.doneBiomePkr!click!doneBiomePkrBtn"] = true;
    $.__views.biomePkr = Ti.UI.createPicker({
        height: 150,
        bottom: 0,
        selectionIndicator: true,
        visable: false,
        id: "biomePkr"
    });
    $.__views.biomePkrView.add($.__views.biomePkr);
    var __alloyId1 = [];
    $.__views.__alloyId2 = Ti.UI.createPickerRow({
        title: "Grasslands",
        id: "__alloyId2"
    });
    __alloyId1.push($.__views.__alloyId2);
    $.__views.__alloyId3 = Ti.UI.createPickerRow({
        title: "Alpine",
        id: "__alloyId3"
    });
    __alloyId1.push($.__views.__alloyId3);
    $.__views.__alloyId4 = Ti.UI.createPickerRow({
        title: "Forest",
        id: "__alloyId4"
    });
    __alloyId1.push($.__views.__alloyId4);
    $.__views.__alloyId5 = Ti.UI.createPickerRow({
        title: "Wetland",
        id: "__alloyId5"
    });
    __alloyId1.push($.__views.__alloyId5);
    $.__views.__alloyId6 = Ti.UI.createPickerRow({
        title: "Intertidal",
        id: "__alloyId6"
    });
    __alloyId1.push($.__views.__alloyId6);
    $.__views.biomePkr.add(__alloyId1);
    $.__views.protocolPkrView = Ti.UI.createView({
        id: "protocolPkrView",
        visible: "false"
    });
    $.__views.addSiteSurvey.add($.__views.protocolPkrView);
    $.__views.doneProtocolPkr = Ti.UI.createButton({
        font: {
            fontSize: 20
        },
        bottom: 220,
        id: "doneProtocolPkr",
        title: "Done"
    });
    $.__views.protocolPkrView.add($.__views.doneProtocolPkr);
    doneProtocolPkrBtn ? $.__views.doneProtocolPkr.addEventListener("click", doneProtocolPkrBtn) : __defers["$.__views.doneProtocolPkr!click!doneProtocolPkrBtn"] = true;
    $.__views.protocolPkr = Ti.UI.createPicker({
        height: 150,
        bottom: 0,
        selectionIndicator: true,
        visable: false,
        id: "protocolPkr"
    });
    $.__views.protocolPkrView.add($.__views.protocolPkr);
    var __alloyId7 = [];
    $.__views.__alloyId8 = Ti.UI.createPickerRow({
        title: "Grasslands",
        id: "__alloyId8"
    });
    __alloyId7.push($.__views.__alloyId8);
    $.__views.__alloyId9 = Ti.UI.createPickerRow({
        title: "Alpine",
        id: "__alloyId9"
    });
    __alloyId7.push($.__views.__alloyId9);
    $.__views.__alloyId10 = Ti.UI.createPickerRow({
        title: "Squirrels",
        id: "__alloyId10"
    });
    __alloyId7.push($.__views.__alloyId10);
    $.__views.__alloyId11 = Ti.UI.createPickerRow({
        title: "Berries",
        id: "__alloyId11"
    });
    __alloyId7.push($.__views.__alloyId11);
    $.__views.__alloyId12 = Ti.UI.createPickerRow({
        title: "Amphibians",
        id: "__alloyId12"
    });
    __alloyId7.push($.__views.__alloyId12);
    $.__views.protocolPkr.add(__alloyId7);
    exports.destroy = function() {};
    _.extend($, $.__views);
    __defers["$.__views.doneAddSite!click!doneBtn"] && $.__views.doneAddSite.addEventListener("click", doneBtn);
    __defers["$.__views.pickBiome!click!biomeBtn"] && $.__views.pickBiome.addEventListener("click", biomeBtn);
    __defers["$.__views.pickProtocol!click!protocolBtn"] && $.__views.pickProtocol.addEventListener("click", protocolBtn);
    __defers["$.__views.doneBiomePkr!click!doneBiomePkrBtn"] && $.__views.doneBiomePkr.addEventListener("click", doneBiomePkrBtn);
    __defers["$.__views.doneProtocolPkr!click!doneProtocolPkrBtn"] && $.__views.doneProtocolPkr.addEventListener("click", doneProtocolPkrBtn);
    _.extend($, exports);
}

var Alloy = require("alloy"), Backbone = Alloy.Backbone, _ = Alloy._;

module.exports = Controller;