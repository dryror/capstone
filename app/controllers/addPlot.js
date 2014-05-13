// Get the transectID for this plot
var args = arguments[0];
var transectID = args.transectID;

// Get the plot name and the transect defaults for stake orientation and plot distance
try {
	var db = Ti.Database.open('ltemaDB');
	var results = db.execute('SELECT plot_id FROM plot WHERE transect_id = ?', transectID);
	var plotNumber = results.rowCount + 1;
	$.numberLbl.text = "P"+plotNumber;
	
	results = db.execute('SELECT site_id, stake_orientation, plot_distance FROM transect WHERE transect_id = ?', transectID);
	var siteID = results.fieldByName('site_id');
	var stakeOrientation = results.fieldByName('stake_orientation');
	var plotDistance = results.fieldByName('plot_distance');
} catch(e) {
	Ti.API.error(e.toString());
} finally {
	results.close();
	db.close();
}

// Set the stake deviation and plot distance labels
$.pickStake.labels = [{title:stakeOrientation}, {title:"Other"}];
$.pickDistance.labels = [{title:plotDistance}, {title:"Other"}];
var stakeOther = false;
var distanceOther = false;

// Initialize Variables
var photo;
var utmEasting;
var utmNorthing;
var utmZone;

function doneBtn(e){
	//disable button for 1 second to prevent double entry
	e.source.enabled = false;
	setTimeout(function(){ e.source.enabled = true; },1000);
	
	// Name and Save Photo
	var photoName = savePhoto(photo);
	var utc = new Date().getTime();
		
	try{
		//Connect to database
		var db = Ti.Database.open('ltemaDB');
		
		//add photo name to media table
		db.execute( 'INSERT INTO media (media_name) VALUES (?)', photoName);
		
		//get the id of the last row inserted into the database - *not sure if this is acceptable sql code to use?
		var results = db.execute('SELECT last_insert_rowid() as mediaID');
		var mediaID = results.fieldByName('mediaID');
		
		//Insert Query - add row to plot table
		db.execute(	'INSERT INTO plot (plot_name,utm_zone,utm_easting,utm_northing,utc,stake_deviation,distance_deviation,transect_id,media_id) VALUES (?,?,?,?,?,?,?,?,?)', 
					$.numberLbl.text, utmZone, utmEasting, utmNorthing, utc, stakeOrientation, plotDistance, transectID, mediaID);
					
	}catch(e){
		Ti.API.error(e.toString());
	}finally{	
		//close the result set
		results.close();	
		//Close the database
		db.close();
		//refresh and close
		Ti.App.fireEvent("app:refreshPlots");
		$.addPlot.close();
	}
}

function takePhoto() {		
	//remove photo error msg
	$.photoError.visible = false;
	
	//call camera module and set thumbnail
	var pic = require('camera');
	pic.getPhoto(function(myPhoto, UTMEasting, UTMNorthing, n_UTMZone) {
		//Set thumbnail
		$.plotThumbnail.image = myPhoto;
		
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
	
	var dir = "site" + siteID;
	var img = photo; 
	
	//name the photo  (timestamp - utc in ms)
	var timestamp = new Date().getTime();
	var filename = "P" + timestamp;
	
	// Create image Directory for site
	var imageDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, dir);
	if (! imageDir.exists()) {
    	imageDir.createDirectory();
	}
	
	// .resolve() provides the resolved native path for the directory.
	var imageFile  = Ti.Filesystem.getFile(imageDir.resolve(), filename + '.png');
	imageFile.write(img);
	
	var path = filename + '.png';
	return path;
}

$.pickStake.addEventListener('click', function(e) {
	// Show and hide the deviation text field depending on what is selected
	if (stakeOther === false && e.source.labels[e.index].title === "Other") {
		$.plotLbl.top += 60;
		$.pickDistance.top += 60;
		$.plotDeviation.top += 60;
		$.commentLbl.top += 60;
		$.comments.top += 60;
		$.photoBtn.top += 60;
		$.plotThumbnail.top += 60;
		$.photoError.top += 60;
		$.info.top += 60;
		$.stakeDeviation.visible = true;
		$.stakeDeviation.focus();
		stakeOther = true;
	}
	if (stakeOther === true && e.source.labels[e.index].title !== "Other") {
		$.plotLbl.top -= 60;
		$.pickDistance.top -= 60;
		$.plotDeviation.top -= 60;
		$.commentLbl.top -= 60;
		$.comments.top -= 60;
		$.photoBtn.top -= 60;
		$.plotThumbnail.top -= 60;
		$.photoError.top -= 60;
		$.info.top -= 60;
		$.stakeDeviation.visible = false;
		$.stakeDeviation.blur();
		stakeOther = false;
	}
	
});

$.pickDistance.addEventListener('click', function(e) {
	// Show and hide the deviation text field depending on what is selected
	if (distanceOther === false && e.source.labels[e.index].title === "Other") {
		$.commentLbl.top += 60;
		$.comments.top += 60;
		$.photoBtn.top += 60;
		$.plotThumbnail.top += 60;
		$.photoError.top += 60;
		$.info.top += 60;
		$.plotDeviation.visible = true;
		$.plotDeviation.focus();
		distanceOther = true;
	}
	if (distanceOther === true && e.source.labels[e.index].title !== "Other") {
		$.commentLbl.top -= 60;
		$.comments.top -= 60;
		$.photoBtn.top -= 60;
		$.plotThumbnail.top -= 60;
		$.photoError.top -= 60;
		$.info.top -= 60;
		$.plotDeviation.visible = false;
		$.plotDeviation.blur();
		distanceOther = false;
	}
	
});
