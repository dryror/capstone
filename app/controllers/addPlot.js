/*
 * Plot creation screen with validation
 * 
 * expected args: transectID
 */

var args = arguments[0];
var transectID = args.transectID;

// Get the plot name and the transect defaults for stake orientation and plot distance
try {
	var db = Ti.Database.open('ltemaDB');
	var results = db.execute('SELECT plot_id FROM plot WHERE transect_id = ?', transectID);
	var plotNumber = results.rowCount + 1;
	$.numberLbl.text = "P"+plotNumber;
	
	var results = db.execute('SELECT site_id, stake_orientation, plot_distance FROM transect WHERE transect_id = ?', transectID);
	var siteID = results.fieldByName('site_id');
	var stakeOrientation = results.fieldByName('stake_orientation');
	var plotDistance = results.fieldByName('plot_distance');
} catch(e) {
	var errorMessage = e.message;
	Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
} finally {
	results.close();
	db.close();
}

// Set the stake deviation and plot distance labels
$.pickStake.labels = [{title:stakeOrientation}, {title:"Other"}];
$.pickDistance.labels = [{title:plotDistance}, {title:"Other"}];
var stakeOther = false;
var distanceOther = false;

// Nav Bar Title
var labelText = 'New Plot';
var titleLabel = Titanium.UI.createLabel({
	text: labelText,
	font:{fontSize:20,fontWeight:'bold'},
});
$.addPlotWin.setTitleControl(titleLabel);

// User Instructions	
var instructions = 
	"Please confirm the stake orientation and plot spacing along the transect for this plot.\n\n" + 
	"If there is a deviation, select \"other\" and specify the deviation in the provided text field.\n\n" +
	"When taking the photo, please stand with your feet on the transect line and frame the picture with the entire plot. If your shadow obscures the photo, step to one side and make a note of this in the comments section.\n\n" +
	"When capturing a plot's location, hold the device inside the plot marker to get the best reading possible.\n\n\n";
$.info.text = instructions;

// Initialize Variables
var photo;
var utmEasting;
var utmNorthing;
var utmZone;

var current_latitude;
var current_longitude;
var current_accuracy;

//Start continuous location capture - based on distance filter
var gps = require('location');
	gps.location(function(latitude, longitude, accuracy, error) {
		if(error == true){
			//returns an error
		}else{
			//updated lat & long
			current_latitude = latitude;
			current_longitude = longitude;
			current_accuracy = accuracy;
		}
	});

/* Dialog Boxes */

//Enable location services for LTEMA
var ltemaAccessDialog = Titanium.UI.createAlertDialog({
	title : 'No Location Service Access',
	message : "\"LTEMA\" needs Location Services enabled in order to access your current location.  Please check your device's Settings > Privacy > Location Services > LTEMA"
});

//Location Services Dialog
var gpsDialog = Titanium.UI.createAlertDialog({
	title : 'Location Services Disabled',
	message : 'You currently have all location services for this device disabled. If you would like to proceed please reenable location services.',
	buttonNames : ['OK', 'Help'],
	ok : 0,
	help : 1
});

//How to enable location services
var helpDialog = Titanium.UI.createAlertDialog({
	title : 'Enable Location Services',
	message : 'To enable location services close the application and open' + ' Settings > Privacy > Location Services'
});

/* Functions */

