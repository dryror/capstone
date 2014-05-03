// Files to be uploaded to server
var serverAddress = "http://ltema.breakerarts.com/uploadfile.php";

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
	
	
	/* TODO: For testing
	var newRow = Ti.UI.createPickerRow({
		title : "site1",
		siteID : 1
	});
	data.push(newRow);
	*/
	// Add the rows to the picker
	$.surveyPkr.add(data);
	
} catch (e) {
	Ti.App.fireEvent("app:dataBaseError");
} finally {
	rows.close();
	db.close();
}

// Create the CSV files for the Site Survey selected for export
function makeCSV() {
	var siteID = $.surveyPkr.getSelectedRow(0).siteID;
	var allFiles = [];
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
			allFiles.push(rows.fieldByName('plot_photo'));
			allFiles.push(rows.fieldByName('transect_photo'));
			allFiles.push(rows.fieldByName('observation_photo'));
			
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
		Ti.App.fireEvent("app:dataBaseError");
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
    	var dir = "site" + siteID;
				
		// Create Directory for site
		var siteDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, dir);
		if (! siteDir.exists()) {
	    	siteDir.createDirectory();
		}
    	
	    var ssFileName = "SampleStation.csv";
	    var sampleStationFile = Titanium.Filesystem.getFile(siteDir.resolve(), ssFileName);
	    sampleStationFile.write(sampleStationTxt); 
	    allFiles.push(ssFileName);
	    
	    var gsFileName = "GeneralSurvey.csv";
	    var generalSurveyFile = Titanium.Filesystem.getFile(siteDir.resolve(), gsFileName);
	    generalSurveyFile.write(generalSurveyTxt);
	    allFiles.push(gsFileName);
	} catch(e) {
		Ti.App.fireEvent("app:fileSystemError");
	} finally {
		return allFiles;
	}
}

function exportBtn() {
	// Create the CSV and export all files and photos
	var files = makeCSV();
	
	/* TODO: for testing
	var files = testPhotoUpload();
	alert(files); */
	
	
	// Setup the progress bar
	$.progressBar.hide();
	$.progressBar.message = "Uploading...";
	$.progressBar.min = 0;
	$.progressBar.max = files.length;
	$.progressBar.value = 0;
	$.progressBar.show();
	
	// Upload all the files for selected survey
	exportFiles(files);	
}

// Upload a single file to the server
function exportFiles(toExport) {
	var siteID = $.surveyPkr.getSelectedRow(0).siteID;
	var dir = 'site' + siteID + '/';
	var exported = 0;
	for (var i=0; i < toExport.length; i++) {
		var fileName = toExport[i];
		
		var folderName = $.surveyPkr.getSelectedRow(0).title;
		// Open the file
		try {
			var fileToExport = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, dir + fileName);
			
			// Check if the file you are trying to upload exists
			if (!fileToExport.exists()) {
				//TODO note which file didn't exist and do something about it
				$.progressBar.value ++;
				continue;
			}
		} catch(e) {
			Ti.App.fireEvent("app:fileSystemError");
		}
		
		// Send the file to the server
		try {
			var data_to_send = { 
			    "file": fileToExport.read(),
			    "path": folderName
			};
			xhr = Titanium.Network.createHTTPClient();
			xhr.open("POST", serverAddress);
			xhr.setRequestHeader("enctype", "multipart/form-data");
			xhr.setRequestHeader('User-Agent','My User Agent');
			xhr.send(data_to_send);
			
			// Check the response
			xhr.onload = function() {
			    
			    // TODO: mark the file as being uploaded successfully
			    if(this.responseText === "success") {
			    	
			    	//Update the progress
			    	$.progressBar.value ++;
			    	
			    	//If the last file uplaoded, we are done
			    	if ($.progressBar.value === (toExport.length)) {
			    		$.exportWin.fireEvent("doneSending");
			    	}
			    } else {
			    	//TODO file didn't upload need to note which file didn't upload
			    	alert(this.responseText);
			    }
			};
			
		} catch(e) {
			Ti.App.fireEvent("app:fileSystemError");
		}
	}
	
}

// All the HTTP requests have responded
// TODO: if every file uploaded, mark the Site Survey as uploaded
// TODO: if some files didn't upload, give the user options
$.exportWin.addEventListener("doneSending", function() {
    $.progressBar.message = "Done";
    alert("Data for " + $.surveyPkr.getSelectedRow(0).title + " has been submited");
});



/* for testing
function testPhotoUpload() {
	var photos = [];

	var db = Ti.Database.open('ltemaDB');
		
	var rows = db.execute('SELECT media_name \
	   FROM site_survey svy, transect tct, media med \
	   WHERE svy.site_id = tct.site_id AND \
	   tct.media_id = med.media_id AND \
	   svy.site_id = 1');

	while (rows.isValidRow()) {
		
		photos.push(rows.fieldByName('media_name'));
		rows.next();
	}
	
	rows.close();
	db.close();
	
	return photos;
}
*/

