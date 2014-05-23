// Get the transectID for this plot
var args = arguments[0];
var plotID = args.plotID;

// Initialize Variables
var photo;

function doneBtn(e){
	//disable button for 1 second to prevent double entry
	e.source.enabled = false;
	setTimeout(function(){ e.source.enabled = true; },1000);
	
	// Check for errors on page
	var errorOnPage = false;
	
	//TODO: Check for errors
	
	if (errorOnPage) {
		return;
	}
	
	// Check observation type and set count and observation
	var count;
	var observation = $.observation.value;
	var percentCoverage = $.percent.value;
	var comments;
	var speciesCode;
	
	if ($.pickType.index == 0) {
		// Plant is selected
		count = 1;
		comments = $.comments.value;
		//TODO: Check if observation is a scientific name or common name
		// if it is, set the species_code field TODO get the species_code field added to db
		speciesCode = $.observation.value;
		
	} else {
		// Other is selected
		count = 0;
		speciesCode = null;
		comments = $.observation.value;
		if ($.comments.value != "") {
			comments += " - Comment: " + $.comments.value;
		}
	}
	
	// Name and save photo if taken
	var mediaID = null;
	if (photo != null) {
		
		var photoName = savePhoto(photo);
	
		try{
			//Connect to database
			var db = Ti.Database.open('ltemaDB');
			
			//add photo name to media table
			db.execute( 'INSERT INTO media (media_name) VALUES (?)', photoName);
			
			//get the id of the last row inserted into the database - *not sure if this is acceptable sql code to use?
			var results = db.execute('SELECT last_insert_rowid() as mediaID');
			mediaID = results.fieldByName('mediaID');			
		}catch(e){
			var errorMessage = e.message;
			Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
		}finally{	
			//close the result set
			results.close();	
			//Close the database
			db.close();
		}
	}
	
	// Insert Query - add row to plot observation table
	try{
		//Connect to database
		var db = Ti.Database.open('ltemaDB');
		
		db.execute('INSERT INTO plot_observation (observation, ground_cover, count, comments, plot_id, media_id) \
				VALUES (?,?,?,?,?,?)', observation, percentCoverage, count, comments, plotID, mediaID);
					
	}catch(e){
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	}finally{	
		//Close the database
		db.close();
		//refresh and close
		Ti.App.fireEvent("app:refreshPlotObservations");
		$.addPlotObservation.close();
	}
}

function takePhoto(){
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
	var filename = "O" + timestamp;
	
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