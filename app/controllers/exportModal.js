//Query the database based for site surveys that have at least 1 transect with 1 plot and 1 observation
var db = Ti.Database.open('ltemaDB');

var rows = db.execute('SELECT svy.site_id, prk.park_name, svy.year, pro.protocol_name ' +
	'FROM site_survey svy, park prk, protocol pro, transect tst, plot plt, plot_observation pob ' +
	'WHERE svy.park_id = prk.park_id AND ' +
	'svy.protocol_id = pro.protocol_id AND ' +
	'svy.site_id = tst.site_id AND ' +
	'tst.transect_id = plt.transect_id AND ' +
	'plt.plot_id = pob.plot_id ' +
	'GROUP BY svy.site_id');

var data = [];
var index = 0;
while (rows.isValidRow()) {	
	
	var siteID = rows.fieldByName('site_id');
	var year = rows.fieldByName('year');
	var protocolName = rows.fieldByName('protocol_name');
	var parkName = rows.fieldByName('park_name');
	
	//create a string from each entry
	var siteSurvey = year + ' - ' + protocolName + ' - ' + parkName; 
	
	//create a new row
	var newRow = Ti.UI.createPickerRow({
		title : siteSurvey,
		siteID : siteID
	});
	
	data[index] = newRow;
	index ++;
	rows.next();
}

//Add row to the table view
$.surveyPkr.add(data);

rows.close();
db.close();

function backBtnClick(){
	$.modalNav.close();
}

function surveyBtn() {
	$.formView.opacity = .2;
    $.surveyPkrView.visible = true;
}

function doneSelectBtn() {
    $.selectLbl.text = $.surveyPkr.getSelectedRow(0).title;
    $.formView.opacity = 1;
    $.surveyPkrView.visible = false;
    if ($.selectLbl.text != "Select") {
    	$.exportBtn.enabled = true;
    }
}

function exportBtn() {
	alert("Export button clicked");
}
