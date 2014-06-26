/*
 * Transect creation screen with validation
 * 
 * expected args: siteID
 */

var args = arguments[0];
var siteID = args.siteID;

// Initialize Variables
var photo;
var utmEasting;
var utmNorthing;
var utmZone;

var current_latitude;
var current_longitude;
var current_accuracy;

// Create Stake Orientation TabbedBar labels
var pickStakeLabels = [
	{title:"Top Left / Bottom Right", enabled:false},
	{title:"Top Right / Bottom Left", enabled:false}
];
//Enable Stake Orientation TabbedBar
pickStakeLabels[0].enabled = true;
pickStakeLabels[1].enabled = true;
$.pickStake.labels = pickStakeLabels;

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

// Instruciton text
var instructions = 
	"When conducting a site survey, remain on one side of the transect at all times (downslope if applicable) to avoid disturbing the observations.\n\n" +
	"Some example Transect Name schemes are sequential (\"T1\", \"T2\"..), directional (\"South\", \"North\"..), or descriptive (\"Creekside\", \"Hillside\"..)\n\n" +
	"All surveyors require a first name of two or more letters and a last name.\n\n" +
	"Stake Orientation only affects the default value of each plot, and can be altered on a per plot basis to any custom value.\n\n" +
	"Plot Distance is the default distance, in meters, between each plot. Individual plot deviations can be noted when adding a plot.\n\n" +
	"When taking the transect's photo, stand at one end and face the other. Capture the transect and the horizon. This photo will assist in locating the transect when revisiting the site.\n\n" +
	"Capture Location should be completed from the same spot the photo is taken.\n\n\n";
$.info.text = instructions;

// Nav Bar title label
var titleLabel = Titanium.UI.createLabel({
	top:10,
	text: 'New Transect',
	textAlign:'center',
	font:{fontSize:20,fontWeight:'bold'},
});
$.addTransectWin.setTitleControl(titleLabel);

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
	
//validate form before inserting to database
function doneBtn(e){
	//disable button to prevent double entry
	e.source.enabled = false;
	
	// check that the following (required) fields are not empty
	Ti.App.fireEvent('transectChange');
	Ti.App.fireEvent('surveyorChange');
	Ti.App.fireEvent('plotDistanceChange');
	
	//check photo exists and a stake orientation has been selected
	var errorFlag = false;
	
	if($.transectError.visible) {
		errorFlag = true;
	}
	
	if($.surveyorError.visible) {
		errorFlag = true;
	}
	
	if($.plotDistanceError.visible) {
		errorFlag = true;
	}
	
	if(photo == null && $.pickStake.index == null){
		$.photoError.visible = true;
		$.photoError.text = "* Please take a photo";
		$.stakeError.visible = true;
		$.stakeError.text = "* Please select a stake orientation";
		errorFlag = true;
	}
	if (photo == null){
		$.photoError.visible = true;
		$.photoError.text = "* Please take a photo";
		errorFlag = true;
	}
	if($.pickStake.index == null){
		$.stakeError.visible = true;
		$.stakeError.text = "* Please select a stake orientation";
		errorFlag = true;
	}
	if(utmZone == null){
		$.locationError.text = '* Please capture current location';
		$.locationError.visible = true;
		errorFlag = true;
	}
		
	if (errorFlag === true) {
		e.source.enabled = true;
		$.tsctName.blur();
		$.srvyName.blur();
		$.otherSrvyName.blur();
		$.plotDist.blur();
		$.comments.blur();
		return;
	} else {
		$.photoError.visible = false;
		$.stakeError.visible = false;
	
		// Name and Save Photo
		var photoName = savePhoto(photo);
		
		try{
			//Connect to database
			var db = Ti.Database.open('ltemaDB');
			
			//add photo name to media table
			db.execute( 'INSERT INTO media (media_name) VALUES (?)', photoName);
			
			//get the id of the last row inserted into the database - *not sure if this is acceptable sql code to use?
			var results = db.execute('SELECT last_insert_rowid() as mediaID');
			var mediaID = results.fieldByName('mediaID');
			
			//Insert Query - add row to transect table
			db.execute(	'INSERT INTO transect (transect_name,surveyor,other_surveyors,plot_distance,stake_orientation,utm_zone,utm_easting,utm_northing,comments,site_id,media_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)', 
						$.tsctName.value, $.srvyName.value, $.otherSrvyName.value, $.plotDist.value, pickStakeLabels[$.pickStake.index].title, utmZone, utmEasting, utmNorthing, $.comments.value, siteID, mediaID);
						
		}catch(e){
			var errorMessage = e.message;
			Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
		}finally{	
			//close the result set
			results.close();	
			//Close the database
			db.close();
			//refresh and close
			Ti.App.fireEvent("app:refreshTransects");
			$.addTransectWin.close();
		}
	}
}

