/*
 *  A screen to view and edit transect details 
 * 
 * expected args: transectID, title
 */

var args = arguments[0];
var transectID = args.transectID;
var title = args.title;

//initialize variables
var photo;

// Create stake orientation labels (Fixes Issue #13)
var stakeBarLabels = [
	{title:"Top Left / Bottom Right", enabled:false},
	{title:"Top Right / Bottom Left", enabled:false}
];
$.stakeBar.labels = stakeBarLabels;

// Query the database and store values associated with a transectID
try {
	var db = Ti.Database.open('ltemaDB');
	
	var resultRow = db.execute(	'SELECT transect_id, transect_name, surveyor, other_surveyors, plot_distance, stake_orientation, comments, site_id, media_id \
							FROM transect t \
							WHERE transect_id = ?', transectID);
	
	var transectName = resultRow.fieldByName('transect_name');
	var surveyor = resultRow.fieldByName('surveyor');
	var otherSurveyors = resultRow.fieldByName('other_surveyors');
	var plotDistance = resultRow.fieldByName('plot_distance');
	var stakeOrientation = resultRow.fieldByName('stake_orientation');
	var comments = resultRow.fieldByName('comments');
	var siteID = resultRow.fieldByName('site_id');
	var mediaID = resultRow.fieldByName('media_id');
	
	//if media does not exist
	if(mediaID == null){
		//enable the take photo button
		$.editBtn.fireEvent('click');
		$.photoBtn.visible = true;
		$.photoBtn.enabled = true;
		
		//make instructions visible
		$.footerLine.visible = true;
		$.info.visible = true;
		
		$.info.text = ('Revisiting a Transect: \n\nPlease confirm all of the information above. \n\nYou will be required to take a new photo of the existing transect.');
		
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
			$.transectThumbnail.visible = true;
			$.transectThumbnail.image = imageFile;
			$.thumbnailHintText.visible = true;
		
			//Save Photo for preview (temporary photo)
			var temp = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
			temp.write(imageFile);
		}
	}
 }	
	
	//Assign editable TextField values
	$.transectName.value = transectName;
	$.surveyor.value = surveyor;
	$.otherSurveyors.value = otherSurveyors;
	$.plotDistance.value = plotDistance;
	$.comments.value = comments;
	
	//TODO: perhaps an ENUM or CONSTANT would be useful here
	if (stakeOrientation === "Top Left / Bottom Right") {
		$.stakeBar.index = 0;
	} else if (stakeOrientation === "Top Right / Bottom Left") {
		$.stakeBar.index = 1;
	} else {
		//alert('please set the stake orientation');
	}

} catch (e) {
	var errorMessage = e.message;
	Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
} finally {
	if(mediaID != null){
		mediaRow.close();
		rows.close();
	}
	resultRow.close();
	db.close();
}
//Custom font modal title
var titleLabel = Titanium.UI.createLabel({
	text:title,
	font:{fontSize:20,fontWeight:'bold'}
});

//Assign view labels
$.modalWin.setTitleControl(titleLabel);

// Initially disable input fields
$.transectName.editable = false;
$.surveyor.editable = false;
$.otherSurveyors.editable = false;
$.plotDistance.editable = false;
$.comments.editable = false;


/* Listeners */

// When an input field changes, fire error handler
$.transectName.addEventListener('change', function (e) {
	if ($.transectName.value.length < 2) {
		$.transectError.visible = true;
		$.transectError.text = "* Please use at least 2 characters in a transect name";
	} else {
		$.transectError.visible = false;
	}
});