function doneBtn(e){
	//disable button to prevent double entry
	e.source.enabled = false;
	
	var errorOnPage = false;
	
	if (photo == null) {
		$.photoError.visible = true;
		errorOnPage = true;
		Ti.API.info("No photo");
	}
	
	if ($.pickStake.index == null) {
		$.stakeError.visible = true;
		errorOnPage = true;
		Ti.API.info("No stake orientation");
	}
	
	if ($.pickDistance.index == null) {
		$.distanceError.visible = true;
		errorOnPage = true;
		Ti.API.info("No plot distance");
	}
	
	if ($.pickStake.index == 1) {
		if ($.stakeDeviation.value === "") {
			$.stakeOtherError.visible = true;
			errorOnPage = true;
		}
		stakeOrientation = $.stakeDeviation.value;
	}
	
	if ($.pickDistance.index == 1) {
		if ($.distanceDeviation.value === "") {
			$.distanceOtherError.visible = true;
			errorOnPage = true;
		}
		plotDistance = $.distanceDeviation.value;
	} 
	
	if ($.distanceOtherError.visible || $.stakeOtherError.visible) {
		errorOnPage = true;
	}
	
	if(utmZone == null){
		$.locationError.text = '* Please capture current location';
		$.locationError.visible = true;
		errorOnPage = true;
	}
	
	
	if (errorOnPage) {
		e.source.enabled = true;
		$.comments.blur();
		return;
	}
		
	// Name and Save Photo
	var photoName = savePhoto(photo);
	var utc = new Date().getTime();
	var comments = $.comments.value;
		
	try{
		//Connect to database
		var db = Ti.Database.open('ltemaDB');
		
		//add photo name to media table
		db.execute( 'INSERT INTO media (media_name) VALUES (?)', photoName);
		
		//get the id of the last row inserted into the database - *not sure if this is acceptable sql code to use?
		var results = db.execute('SELECT last_insert_rowid() as mediaID');
		var mediaID = results.fieldByName('mediaID');
		
		//Insert Query - add row to plot table
		db.execute(	'INSERT INTO plot (plot_name,utm_zone,utm_easting,utm_northing,utc,stake_deviation,distance_deviation,comments,transect_id,media_id) VALUES (?,?,?,?,?,?,?,?,?,?)', 
					$.numberLbl.text, utmZone, utmEasting, utmNorthing, utc, stakeOrientation, plotDistance, comments, transectID, mediaID);
					
	}catch(e){
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	}finally{	
		//close the result set
		results.close();	
		
		//populate new plotID with zeroed-out observations
		insertPreviousPlotRows(db);
		
		//Close the database
		db.close();
		
		//refresh and close
		Ti.App.fireEvent("app:refreshPlots");
		$.addPlotWin.close();
	}
}

function takePhoto() {		
	//remove photo error msg
	$.photoError.visible = false;
	
	//call camera module and set thumbnail
	var pic = require('camera');
	pic.getPhoto(function(myPhoto) {
		//Set thumbnail
		$.plotThumbnail.visible = true;
		$.plotThumbnail.image = myPhoto;
		$.thumbnailHintText.visible = true;
		
		//Save Photo for preview (temporary photo)
		var temp = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
		temp.write(myPhoto);

		//set variables with values
		photo = myPhoto;
	});
}

//Name and save photo to filesystem - do this when done btn is pressed
function savePhoto(photo){
	try {
		//Connect to database
		var db = Ti.Database.open('ltemaDB');
			
		//Query - Retrieve site survery, year, park
		var rows = db.execute('SELECT year, protocol_name, park_name \
							FROM site_survey s, protocol p, park prk \
							WHERE s.protocol_id = p.protocol_id \
							AND s.park_id = prk.park_id \
							AND site_id = ?', siteID);
							
		//Name the directory	
		var year = rows.fieldByName('year');
		var protocolName = rows.fieldByName('protocol_name');
		var parkName = rows.fieldByName('park_name');
		var dir = year + ' - ' + protocolName + ' - ' + parkName;
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		rows.close();
		db.close();
	}
	
	//get the photo
	var img = photo; 
	
	//name the photo  (timestamp - utc in ms)
	var timestamp = new Date().getTime();
	var filename = "P" + timestamp;
	
	try {
		// Create image Directory for site
		var imageDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, dir);
		if (! imageDir.exists()) {
	    	imageDir.createDirectory();
		}
		
		// .resolve() provides the resolved native path for the directory.
		var imageFile  = Ti.Filesystem.getFile(imageDir.resolve(), filename + '.png');
		imageFile.write(img);
		
		var path = filename + '.png';
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:fileSystemError", {error: errorMessage});
	} finally {
		imageDir = null;
		imageFile = null;
		return path;
	}	
}

