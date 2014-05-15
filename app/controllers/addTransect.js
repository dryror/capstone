//get calling params
var args = arguments[0];
var siteID = args.siteID;

// Initialize Variables
var photo;
var utmEasting;
var utmNorthing;
var utmZone;

//set stake orientation text
var stakeText;
if ($.pickStake.index == 0) {
	stakeText = "Top Left / Bottom Right";
} else {
	stakeText = "Top Right / Bottom Left";
}
	
//validate form before inserting to database
function doneBtn(e){
	//disable button for 1 second to prevent double entry
	e.source.enabled = false;
	setTimeout(function(){ e.source.enabled = true; },1000);
	
	// check that the following (required) fields are not empty
	Ti.App.fireEvent('transectChange');
	Ti.App.fireEvent('surveyorChange');
	Ti.App.fireEvent('plotDistanceChange');
	
	//check photo exists and a stake orientation has been selected
	if(photo == null && $.pickStake.index == null){
		$.photoError.visible = true;
		$.photoError.text = "* Please take a photo";
		$.stakeError.visible = true;
		$.stakeError.text = "* Must select a stake orientation";
		return;
	}else if (photo == null){
		$.photoError.visible = true;
		$.photoError.text = "* Please take a photo";
		return;
	}else if($.pickStake.index == null){
		$.stakeError.visible = true;
		$.stakeError.text = "* Must select a stake orientation";
		return;
	}else{
		$.photoError.visible = false;
		$.stakeError.visible = false;
	}
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
						$.tsctName.value, $.srvyName.value, $.otherSrvyName.value, $.plotDist.value, stakeText, utmZone, utmEasting, utmNorthing, $.comments.value, siteID, mediaID);
						
		}catch(e){
			
		}finally{	
			//close the result set
			results.close();	
			//Close the database
			db.close();
			//refresh and close
			Ti.App.fireEvent("app:refreshTransects");
			$.addTransect.close();
		}
	}

function takePhoto() {		
	//remove photo error msg
	$.photoError.visible = false;
	
	//call camera module and set thumbnail
	var pic = require('camera');
	pic.getPhoto(function(myPhoto, UTMEasting, UTMNorthing, n_UTMZone) {
		//Set thumbnail
		$.transectThumbnail.image = myPhoto;
		
		//set variables with values
		photo = myPhoto;
		utmEasting = UTMEasting;
		utmNorthing = UTMNorthing;
		utmZone = n_UTMZone;
		
		//alert("UTMEasting: " + UTMEasting + "\nUTMNorthing: " + UTMNorthing + "\nUTMZone: " + n_UTMZone);
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
	
		//Name the directory
		var dir = year + ' - ' + protocolName + ' - ' + parkName; 
		//get the photo
		var img = photo;
		
		//name the photo  (timestamp - utc in ms)
		var timestamp = new Date().getTime();
		var filename = "T" + timestamp;
		
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
		//Ti.App.fireEvent("app:dataBaseError", e);
	} finally {
		rows.close();
		db.close();
		return path;
	}
  }
 
  
/* Listeners */

//TODO: Confirm all conditions with project specs, project sponsor
// When an input field changes, fire error handler

// ERROR CHECKING

//Transect Name
$.tsctName.addEventListener('change', function (e) {
	Ti.App.fireEvent('transectChange');
});
Ti.App.addEventListener('transectChange', function() {
	if ($.tsctName.value.length < 2) {
		$.transectError.visible = true;
		$.transectError.text = "* Transect name should be at least 2 characters";
		$.tsctName.borderColor = 'red';
		$.tsctName.borderRadius = 8;
	} else {
		$.transectError.visible = false;
		$.tsctName.borderColor = 'transparent';
	}
});




// Head Surveyor
$.srvyName.addEventListener('change', function(e) {
	Ti.App.fireEvent('surveyorChange');
});
Ti.App.addEventListener('surveyorChange', function(e) {
	var field = $.srvyName.value;
	var match = /^[a-zA-Z]{1}[a-zA-Z\.\-',"\s]+\s{1}[a-zA-Z]{1}[a-zA-Z\.\-',"\s]*$/;
	if (!field.match(match)) {
		$.surveyorError.visible = true;
		$.surveyorError.text = "Head surveyor should have a first and last name";
		$.srvyName.borderColor = 'red';
		$.srvyName.borderRadius = 8;
	} else {
		$.surveyorError.visible = false;
		$.srvyName.borderColor = 'transparent';
	}
/*
	if ($.srvyName.value.length < 2) {
		$.surveyorError.visible = true;
		$.surveyorError.text = "* Surveyor should have at least 2 characters";
		$.srvyName.borderColor = 'red';
		$.srvyName.borderRadius = 8;
	} else if (!field.test(nameRegEx)) {
		$.surveyorError.visible = true;
		$.surveyorError.text = "* Surveyor's name is invalid";
		$.srvyName.borderColor = 'red';
		$.srvyName.borderRadius = 8;
	} else {
		$.surveyorError.visible = false;
		$.srvyName.borderColor = 'transparent';
	}
	*/
});

//Other Surveyors - error checking
$.otherSrvyName.addEventListener('change', function(e) {
	Ti.App.fireEvent('otherSurveyorChange');
});
Ti.App.addEventListener('otherSurveyorChange', function(e) {
	var field = $.otherSrvyName.value;
	var match = /^[a-zA-Z]{1}[a-zA-Z\.\-',"\s]+\s{1}[a-zA-Z]{1}[a-zA-Z\.\-',"\s]*$/;
	if (!field.match(match)) {
		$.otherSurveyorsError.visible = true;
		$.otherSurveyorsError.text = "Other surveyors should have a first and last name";
		$.otherSrvyName.borderColor = 'red';
		$.otherSrvyName.borderRadius = 8;
	} else {
		$.otherSurveyorsError.visible = false;
		$.otherSrvyName.borderColor = 'transparent';
	}
	/*
	// first & last name regex
	var nameRegEx = /^[a-zA-Z]{1}[a-zA-Z\.\-'\s]+\s{1}[a-zA-Z]{1}[a-zA-Z\.\-'\s]*$/;
	var field = $.otherSrvyName.value;
	if ($.otherSrvyName.value.length < 2) {
		$.otherSurveyorsError.visible = true;
		$.otherSurveyorsError.text = "* Surveyor should have at least 2 characters";
	} else if (!field.test(nameRegEx)) {
		$.otherSurveyorsError.visible = true;
		$.otherSurveyorsError.text = "* Surveyor's name is invalid";
		$.otherSrvyName.borderColor = 'red';
		$.otherSrvyName.borderRadius = 8;
	} else {
		$.otherSurveyorsError.visible = false;
		$.otherSrvyName.borderColor = 'transparent';
	}
	*/
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
		$.plotDistanceError.text = "* Plot distance should be at least 2 meters";
		$.plotDist.borderColor = 'red';
		$.plotDist.borderRadius = 8;
	} else if ($.plotDist.value > 30) {
		$.plotDistanceError.visible = true;
		$.plotDistanceError.text = "* Plot distance should be at most 30 meters";
		$.plotDist.borderColor = 'red';
		$.plotDist.borderRadius = 8;
	} else {
		$.plotDistanceError.visible = false;
		$.plotDist.borderColor = 'transparent';
	}
});

//Stake Orientation
$.pickStake.addEventListener('click', function(e) {
	// remove the error msg when a stake orientation is selected
	$.stakeError.visible = false;
});

//Comments
$.comments.addEventListener('change', function(e) {
	//TODO
});