/*
 *  A screen to view and edit plot details 
 * 
 * expected args: plotID, title, siteID, plotName
 */

var args = arguments[0];
var plotID = args.plotID;
var plotTitle = args.title;
var siteID = args.siteID;
var plotName = args.plotName;

//initialize variables
var photo;

//Set the title of the modal to the plot name
var titleLabel = Titanium.UI.createLabel({
    height:34,
    //width:350,  //long park names may need this set
    top:10,
    text:plotTitle,
    textAlign:'center',
    font:{fontSize:20,fontWeight:'bold'},
});
// associate label to title
$.modalWin.setTitleControl(titleLabel);

// Query database plot table for all required data
try{
	var db = Ti.Database.open('ltemaDB');
	
	var results = db.execute('SELECT plot_name, utm_zone, utm_northing, utm_easting, utc, stake_deviation, distance_deviation, transect_id, media_id, comments \
	 						 FROM plot \
	 						 WHERE plot_id = ?', plotID);
	
	
	//var plotName = results.fieldByName('plot_name');
	//var utmZone = results.fieldByName('utm_zone');
	//var utmNorthing = results.fieldByName('utm_northing');
	//var utmEasting = results.fieldByName('utm_easting');
	var utc = results.fieldByName('utc');
	var stakeOrientation = results.fieldByName('stake_deviation');
	var plotDistance = results.fieldByName('distance_deviation');
	//var transectID = results.fieldByName('transect_id');			
	var mediaID = results.fieldByName('media_id');		
	var comments = results.fieldByName('comments');			
	
	//if media does not exist
	if(mediaID == null){
		//enable the take photo button
		$.editBtn.fireEvent('click');
		$.photoBtn.visible = true;
		$.photoBtn.enabled = true;
		
		//make instructions visible
		$.footerLine.visible = true;
		$.info.visible = true;
		
		$.info.text = ('Revisiting a Plot: \n\nPlease confirm all of the information above. \n\nYou will be required to take a new photo of each existing plot.');
		
		//inform user that photo is required
		$.photoError.text = '* Photo Required';
		$.photoError.visible = true;
		
	}else{	
	//get the media name
	var mediaRow = db.execute('SELECT media_name \
							FROM media \
							WHERE media_id = ?', mediaID);
	
	var mediaName = mediaRow.fieldByName('media_name');	
	
	//GET FOLDER NAME - Retrieve site survery, year, park
	var rows = db.execute('SELECT year, protocol_name, park_name \
							FROM site_survey s, protocol p, park prk \
							WHERE s.protocol_id = p.protocol_id \
							AND s.park_id = prk.park_id \
							AND site_id = ?', siteID);
							
   //get the name of the directory	
	var year = rows.fieldByName('year');
	var protocolName = rows.fieldByName('protocol_name');
	var parkName = rows.fieldByName('park_name');

	var folderName = year + ' - ' + protocolName + ' - ' + parkName;
	
	var imageDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, folderName);
	
	
	
	if (imageDir.exists()) {		
		// .resolve() provides the resolved native path for the directory.
		var imageFile = Ti.Filesystem.getFile(imageDir.resolve(), mediaName);
		if (imageFile.exists()) {
			//Set thumbnail
			$.plotThumbnail.visible = true;
			$.plotThumbnail.image = imageFile;
			$.thumbnailHintText.visible = true;
		
			//Save Photo for preview (temporary photo)
			var temp = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
			temp.write(imageFile);
		}
	}
 }	
}catch(e){
	var errorMessage = e.message;
	Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
}finally{
	if(mediaID != null){
		mediaRow.close();
		rows.close();
	}
	results.close();
	db.close();
}

//ORIGINAL stakeOrientation & plotDistance Values****
var orginal_stakeOrientation = stakeOrientation;
var original_plotDistance = plotDistance;

//Set Plot Name
$.nameLbl.text = plotName;

//get the date the plot was initially recored
var UTC = Number(utc);
var d = new Date(UTC);
var nd = d.toUTCString();

$.dateRecorded.text = nd;