// A new plot gets zeroed-out unique observations added from previous plots in its transect
function insertPreviousPlotRows(db) {  //expected parameter: an open database connection
	try {
		
		//get the plotID of the row just inserted
		var plotIDResult = db.execute('SELECT last_insert_rowid() as plotID');
		var plotID = plotIDResult.fieldByName('plotID');
		
		//get all the plot_id's of this screen's transect
		var plotIDs = [];
		var plotsResult = db.execute('SELECT plot_id FROM plot WHERE transect_id = ?', transectID);
		while (plotsResult.isValidRow()) {
			plotIDs.push(plotsResult.fieldByName('plot_id'));
			plotsResult.next();
		}
		
		//build a list of unique titles/names/"observation"s to avoid duplicates
		var uniquePlotObservationTitles = [];
		
		//add current plot's titles to the unique list if indeed unique
		var uniquesResult = db.execute ('SELECT observation FROM plot_observation WHERE plot_id = ?', plotID);
		while (uniquesResult.isValidRow()) {
			var newObs = uniquesResult.fieldByName('observation');
			//seach for matches
			var found = false;
			for (k=0; k < uniquePlotObservationTitles.length; k++) {
				if (newObs === uniquePlotObservationTitles[k]) {
					found = true;
				}
			}
			if (!found) {
				uniquePlotObservationTitles.push(newObs);
			}
			uniquesResult.next();
		}
		
		//get the observation_id's of all plots occuring before the current plotID
		var validPlotObservationIDs = [];
		for (var i=0; i < plotIDs.length; i++) {
			if (plotIDs[i] < plotID) {  //assuming all plotIDs are squential
				var obsResult = db.execute('SELECT observation_id, observation FROM plot_observation WHERE plot_id = ?', plotIDs[i]);
				while (obsResult.isValidRow()){
					var obsID = obsResult.fieldByName('observation_id');
					var obsTitle = obsResult.fieldByName('observation');
					//record IDs of unique titles
					var found = false;
					for (k=0; k < uniquePlotObservationTitles.length; k++) {
						if (obsTitle === uniquePlotObservationTitles[k]) {
							found = true;
						}
					}
					if (!found) {
						uniquePlotObservationTitles.push(obsTitle);
						validPlotObservationIDs.push(obsID);
					}
					obsResult.next();
				}
				obsResult.close();
			}
		}
		
		//generate a new row in this plot for each validPlotObservationIDs
		for (var j=0; j < validPlotObservationIDs.length; j++) {
			titleResult = db.execute ('SELECT observation, comments, count, species_code FROM plot_observation WHERE observation_id = ?', validPlotObservationIDs[j]);
			var theTitle = titleResult.fieldByName('observation');
			var count = titleResult.fieldByName('count');
			var comments = titleResult.fieldByName('comments');
			var speciesCode = titleResult.fieldByName('species_code');
			//create new observation_id in this plot
			db.execute( 'INSERT INTO plot_observation (observation, ground_cover, count, comments, species_code, plot_id) VALUES (?,?,?,?,?,?)',
						theTitle, 0, count, comments, speciesCode, plotID);
			titleResult.close();
		}
	} catch (e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		//db connection is closed outside this function
		plotIDResult.close();
		plotsResult.close();
		uniquesResult.close();
	}
}

//THUMBNAIL BUTTON - preview photo
function previewPhoto(){
	var modal = Alloy.createController("photoPreviewModal", {}).getView();
		modal.open({
			modal : true,
			modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
			modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_PAGESHEET,
			navBarHidden : false
	});
}
// UTM - get the current location 
function getLocation(){
	$.locationError.visible = false;
	
	//Check if Location Services is Enabled/Disabled
	if (Titanium.Geolocation.locationServicesEnabled == false) {
		//notify user that location services is disabled
		gpsDialog.show();  
		//return;
	}else{
	
	//get the location - UTM
	var utm = require('utm');
			utm.LatLngToUTMRef(current_latitude, current_longitude, function(UTMEasting, UTMNorthing, longitudeZone) {
			
			utmEasting = UTMEasting;
			utmNorthing = UTMNorthing;
			utmZone = longitudeZone;
			
			if(utmZone.toString() == "NaN"){
				ltemaAccessDialog.show();
			}else{
				$.location.visible = true;
				$.location.text = "UTM Zone: " + utmZone + "\nUTM Easting: " + UTMEasting + "\nUTM Northing: " + UTMNorthing  + "\nAccuracy: " + Math.round(current_accuracy);
			}
		});
	}
}  

/* Event Listeners */

