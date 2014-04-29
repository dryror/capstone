//Query the database based for site surveys that have at least 1 transect with 1 plot and 1 observation
try {
	var db = Ti.Database.open('ltemaDB');
	
	var rows = db.execute('SELECT svy.site_id, prk.park_name, svy.year, pro.protocol_name \
		FROM site_survey svy, park prk, protocol pro, transect tst, plot plt, plot_observation pob \
		WHERE svy.park_id = prk.park_id AND \
		svy.protocol_id = pro.protocol_id AND \
		svy.site_id = tst.site_id AND \
		tst.transect_id = plt.transect_id AND \
		plt.plot_id = pob.plot_id \
		GROUP BY svy.site_id');
	
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
} catch (e) {
	
} finally {
	rows.close();
	db.close();
}

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
	
	try{
		//Query the database based on the siteID selected
		var db = Ti.Database.open('ltemaDB');
		
		var rows = db.execute('SELECT prk.park_name, tct.transect_name, plt.plot_name, \
		   plt.utm_zone, plt.utm_easting, plt.utm_northing, plt.stake_deviation, \
		   plt.distance_deviation, plt.utc, tct.surveyor, pob.observation, pob."count", pob.comments, pob.ground_cover, \
		   (SELECT media_name FROM media, transect WHERE transect.media_id = media.media_id) AS transect_photo, \
		   (SELECT media_name FROM media, plot WHERE plot.media_id = media.media_id) AS plot_photo, \
		   (SELECT media_name FROM media, plot_observation WHERE plot_observation.media_id = media.media_id) AS observation_photo \
		   FROM park prk, transect tct, plot plt, plot_observation pob, site_survey svy, media med \
		   WHERE svy.park_id = prk.park_id AND \
		   svy.site_id = tct.site_id AND \
		   tct.media_id = med.media_id AND \
		   tct.transect_id = plt.transect_id AND \
		   plt.plot_id = pob.plot_id AND \
		   svy.site_id = ?', siteID);
		
		//Get all the results and wrap them in double quotes
		var fields = [];
		for(var i = 0; i < rows.fieldCount();i++) {
		    fields.push(rows.fieldName(i));
		};
		
		var results = [];
		var index = 0;
		while (rows.isValidRow()) {
			results[index] = {};
			var ssName = '"' + rows.fieldByName('transect_name') + ' ' + rows.fieldByName('plot_name') + '"' ;
			results[index]['sampleStationName'] = ssName;
		    for(var i=0; i < fields.length; i++) {
		       results[index][fields[i]] = '"' + rows.fieldByName(fields[i]) + '"';
		    }
		    index++;
		    rows.next();
		};
	} catch (e) {
		
	} finally {
		rows.close();
		db.close();
	}
	//Prepare the CSV files
	var sampleStationTxt = "";
	var generalSurveyTxt = "";
	var nl = '\n';
	var c = ',';
	
	for (var i=0; i < results.length; i++) {
		sampleStationTxt += results[i].park_name + c + results[i].sampleStationName + c +
			results[i].utm_zone + c + results[i].utm_easting + c + results[i].utm_northing + 
			c + results[i].plot_photo + nl;
		
		//TODO convert utc to date and time
		var plotDate = results[i].utc;
		var plotTime = results[i].utc;
		
		generalSurveyTxt += results[i].park_name + c + results[i].sampleStationName + c +
			plotDate + c + plotTime + c + c + results[i].surveyor + c + results[i].observation +
			c + results[i].count + c + c + c + c + results[i].comments + c + results[i].ground_cover +
			c + results[i].observation_photo + nl;
	}
 	
    // creating output files in application data directory
    try{
	    var ssFileName = "Sample Station " + $.surveyPkr.getSelectedRow(0).title + ".csv";
	    var sampleStationFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, ssFileName);
	    
	    var gsFileName = "General Survey " + $.surveyPkr.getSelectedRow(0).title + ".csv";
	    var generalSurveyFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, gsFileName);
	    
	    // writing data to output files
	    sampleStationFile.write(sampleStationTxt); 
	    generalSurveyFile.write(generalSurveyTxt);
	 	
	 	// email the files	
	    if(sampleStationFile.exists && generalSurveyFile.exists){
	        var emailDialog = Ti.UI.createEmailDialog();
			emailDialog.subject = 'LTEMA Export: ' + $.surveyPkr.getSelectedRow(0).title;
			emailDialog.toRecipients = ['rorydrysdale@gmail.com'];
			
			// For testing to see csv file data
			var ssBlob = sampleStationFile.read();
			var ssReadText = ssBlob.text;
			var gsBlob = generalSurveyFile.read();
			var gsReadText = gsBlob.text;
			
			emailDialog.messageBody = ssReadText + '\n' + gsReadText;
			emailDialog.addAttachment(sampleStationFile);
			emailDialog.addAttachment(generalSurveyFile);
			emailDialog.open();
	    }
	} catch(e) {
		
	}
}
