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
	var selectedSite = $.surveyPkr.getSelectedRow(0).siteID;
	makeCSV(selectedSite);
}

function makeCSV(siteID) {
	//Query the database based on the siteID selected
	var db = Ti.Database.open('ltemaDB');
	
	var rows = db.execute('SELECT prk.park_name, tct.transect_name, plt.plot_name, ' +
	   'plt.utm_zone, plt.utm_easting, plt.utm_northing, plt.stake_deviation, ' +
	   'plt.distance_deviation, plt.utc, tct.surveyor, pob.observation, pob."count", pob.comments, pob.ground_cover, ' +
	   '(SELECT media_name FROM media, transect WHERE transect.media_id = media.media_id) AS transect_photo, ' +
	   '(SELECT media_name FROM media, plot WHERE plot.media_id = media.media_id) AS plot_photo, ' +
	   '(SELECT media_name FROM media, plot_observation WHERE plot_observation.media_id = media.media_id) AS observation_photo ' +
	   'FROM park prk, transect tct, plot plt, plot_observation pob, site_survey svy, media med ' +
	   'WHERE svy.park_id = prk.park_id AND ' +
	   'svy.site_id = tct.site_id AND ' +
	   'tct.media_id = med.media_id AND ' +
	   'tct.transect_id = plt.transect_id AND ' +
	   'plt.plot_id = pob.plot_id AND ' +
	   'svy.site_id = ?', siteID);
	
	//Convert the result set into csv
	var sampleStationTxt = "";
	var dq = '"';
	var nl = '\n';
	var c = ',';
	while (rows.isValidRow()) {	
		
		var parkName = dq + rows.fieldByName('park_name') + dq;
		var sampleStationName = dq + rows.fieldByName('transect_name') + " " + rows.fieldByName('plot_name') + dq;
		var plotUTMZone = dq + rows.fieldByName('utm_zone') + dq;
		var plotUTMEast = dq + rows.fieldByName('utm_easting') + dq;
		var plotUTMNorth = dq + rows.fieldByName('utm_northing') + dq;
		var plotPhoto = dq + rows.fieldByName('plot_photo') + dq;
		
		sampleStationTxt += parkName + c + sampleStationName + c + plotUTMZone + c + plotUTMEast + c +
			plotUTMNorth + c + plotPhoto + nl;
		
		rows.next();
	}
 	
    // creating output file in application data directory
    var fileName = "Sample Station " + $.surveyPkr.getSelectedRow(0).title + ".csv";
    var sampleStationFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, fileName);
    
    // writing data in output file 
    sampleStationFile.write(sampleStationTxt); 
 
 	// email the file	
    if(sampleStationFile.exists){
        var emailDialog = Ti.UI.createEmailDialog();
		emailDialog.subject = "Test export";
		emailDialog.toRecipients = ['test@test.com'];
		var blob = sampleStationFile.read();
		var readText = blob.text;
		emailDialog.messageBody = readText;
		emailDialog.addAttachment(sampleStationFile);
		emailDialog.open();
    }
	
	rows.close();
	db.close();
}