// Show and hide the deviation text field depending on what is selected
$.pickStake.addEventListener('click', function(e) {
	$.stakeError.visible = false;
	$.stakeOtherError.visible = false;
	if (stakeOther === false && e.source.labels[e.index].title === "Other") {
		$.distanceLbl.top += 60;
		$.pickDistance.top += 60;
		$.distanceError.top += 60;
		$.distanceDeviation.top += 60;
		$.distanceOtherError.top +=60;
		$.commentLbl.top += 60;
		$.comments.top += 60;
		$.photoBtn.top += 60;
		$.plotThumbnail.top += 60;
		$.photoError.top += 60;
		$.thumbnailHintText.top += 60;
		$.locationBtn.top += 60;
		$.location.top += 60;
		$.locationError.top += 60;
		$.footerLine.top += 60;
		$.info.top += 60;
		$.stakeDeviation.visible = true;
		$.stakeDeviation.focus();
		stakeOther = true;
	}
	if (stakeOther === true && e.source.labels[e.index].title !== "Other") {
		$.distanceLbl.top -= 60;
		$.pickDistance.top -= 60;
		$.distanceError.top -= 60;
		$.distanceDeviation.top -= 60;
		$.distanceOtherError.top -=60;
		$.commentLbl.top -= 60;
		$.comments.top -= 60;
		$.photoBtn.top -= 60;
		$.plotThumbnail.top -= 60;
		$.thumbnailHintText.top -= 60;
		$.photoError.top -= 60;
		$.locationBtn.top -= 60;
		$.location.top -= 60;
		$.locationError.top -= 60;
		$.footerLine.top -= 60;
		$.info.top -= 60;
		$.stakeDeviation.visible = false;
		$.stakeDeviation.blur();
		stakeOther = false;
		$.stakeDeviation.value = "";
	}	
});

// Show and hide the deviation text field depending on what is selected
$.pickDistance.addEventListener('click', function(e) {
	$.distanceError.visible = false;
	$.distanceOtherError.visible = false;
	if (distanceOther === false && e.source.labels[e.index].title === "Other") {
		$.commentLbl.top += 60;
		$.comments.top += 60;
		$.photoBtn.top += 60;
		$.plotThumbnail.top += 60;
		$.photoError.top += 60;
		$.thumbnailHintText.top += 60;
		$.locationBtn.top += 60;
		$.location.top += 60;
		$.locationError.top += 60;
		$.footerLine.top += 60;
		$.info.top += 60;
		$.distanceDeviation.visible = true;
		$.distanceDeviation.focus();
		distanceOther = true;
	}
	if (distanceOther === true && e.source.labels[e.index].title !== "Other") {
		$.commentLbl.top -= 60;
		$.comments.top -= 60;
		$.photoBtn.top -= 60;
		$.plotThumbnail.top -= 60;
		$.photoError.top -= 60;
		$.thumbnailHintText.top -= 60;
		$.locationBtn.top -= 60;
		$.location.top -= 60;
		$.locationError.top -= 60;
		$.footerLine.top -= 60;
		$.info.top -= 60;
		$.distanceDeviation.visible = false;
		$.distanceDeviation.blur();
		distanceOther = false;
		$.distanceDeviation.value = "";
	}
});

// Stake Orientation
$.stakeDeviation.addEventListener('change', function(e) {
	if (e.value.length < 4) {
		$.stakeOtherError.visible = true;
		$.stakeOtherError.text = "* Stake orientation must be a minimum of 4 characters";
	} else {
		$.stakeOtherError.visible = false;
	}
});

//Plot Distance
$.distanceDeviation.addEventListener('change', function(e) {
	// Replace bad input (non-numbers) on plotDistance TextField
	e.source.value = e.source.value.replace(/[^0-9]+/,"");
	Ti.App.fireEvent('distanceDeviationChange');
});
Ti.App.addEventListener('distanceDeviationChange', function(e) {
	if (e.value === "") {
		$.distanceOtherError.visible = true;
	} else if ($.distanceDeviation.value < 2) {
		$.distanceOtherError.visible = true;
		$.distanceOtherError.text = "* Plot distance should be at least 2 meters";
	} else if ($.distanceDeviation.value > 30) {
		$.distanceOtherError.visible = true;
		$.distanceOtherError.text = "* Plot distance should be at most 30 meters";
	} else {
		$.distanceOtherError.visible = false;
	}
});

//Event Listener - help info for enabling location services
gpsDialog.addEventListener('click', function(e) {
	if (e.index === e.source.help) {
		helpDialog.show();
	}
});

// related to issue #28
$.addPlotWin.addEventListener('close', function(e) {
	//remove the temp photo - used for photo preview
	var tempPhoto = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
	if(tempPhoto.exists){
		tempPhoto.deleteFile();
	}
	//Kill the GPS
	Ti.Geolocation.removeEventListener('location', function(e) {});
	Ti.App.fireEvent("app:refreshPlots");
});