function takePhoto() {		
	//remove photo error msg
	$.photoError.visible = false;
	
	//call camera module and set thumbnail
	var pic = require('camera');
	pic.getPhoto(function(myPhoto) {
		//Set thumbnail
		$.transectThumbnail.visible = true;
		$.transectThumbnail.image = myPhoto;
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
	//get the name of the current site survery, year, park
	try{
		//Connect to database
		var db = Ti.Database.open('ltemaDB');
		
		//Query - Retrieve site survery, year, park
		var rows = db.execute('SELECT s.year, p.protocol_name, prk.park_name \
						FROM site_survey s, protocol p, park prk \
						WHERE s.protocol_id = p.protocol_id \
						AND s.park_id = prk.park_id \
						AND site_id = ?', siteID);
		
		//Get requested data from each row in table
		
		var year = rows.fieldByName('year');
		var protocolName = rows.fieldByName('protocol_name');
		var parkName = rows.fieldByName('park_name');
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		rows.close();
		db.close();
	}
	
	//Name the directory
	var dir = year + ' - ' + protocolName + ' - ' + parkName; 
	//get the photo
	var img = photo;
	
	//name the photo  (timestamp - utc in ms)
	var timestamp = new Date().getTime();
	var filename = "T" + timestamp;
	
	try {
		// Create image Directory for site
		var imageDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, dir);
		if (! imageDir.exists()) {
			imageDir.createDirectory();
		}
		
		// .resolve() provides the resolved native path for the directory.
		var imageFile = Ti.Filesystem.getFile(imageDir.resolve(), filename + '.png');
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
				$.location.text = "UTM Zone: " + utmZone + "\nUTM Easting: " + UTMEasting + "\nUTM Northing: " + UTMNorthing + "\nAccuracy: " + Math.round(current_accuracy);
			}
		});
	}
}  

/* Listeners */

// When an input field changes, fire error handler

// ERROR CHECKING

//Transect Name
$.tsctName.addEventListener('change', function (e) {
	Ti.App.fireEvent('transectChange');
});
Ti.App.addEventListener('transectChange', function() {
	if ($.tsctName.value.length < 2) {
		$.transectError.visible = true;
		$.transectError.text = "* Please use at least 2 characters in a transect name";
		//$.tsctName.borderColor = 'red';
		//$.tsctName.borderRadius = 8;
	} else {
		$.transectError.visible = false;
		//$.tsctName.borderColor = 'transparent';
	}
});



//TODO: review name field regexes to avoid user frustration in some manner
// Head Surveyor
$.srvyName.addEventListener('change', function(e) {
	Ti.App.fireEvent('surveyorChange');
});
Ti.App.addEventListener('surveyorChange', function(e) {
	var field = $.srvyName.value;
	var match = /^[a-zA-Z]{1}[a-zA-Z\.\-',"\s]+\s{1}[a-zA-Z]{1}[a-zA-Z\.\-',"\s]*$/;
	if (!field.match(match)) {
		$.surveyorError.visible = true;
		$.surveyorError.text = "* Please provide the first and last name of the head surveyor";
	} else {
		$.surveyorError.visible = false;
	}
});

//Other Surveyors - error checking
$.otherSrvyName.addEventListener('change', function(e) {
	Ti.App.fireEvent('otherSurveyorChange');
});
Ti.App.addEventListener('otherSurveyorChange', function(e) {
	var field = $.otherSrvyName.value;
	var match = /^[a-zA-Z]{1}[a-zA-Z\.\-',"\s]+\s{1}[a-zA-Z]{1}[a-zA-Z\.\-',"\s]*$/;
	if ( (!field.match(match)) && (field !== "") ) {
		$.otherSurveyorsError.visible = true;
		$.otherSurveyorsError.text = "* Please give the first and last name of at least one surveyor";
	} else {
		$.otherSurveyorsError.visible = false;
	}
});

//Plot Distance
$.plotDist.addEventListener('change', function(e) {
	// Replace bad input (non-numbers) on plotDistance TextField
	e.source.value = e.source.value.replace(/[^0-9]+/,"");
	Ti.App.fireEvent('plotDistanceChange');
});
Ti.App.addEventListener('plotDistanceChange', function(e) {
	if ($.plotDist.value < 2) {
		$.plotDistanceError.visible = true;
		$.plotDistanceError.text = "* Please use a spacing between plots of at least 2 meters";
	} else if ($.plotDist.value > 30) {
		$.plotDistanceError.visible = true;
		$.plotDistanceError.text = "* Please use a spacing between plots of at most 30 meters";
	} else {
		$.plotDistanceError.visible = false;
	}
});

//Stake Orientation
$.pickStake.addEventListener('click', function(e) {
	// remove the error msg when a stake orientation is selected
	$.stakeError.visible = false;
});

//Comments
$.comments.addEventListener('change', function(e) {
	//no restrictions on comments
});

//Event Listener - help info for enabling location services
gpsDialog.addEventListener('click', function(e) {
	if (e.index === e.source.help) {
		helpDialog.show();
	}
});

// Fire when addTransect Window is closed
$.addTransectWin.addEventListener('close', function(e) {
	//remove the temp photo - used for photo preview
	var tempPhoto = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
	if(tempPhoto.exists){
		tempPhoto.deleteFile();
	}
	//Kill the GPS
	Ti.Geolocation.removeEventListener('location', function(e) {});
	Ti.App.fireEvent("app:refreshTransects");
});