//Set Tabbed Bar Labels & disable selection
var stakeOrientationTabbedBar = [{title:stakeOrientation, enabled:false}, {title:"Other", enabled:false}];
var plotDistanceTabbedBar = [{title:plotDistance, enabled:false}, {title:"Other", enabled:false}];

$.pickStake.labels = stakeOrientationTabbedBar;
$.pickDistance.labels = plotDistanceTabbedBar;

// Set stake deviation and plot distance labels to default selection and disable
$.pickStake.index = 0;
$.pickDistance.index = 0;

//Assign Values to editable fields
$.comments.value = comments;

//Disable editing text fields
$.comments.editable = false;

var stakeOther = false;
var distanceOther = false;

// BACK BUTTON - navigate back to plot list screen
function backBtn(){
	//remove the temp photo - used for photo preview 
	var tempPhoto = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
	if(tempPhoto.exists){
		tempPhoto.deleteFile();
	}
	Ti.App.fireEvent("app:refreshPlots");
	$.modalNav.close();
}

// EDIT BUTTON
function editBtn(e){
	
	//enable or disable edit mode
	if (e.source.title == "Edit") {
		errorOnPage = false;
		$.modalWin.editing = true;
		e.source.title = "Done";
		
		//Enable editing
		stakeOrientationTabbedBar[0].enabled = true;
		stakeOrientationTabbedBar[1].enabled = true;
		plotDistanceTabbedBar[0].enabled = true;
		plotDistanceTabbedBar[1].enabled = true;
		$.pickStake.labels = stakeOrientationTabbedBar;
		$.pickDistance.labels = plotDistanceTabbedBar;
		$.comments.editable = true;
		$.stakeDeviation.editable = true;
		$.distanceDeviation.editable = true;
		
		//disable the button button during edit mode
		$.backBtn.enabled = false;
		$.photoBtn.enabled = true;
		
	} else { //if the title says "Done"
		var errorOnPage = false;
		if(stakeOther == true){
			if($.stakeError.visible == true || $.stakeOtherError.visible == true){
				errorOnPage = true;
			}
		}
	
		if(distanceOther == true){
			if($.distanceError.visible == true || $.distanceOtherError.visible == true){
				errorOnPage = true;
			}
		}

		if ($.pickStake.index == 1) {
			if ($.stakeDeviation.value === "") {
				$.stakeOtherError.visible = true;
				errorOnPage = true;
			}
			stakeOrientation = $.stakeDeviation.value;
		}else{
			stakeOrientation = orginal_stakeOrientation;
		}	
		
		if ($.pickDistance.index == 1) {
			if ($.distanceDeviation.value === "") {
				$.distanceOtherError.visible = true;
				errorOnPage = true;
			}
			plotDistance = $.distanceDeviation.value;
		}else{
			plotDistance = original_plotDistance;
		}
		/*
		if (photo == null){
			$.photoError.visible = true;
			$.photoError.text = "* Please take a photo";
			errorOnPage = true;
		}
		*/
		if(errorOnPage){
			return;
		}else{
			$.modalWin.editing = false;
			e.source.title = "Edit";
			$.backBtn.enabled = true;
		
			//Disable editing
			stakeOrientationTabbedBar[0].enabled = false;
			stakeOrientationTabbedBar[1].enabled = false;
			plotDistanceTabbedBar[0].enabled = false;
			plotDistanceTabbedBar[1].enabled = false;
			$.pickStake.labels = stakeOrientationTabbedBar;
			$.pickDistance.labels = plotDistanceTabbedBar;
			$.comments.editable = false;
			$.stakeDeviation.editable = false;
			$.distanceDeviation.editable = false;
			
			$.photoBtn.enabled = false;
		
			saveEdit(e);
		}
	}
}

