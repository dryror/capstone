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
    $.__views.__alloyId13 = Ti.UI.createWindow({
        backgroundColor: "white",
        title: "Site Surveys",
        id: "__alloyId13"
    });
    $.__views.editSite = Ti.UI.createButton({
        id: "editSite",
        title: "Edit"
    });
    editBtn ? $.__views.editSite.addEventListener("click", editBtn) : __defers["$.__views.editSite!click!editBtn"] = true;
    $.__views.__alloyId13.leftNavButton = $.__views.editSite;
    $.__views.addSite = Ti.UI.createButton({
        id: "addSite",
        title: "Add"
    });
    addBtn ? $.__views.addSite.addEventListener("click", addBtn) : __defers["$.__views.addSite!click!addBtn"] = true;
    $.__views.__alloyId13.rightNavButton = $.__views.addSite;
    $.__views.tbl = Ti.UI.createTableView({
        id: "tbl"
    });
    $.__views.__alloyId13.add($.__views.tbl);
    $.__views.navGroupWin = Ti.UI.iOS.createNavigationWindow({
        window: $.__views.__alloyId13,
        id: "navGroupWin"
    });
    $.__views.navGroupWin && $.addTopLevelView($.__views.navGroupWin);
    exports.destroy = function() {};
    _.extend($, $.__views);
    Ti.Database.install("/ltema.sqlite", "ltemaDB");
    var db = Ti.Database.open("ltemaDB");
    rows = db.execute("SELECT year, protocol_name, park_name FROM site_survey s, protocol p, park prk WHERE s.protocol_id = p.protocol_id AND s.park_id = prk.park_id ");
    var id_counter = 0;
    while (rows.isValidRow()) {
        id_counter++;
        var year = rows.fieldByName("year");
        var protocolName = rows.fieldByName("protocol_name");
        var parkName = rows.fieldByName("park_name");
        var siteSurvey = year + " - " + protocolName + " - " + parkName;
        var newRow = Ti.UI.createTableViewRow({
            title: siteSurvey,
            id: "row " + id_counter
        });
        var infoImage = Ti.UI.createImageView({
            image: "images/info.png",
            width: 36,
            height: 36,
            right: 5,
            id: id_counter
        });
        newRow.add(infoImage);
        $.tbl.appendRow(newRow);
        infoImage.addEventListener("click", function() {
            var style = Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL;
            var presentation = Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET;
            var modalWindow = Ti.UI.createWindow({
                backgroundColor: "white"
            });
            var closeBtn = Ti.UI.createButton({
                title: "Close",
                width: 100,
                height: 30
            });
            closeBtn.addEventListener("click", function() {
                modalWindow.close();
            });
            modalWindow.add(closeBtn);
            modalWindow.open({
                modal: true,
                modalTransitionStyle: style,
                modalStyle: presentation,
                navBarHidden: true
            });
        });
        rows.next();
    }
    rows.close();
    db.close();
    $.tbl.addEventListener("click", function() {
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