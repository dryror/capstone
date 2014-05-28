/* A screen to view and edit transect details */

// Get transectID from calling window
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
	
	resultRow = db.execute(	'SELECT transect_id, transect_name, surveyor, other_surveyors, plot_distance, stake_orientation, comments, site_id, media_id \
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
		//$.editBtn.fireEvent('click');
		$.photoBtn.visible = true;
		$.photoBtn.enabled = true;
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
	//e.source.value = e.source.value.replace(/['"]/,"");
	if ($.transectName.value.length < 2) {
		$.transectError.visible = true;
		$.transectError.text = "Transect name should be at least 2 characters";
	} else {
		$.transectError.visible = false;
	}
});
$.surveyor.addEventListener('change', function(e) {
	//e.source.value = e.source.value.replace(/['"]/,"");
	var field = e.value;
	var match = /^[a-zA-Z]{1}[a-zA-Z\.\-',"\s]+\s{1}[a-zA-Z]{1}[a-zA-Z\.\-',"\s]*$/; 
	if (!field.match(match)) {
		$.surveyorError.visible = true;
		$.surveyorError.text = "Head surveyor should have a first and last name";
	} else {
		$.surveyorError.visible = false;
	}
});
$.otherSurveyors.addEventListener('change', function(e) {
	var field = $.otherSurveyors.value;
	var match = /^[a-zA-Z]{1}[a-zA-Z\.\-',"\s]+\s{1}[a-zA-Z]{1}[a-zA-Z\.\-',"\s]*$/;
	if (!field.match(match)) {
		$.otherSurveyorsError.visible = true;
		$.otherSurveyorsError.text = "Other surveyors should have a first and last name";
	} else {
		$.otherSurveyorsError.visible = false;
	}
});

$.plotDistance.addEventListener('change', function(e) {
	// Replace bad input (non-numbers) on plotDistance TextField
	e.source.value = e.source.value.replace(/[^0-9]+/,"");
	if ($.plotDistance.value < 2) {
		$.plotDistanceError.visible = true;
		$.plotDistanceError.text = "The distance between each plot should be at least 2 meters";
	} else if ($.plotDistance.value > 30) {
		$.plotDistanceError.visible = true;
		$.plotDistanceError.text = "The distance between each plot should be at most 30 meters";
	} else {
		$.plotDistanceError.visible = false;
	}
});

$.comments.addEventListener('change', function(e) {
	//e.source.value = e.source.value.replace(/['"]/,""); 
});

// TESTING - an example of restricting the keyboard input
//Listen and replace bad input on transectName
//$.transectName.addEventListener('change', function (e) {
//	e.source.value = e.source.value.replace(/[^0-9a-zA-Z ()_,.-]/,"");
//});


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
		
		saveEdit();
	}
}

//Save changes to transect
function saveEdit(){
	try {
		var db = Ti.Database.open('ltemaDB');
		db.execute( 'UPDATE OR FAIL transect SET transect_name= ?, surveyor= ?, other_surveyors= ?, plot_distance= ?, stake_orientation= ?, comments= ? WHERE transect_id= ?',
					$.transectName.value, $.surveyor.value, $.otherSurveyors.value, $.plotDistance.value, stakeBarLabels[$.stakeBar.index].title, $.comments.value, transectID);		
	} catch (e){
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		db.close();
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