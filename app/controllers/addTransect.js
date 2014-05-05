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
	
	if ($.tsctName.value.trim().length == 0) {
		alert('No transect name entered');
		return;
	} else if ($.srvyName.value.trim().length == 0) {
		alert('No survey name entered');
		return;
	} else if ($.pickStake.index == null) {
		alert('Stake orientation not selected');
		return;
	} else if ($.plotDist.value < 2 | $.plotDist.value > 30) {
		alert('Select a plot distance from 2 - 30');
		return;
	} else if(photo == null){
		alert("please take a photo");
		return;
	}
		// Name and Save Photo
		var photoName = savePhoto(photo, transectCount);
		
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
function savePhoto(photo, transectCount){
	
	var dir = "site" + siteID;
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
	var imageFile  = Ti.Filesystem.getFile(imageDir.resolve(), filename + '.png');
	imageFile.write(img);
	
	//var path = dir + Ti.Filesystem.separator + filename + '.jpg';
	
	var path = filename + '.png';
	return path;
}

/*
// RESTRICT USER FORM INPUT

// Replace bad input on Transect Name TextField
$.tsctName.addEventListener('change', function(e) {
	e.source.value = e.source.value.replace(/[^A-Za-z 0-9]+/,"");
});

// Replace bad input (non-numbers) on plotDistance TextField
$.plotDist.addEventListener('change', function(e) {
	e.source.value = e.source.value.replace(/[^0-9]+/,"");
});
*/