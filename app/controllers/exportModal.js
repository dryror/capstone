// Files to be uploaded to server
var filesToSend = [];

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
	if (makeCSV(selectedSite)) {
		for (var i = 0; i < filesToSend.length; i++) {
			exportFile(filesToSend[i], $.surveyPkr.getSelectedRow(0).title);
		}
	}
}

// Query the database based for site surveys that are eligable for export
// A site survey must have at least 1 transect with 1 plot with 1 observation before it can be exported
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
	
	// Create a picker row for each site survey that can be exported
	var data = [];
	var index = 0;
	while (rows.isValidRow()) {	
		
		var siteID = rows.fieldByName('site_id');
		var year = rows.fieldByName('year');
		var protocolName = rows.fieldByName('protocol_name');
		var parkName = rows.fieldByName('park_name');
		
		// Build the picker row title
		var siteSurvey = year + ' - ' + protocolName + ' - ' + parkName; 
		
		// Create a new picker row
		var newRow = Ti.UI.createPickerRow({
			title : siteSurvey,
			siteID : siteID
		});
		
		data[index] = newRow;
		index ++;
		rows.next();
	}
	
	// Add the rows to the picker
	$.surveyPkr.add(data);
	
} catch (e) {
	//TODO remove after testing complete
	alert("Database access error: " + e.message);
} finally {
	rows.close();
	db.close();
}

// Create the CSV files for the Site Survey selected for export
function makeCSV(siteID) {
	try{
		// Query the database based on the siteID selected
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
		
		// Get the field names
		var fields = [];
		for(var i = 0; i < rows.fieldCount();i++) {
		    fields.push(rows.fieldName(i));
		};
		
		// Create an array of result objects
		var results = [];
		var index = 0;
		while (rows.isValidRow()) {
			results[index] = {};
			
			// Add photos to array of files
			filesToSend.push(rows.fieldByName('plot_photo'));
			filesToSend.push(rows.fieldByName('transect_photo'));
			filesToSend.push(rows.fieldByName('observation_photo'));
			
			// Wrap results in "" to escape any commas entered
			var ssName = '"' + rows.fieldByName('transect_name') + ' ' + rows.fieldByName('plot_name') + '"' ;
			results[index]['sampleStationName'] = ssName;
		    for(var i=0; i < fields.length; i++) {
		       results[index][fields[i]] = '"' + rows.fieldByName(fields[i]) + '"';
		    }
		    index++;
		    rows.next();
		};
		
	} catch (e) {
		//TODO remove after testing complete
		alert(e.message);
		return false;
	} finally {
		rows.close();
		db.close();
	}
	
	// Prepare the CSV files
	var sampleStationTxt = "";
	var generalSurveyTxt = "";
	var nl = '\n';
	var c = ',';
	
	for (var i=0; i < results.length; i++) {
		// CSV for Sample Station output
		sampleStationTxt += results[i].park_name + c + results[i].sampleStationName + c +
			results[i].utm_zone + c + results[i].utm_easting + c + results[i].utm_northing + 
			c + results[i].plot_photo + nl;
		
		//TODO convert utc to date and time
		var plotDate = results[i].utc;
		var plotTime = results[i].utc;
		
		// CSV for General Survey output
		generalSurveyTxt += results[i].park_name + c + results[i].sampleStationName + c +
			plotDate + c + plotTime + c + c + results[i].surveyor + c + results[i].observation +
			c + results[i].count + c + c + c + c + results[i].comments + c + results[i].ground_cover +
			c + results[i].observation_photo + nl;		
	}
 	
    // Create the CSV files
    try{
	    var ssFileName = "Sample Station.csv";
	    var sampleStationFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, ssFileName);
	    sampleStationFile.write(sampleStationTxt); 
	    filesToSend.push(ssFileName);
	    
	    var gsFileName = "General Survey.csv";
	    var generalSurveyFile = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, gsFileName);
	    generalSurveyFile.write(generalSurveyTxt);
	    filesToSend.push(gsFileName);
	} catch(e) {
		//TODO remove after testing complete
		alert(e.message);
		return false;
	} finally {
		return true;
	}
}

// Upload a single file to the server
function exportFile(fileName, folderName) {
	// Open the file
	try {
		var fileToExport = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, fileName);
		// Check if the file you are trying to upload exists
		if (!fileToExport.exists()) {
			return;
		}
	} catch(e) {
		//TODO remove after testing complete
		alert(e.message);
	}
	
	// Send the file to the server
	try {
		var data_to_send = { 
		    "file": fileToExport.read(),
		    "path": folderName
		};
		xhr = Titanium.Network.createHTTPClient();
		xhr.open("POST","http://ltema.breakerarts.com/uploadfile.php");
		xhr.setRequestHeader("enctype", "multipart/form-data");
		xhr.setRequestHeader('User-Agent','My User Agent');
		xhr.send(data_to_send);
		
		// Check the response
		xhr.onload = function() {
		    alert(this.responseText);
		    Ti.API.info(this.responseText); 
		};
	} catch(e) {
		//TODO remove after testing complete
		alert(e.message);
	}
}



