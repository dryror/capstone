/*
 * Transfer completed site surveys to a desktop computer via physical connection
 */

//Navigation Bar label
var titleText = "Export a Survey";
var titleLabel = Titanium.UI.createLabel({
	text: titleText,
	font:{fontSize:20,fontWeight:'bold'},
});
$.exportWin.setTitleControl(titleLabel);

// User Instructions	
var instructions = 
	"Please press the Select button above.\n\n" + 
	"Use the picker below to select the Site Survey you wish to prepare for export and press Done.\n\n" +
	"Press the Export button and wait for the confirmation that the Survey is ready for export.\n\n" +
	"You can now connect your device to iTunes to retrieve the Survey folder.\n\n";
$.info.text = instructions;

function backBtnClick(){
	Ti.App.fireEvent("app:enableIndexExportButton");
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
	if (data.length > 0) {
		$.surveyPkr.add(data);
		$.selectLbl.text = "Select";
		$.selectLbl.addEventListener('click', surveyBtn);
	} else {
		$.selectLbl.text = "Please complete a survey before exporting";
		$.info.text = "Please complete a survey before exporting.\n\n";
	}
	
} catch (e) {
	var errorMessage = e.message;
	Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
} finally {
	rows.close();
	db.close();
}

// Create the CSV files for the Site Survey selected for export
function makeCSV() {
	var siteID = $.surveyPkr.getSelectedRow(0).siteID;
	var siteName = $.surveyPkr.getSelectedRow(0).title;
	
	try{
		// Query the database based on the siteID selected
		var db = Ti.Database.open('ltemaDB');
		
		// Get the transects for the site
		var transects = db.execute('SELECT prk.park_name, tct.transect_id, tct.transect_name, tct.surveyor, med.media_name AS transect_photo \
			FROM transect tct, media med, park prk, site_survey svy \
			WHERE tct.media_id = med.media_id AND \
			prk.park_id = svy.park_id AND \
			svy.site_id = tct.site_id AND \
			tct.site_id = ?', siteID);
		
		var results = [];
		var fieldCount = transects.fieldCount();
		var transectIDs = [];
		while (transects.isValidRow()) {
			// Get the transectIDs
			transectIDs.push(transects.fieldByName('transect_id'));
			
			// Create transect objects
			var row = {};
			for (var j = 0; j < fieldCount; j++) {
				row[transects.getFieldName(j)] = transects.field(j);
			}
			results.push(row);
			
			transects.next();
		}

		// Get the plots for the transects		
		var tids = '(' + transectIDs + ')';
		var plots = db.execute('SELECT plt.plot_id, plt.plot_name, plt.utm_zone, plt.utm_easting, plt.transect_id, \
			plt.utm_northing, plt.stake_deviation, plt.distance_deviation, plt.utc, med.media_name AS plot_photo\
			FROM plot plt, media med \
			WHERE plt.media_id = med.media_id AND \
			plt.transect_id IN ' + tids);
		
		fieldCount = plots.fieldCount();
		var plotIDs = [];
		while (plots.isValidRow()) {
			// Get the plotIDs
			plotIDs.push(plots.fieldByName('plot_id'));
			
			// Create plot objects
			var row = {};
			for (var j = 0; j < fieldCount; j++) {
				row[plots.getFieldName(j)] = plots.field(j);
			}
			
			// Associate with the correct transect
			for (var i in results) {
				if (results[i].transect_id === row.transect_id) {
					var pid = plots.fieldByName('plot_id');
					results[i][pid] = row;
				}
			}
			
			plots.next();
		}
		
		// Get the plot observations for the plots
		var pids = '(' + plotIDs + ')';
		var plotObservations = db.execute('SELECT pob.observation_id, pob.species_code, pob."count", pob.comments, pob.plot_id, pob.ground_cover, med.media_name AS observation_photo \
			FROM plot_observation pob \
			LEFT JOIN media med \
			ON pob.media_id = med.media_id AND \
			pob.plot_id IN '+ pids);
		
		fieldCount = plotObservations.fieldCount();	
		while (plotObservations.isValidRow()) {
			// Create observation objects
			var row = {};
			for (var j = 0; j < fieldCount; j++) {
				row[plotObservations.getFieldName(j)] = plotObservations.field(j);
			}
			
			// Associate with the correct plot			
			for (var i in results) {
				for(var j in results[i]) {				
					if(results[i][j].plot_id === row.plot_id) {
						var pobid = plotObservations.fieldByName('observation_id');
						results[i][j][pobid] = row;
					}
				}
			}
			plotObservations.next();
		}		
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		transects.close();
		plots.close();
		plotObservations.close();
		db.close();
	}
		
	// Prepare the CSV files
	var sampleStationTxt = "";
	var generalSurveyTxt = "";
	var nl = '\n';
	var c = ',';
	var dq = '"';
	
	for (var transect in results) {
		for (var plot in results[transect]) {
			// CSV for Sample Station output
			if (results[transect][plot].plot_id != null) {
				
				sampleStationTxt += dq + results[transect].park_name + dq + c;
				var ssTransectName = results[transect].transect_name;
				if (ssTransectName != null) {
					ssTransectName = ssTransectName.replace(/\"/g, "");
				}
				sampleStationTxt += dq + ssTransectName + " ";
				
				sampleStationTxt += results[transect][plot].plot_name + dq + c;
				sampleStationTxt += dq + results[transect][plot].utm_zone + dq + c;
				sampleStationTxt += dq + results[transect][plot].utm_easting + dq + c;
				sampleStationTxt += dq + results[transect][plot].utm_northing + dq + c;
				sampleStationTxt += dq + results[transect][plot].plot_photo + dq + nl;
			}		
			
			for (var observation in results[transect][plot]) {
				if (typeof results[transect][plot][observation] === 'object' && results[transect][plot][observation] != null) {
					
					// Skip the entry if the ground cover is 0
					if (results[transect][plot][observation].ground_cover == 0) {
						continue;
					}
					
					// Convert utc to date and time
					var utc = parseInt(results[transect][plot].utc);
					var d = new Date(utc);
					
					var date = d.toDateString().split(" ");
					var plotDate = dq + date[2] + date[1] + date[3] + dq;
					
					var time = d.toTimeString().split(":");
					var plotTime = dq + time[0] + ":" + time[1] + dq;
					
					// CSV for General Survey output
					generalSurveyTxt += dq + results[transect].park_name + dq + c;
					
					var gsTransectName = results[transect].transect_name;
					if (gsTransectName != null) {
						gsTransectName = gsTransectName.replace(/\"/g, "");
					}
					generalSurveyTxt += dq + gsTransectName + " ";
					
					generalSurveyTxt += results[transect][plot].plot_name + dq + c;
					generalSurveyTxt += plotDate + c + plotTime + c + c;
					
					var surveyor = results[transect].surveyor;
					if (surveyor != null) {
						surveyor = surveyor.replace(/\"/g, "");
					}
					generalSurveyTxt += dq + surveyor + dq + c;
					
					var speciesCode = results[transect][plot][observation].species_code;
					if (speciesCode != null) {
						speciesCode = speciesCode.replace(/\"/g, "");
					}
					generalSurveyTxt += dq + speciesCode + dq + c;
					
					generalSurveyTxt += dq + results[transect][plot][observation].count + dq + c + c + c + c;
					
					var comments = results[transect][plot][observation].comments;
					if (comments != null) {
						comments = comments.replace(/\"/g, "");
					}
					generalSurveyTxt += dq + comments + dq + c;
					
					generalSurveyTxt += dq + results[transect][plot][observation].ground_cover + dq + c;
					
					var observationPhoto = results[transect][plot][observation].observation_photo;
					if (observationPhoto != null) {
						generalSurveyTxt += dq + observationPhoto + dq + nl;
					} else {
						generalSurveyTxt += nl;
					}
				}					
			}
		}
	}

	// Create the CSV files
	try{
		//Name the directory
		var dir = $.surveyPkr.getSelectedRow(0).title;
				
		// Create Directory for site
		var siteDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, dir);
		if (! siteDir.exists()) {
			siteDir.createDirectory();
		}
		
		// Create Sample Station file
		var ssFileName = "SampleStation.csv";
		var sampleStationFile = Titanium.Filesystem.getFile(siteDir.resolve(), ssFileName);
		sampleStationFile.write(sampleStationTxt); 
		
		// Create General Survey file
		var gsFileName = "GeneralSurvey.csv";
		var generalSurveyFile = Titanium.Filesystem.getFile(siteDir.resolve(), gsFileName);
		generalSurveyFile.write(generalSurveyTxt);
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:fileSystemError", {error: errorMessage});
	} finally {
		// Dispose of file handles
		siteDir = null;
		sampleStationFile = null;
		generalSurveyFile = null;
	}
}

function exportBtn() {
	// Create the CSV and export all files and photos
	makeCSV();
	$.exportWin.fireEvent("doneSending");
}

// All the HTTP requests have sent successfully
$.exportWin.addEventListener("doneSending", function() { 
	try{
		var db = Ti.Database.open('ltemaDB');
		var siteID = $.surveyPkr.getSelectedRow(0).siteID;
		var d = new Date();
		var utc = d.getTime();
		
		// Timestamp the export in the database
		db.execute('UPDATE OR FAIL site_survey SET exported = ? WHERE site_id = ?', utc, siteID);
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:fileSystemError", {error: errorMessage});
	} finally {
		db.close();
		alert("Data for " + $.surveyPkr.getSelectedRow(0).title + " is ready for export");
	} 
});
