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
	var errorMessage = e.message;
	Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
} finally {
	//results.close();
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


/* Functions */

function doneBtn(e){
	//disable button for 1 second to prevent double entry
	e.source.enabled = false;
	setTimeout(function(){ e.source.enabled = true; },1000);
	
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
	
	if (errorOnPage) {
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
		plotsResult = db.execute('SELECT plot_id FROM plot WHERE transect_id = ?', transectID);
		while (plotsResult.isValidRow()) {
			plotIDs.push(plotsResult.fieldByName('plot_id'));
			plotsResult.next();
		}
		
		//build a list of unique titles/names/"observation"s to avoid duplicates
		var uniquePlotObservationTitles = [];
		
		//add current plot's titles to the unique list if indeed unique
		uniquesResult = db.execute ('SELECT observation FROM plot_observation WHERE plot_id = ?', plotID);
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
				obsResult = db.execute('SELECT observation_id, observation FROM plot_observation WHERE plot_id = ?', plotIDs[i]);
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
		$.photoError.top -= 60;
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

// related to issue #28
$.addPlotWin.addEventListener('close', function(e) {
	Ti.App.fireEvent("app:refreshPlots");
});