$.surveyor.addEventListener('change', function(e) {
	var field = e.value;
	var match = /^[a-zA-Z]{1}[a-zA-Z\.\-',"\s]+\s{1}[a-zA-Z]{1}[a-zA-Z\.\-',"\s]*$/; 
	if (!field.match(match)) {
		$.surveyorError.visible = true;
		$.surveyorError.text = "* Please provide the first and last name of the head surveyor";
	} else {
		$.surveyorError.visible = false;
	}
});

$.otherSurveyors.addEventListener('change', function(e) {
	var field = $.otherSurveyors.value;
	var match = /^[a-zA-Z]{1}[a-zA-Z\.\-',"\s]+\s{1}[a-zA-Z]{1}[a-zA-Z\.\-',"\s]*$/;
	if ( (!field.match(match)) && (field !== "") ) {
		$.otherSurveyorsError.visible = true;
		$.otherSurveyorsError.text = "* Please give the first and last name of at least one surveyor";
	} else {
		$.otherSurveyorsError.visible = false;
	}
});

$.plotDistance.addEventListener('change', function(e) {
	// Replace bad input (non-numbers) on plotDistance TextField
	e.source.value = e.source.value.replace(/[^0-9]+/,"");
	if ($.plotDistance.value < 2) {
		$.plotDistanceError.visible = true;
		$.plotDistanceError.text = "* Please use a spacing between plots of at least 2 meters";
	} else if ($.plotDistance.value > 30) {
		$.plotDistanceError.visible = true;
		$.plotDistanceError.text = "* Please use a spacing between plots of at most 30 meters";
	} else {
		$.plotDistanceError.visible = false;
	}
});

$.comments.addEventListener('change', function(e) {
	//no comment field validation needed
});


/* Functions */

//swaps editable property of fields
function editBtnClick(e){
	//enable or disable edit mode
	if (e.source.title == "Edit") {
		$.modalWin.editing = true;
		e.source.title = "Done";
		
		//Enable editing
		$.transectName.editable = true;
		$.surveyor.editable = true;
		$.otherSurveyors.editable = true;
		$.plotDistance.editable = true;
		stakeBarLabels[0].enabled = true;
		stakeBarLabels[1].enabled = true;
		$.stakeBar.labels = stakeBarLabels;
		$.comments.editable = true;
		
		//disable the button button during edit mode
		$.backBtn.enabled = false;
		$.photoBtn.enabled = true;
		
	} else { //title is "Done"
		//fire error-checking listeners
		$.transectName.blur();
		$.surveyor.blur();
		$.plotDistance.blur();
		if (($.transectError.visible == true)||($.surveyorError.visible == true)||($.plotDistanceError.visible == true)) {
			return;
		}
		
		$.modalWin.editing = false;
		e.source.title = "Edit";
		//enable the back button
		$.backBtn.enabled = true;
		
		//disable editing
		$.transectName.editable = false;
		$.surveyor.editable = false;
		$.otherSurveyors.editable = false;
		$.plotDistance.editable = false;
		stakeBarLabels[0].enabled = false;
		stakeBarLabels[1].enabled = false;
		$.stakeBar.labels = stakeBarLabels;
		$.comments.editable = false;
		
		$.photoBtn.enabled = false;
				
		saveEdit(e);
	}
}

//Save changes to transect
function saveEdit(e){
	try {
		//connect to the database
		var db = Ti.Database.open('ltemaDB');
		
		//Save photo
		if(photo != null){
			var photoName = savePhoto(photo);
			
			//add photo name to media table
			db.execute( 'INSERT INTO media (media_name) VALUES (?)', photoName);
			
			//get the id of the last row inserted into the database - *not sure if this is acceptable sql code to use?
			var results = db.execute('SELECT last_insert_rowid() as mediaID');
			var mediaID = results.fieldByName('mediaID');
			results.close();
			
			//save the new information to the database with the media_id of the new photo
			db.execute( 'UPDATE OR FAIL transect SET transect_name= ?, surveyor= ?, other_surveyors= ?, plot_distance= ?, stake_orientation= ?, comments= ?, media_id= ? WHERE transect_id= ?',
					$.transectName.value, $.surveyor.value, $.otherSurveyors.value, $.plotDistance.value, stakeBarLabels[$.stakeBar.index].title, $.comments.value, mediaID, transectID);		
		}else{
			db.execute( 'UPDATE OR FAIL transect SET transect_name= ?, surveyor= ?, other_surveyors= ?, plot_distance= ?, stake_orientation= ?, comments= ? WHERE transect_id= ?',
					$.transectName.value, $.surveyor.value, $.otherSurveyors.value, $.plotDistance.value, stakeBarLabels[$.stakeBar.index].title, $.comments.value, transectID);
		}
	} catch (e){
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		db.close();
		//close the window when user hits done button if a photo has been taken.
		if(photo != null){
			//remove the temp photo - used for photo preview  //Ti.Filesystem.tempDirectory 
			var tempPhoto = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
			if(tempPhoto.exists){
				tempPhoto.deleteFile();
			}
			Ti.App.fireEvent("app:refreshTransects");
			$.modalNav.close();
		}
		$.photoError.visible = true;
	}	
}

//Navigate back
function backBtnClick(){
	//remove the temp photo - used for photo preview  //Ti.Filesystem.tempDirectory 
	var tempPhoto = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
	if(tempPhoto.exists){
		tempPhoto.deleteFile();
	}
	Ti.App.fireEvent("app:refreshTransects");
	$.modalNav.close();
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