// SAVE EDIT - check for errors & save when done btn selected
function saveEdit(e){
	
	//disable button for 1 second to prevent double entry
	e.source.enabled = false;
	setTimeout(function(){ e.source.enabled = true; },1000);
	
	//Get the value of the comments field
	comments = $.comments.value;
		
	try{
		//Connect to database
		var db = Ti.Database.open('ltemaDB');
		//Save Photo
		if(photo != null){
			var photoName = savePhoto(photo);
		
			//add photo name to media table
			db.execute( 'INSERT INTO media (media_name) VALUES (?)', photoName);
			
			//get the id of the last row inserted into the database - *not sure if this is acceptable sql code to use?
			var results = db.execute('SELECT last_insert_rowid() as mediaID');
			var mediaID = results.fieldByName('mediaID');
		
			//Insert Query - update row in plot table
			db.execute(	'UPDATE OR FAIL plot SET stake_deviation = ?, distance_deviation = ?, media_id = ?, comments = ? WHERE plot_id = ?', 
						stakeOrientation, plotDistance, mediaID, comments, plotID);
		}else{
			//Insert Query - update row in plot table
			db.execute(	'UPDATE OR FAIL plot SET stake_deviation = ?, distance_deviation = ?, comments = ? WHERE plot_id = ?', 
						stakeOrientation, plotDistance, comments, plotID);
		}		
	}catch(e){
		Ti.API.error(e.toString());	
	}finally{
		//Close the database
		db.close();
		//close the window when user hits done button if a photo has been taken.
		if(photo != null){
			//remove the temp photo - used for photo preview 
			var tempPhoto = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
			if(tempPhoto.exists){
				tempPhoto.deleteFile();
			}
			Ti.App.fireEvent("app:refreshPlots");
			$.modalNav.close();
		}
		$.photoError.visible = true;
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
		//show hint text for thumbnail
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
	var filename = "P" + timestamp;
	
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

/* Event Listeners */

// Show and hide the deviation text field depending on what is selected
$.pickStake.addEventListener('click', function(e) {
	//remove any text from this field
	$.stakeDeviation.value = "";
	//$.stakeDeviation.value = null;
	
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
		$.dateRecordedLbl.top += 60;
		$.dateRecorded.top += 60;
		$.photoBtn.top += 60;
		$.plotThumbnail.top += 60;
		$.photoError.top += 60;
		$.thumbnailHintText.top += 60;
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
		$.dateRecordedLbl.top -= 60;
		$.dateRecorded.top -= 60;
		$.photoBtn.top -= 60;
		$.plotThumbnail.top -= 60;
		$.photoError.top -= 60;
		$.thumbnailHintText.top -= 60;
		$.footerLine.top -= 60;
		$.info.top -= 60;
		$.stakeDeviation.visible = false;
		$.stakeDeviation.blur();
		stakeOther = false;
	}	
});

// Show and hide the deviation text field depending on what is selected
$.pickDistance.addEventListener('click', function(e) {
	//remove any text from this field
	$.distanceDeviation.value = "";
	//$.distanceDeviation.value = null;
	
	$.distanceError.visible = false;
	$.distanceOtherError.visible = false;
	if (distanceOther === false && e.source.labels[e.index].title === "Other") {
		$.commentLbl.top += 60;
		$.comments.top += 60;
		$.dateRecordedLbl.top += 60;
		$.dateRecorded.top += 60;
		$.photoBtn.top += 60;
		$.plotThumbnail.top += 60;
		$.thumbnailHintText.top += 60;
		$.photoError.top += 60;
		$.footerLine.top += 60;
		$.info.top += 60;
		$.distanceDeviation.visible = true;
		$.distanceDeviation.focus();
		distanceOther = true;
	}
	if (distanceOther === true && e.source.labels[e.index].title !== "Other") {
		$.commentLbl.top -= 60;
		$.comments.top -= 60;
		$.dateRecordedLbl.top -= 60;
		$.dateRecorded.top -= 60;
		$.photoBtn.top -= 60;
		$.plotThumbnail.top -= 60;
		$.thumbnailHintText.top -= 60;
		$.photoError.top -= 60;
		$.footerLine.top -= 60;
		$.info.top -= 60;
		$.distanceDeviation.visible = false;
		$.distanceDeviation.blur();
		distanceOther = false;
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