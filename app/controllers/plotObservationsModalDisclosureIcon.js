/*
 * View details of a plot observation
 * 
 * Expected args: observationID, title, comments, mediaID
 */

var args = arguments[0];
var observationID = args.observationID;
var title = args.title;
var comments = args.comments;
var mediaID = args.mediaID;
var siteID = args.siteID;

//Query the database, assign returned ground cover to TextField
try {
	var db = Ti.Database.open('ltemaDB');
	var resultRow = db.execute(	'SELECT ground_cover, count \
						FROM plot_observation \
						WHERE observation_id = ?', observationID);
	var groundCover = resultRow.fieldByName('ground_cover');
	var count = resultRow.fieldByName('count');
	//var mediaID = resultRow.fieldByName('media_id');
	//Set the label depending on the oberservation type
	if(count == 0){
		$.groundCoverLbl.text = "Cover:";
	}
	$.groundCover.value = groundCover;
	
		//if media does not exist
	if(mediaID != null){

	//get the media name
	var mediaRow = db.execute('SELECT media_name \
							FROM media \
							WHERE media_id = ?', mediaID);
	
	var mediaName = mediaRow.fieldByName('media_name');
	
	mediaRow.close();
	
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
	
	rows.close();
	
	var folderName = year + ' - ' + protocolName + ' - ' + parkName;
	
	var imageDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, folderName);
	
	if (imageDir.exists()) {		
		// .resolve() provides the resolved native path for the directory.
		var imageFile = Ti.Filesystem.getFile(imageDir.resolve(), mediaName);
		if (imageFile.exists()) {
			//Set thumbnail
			$.plotObservationThumbnail.visible = true;
			$.plotObservationThumbnail.image = imageFile;
			$.thumbnailHintText.visible = true;
		
			//Save Photo for preview (temporary photo)
			var temp = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
			temp.write(imageFile);
		}
	}
 }	
	
	
} catch (e) {
	var errorMessage = e.message;
	Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
} finally {
	resultRow.close();
	db.close();
}

//Custom screen title
var titleLabel = Titanium.UI.createLabel({
	text:title,
	font:{fontSize:20,fontWeight:'bold'}
});

//Assign view labels
$.modalWin.setTitleControl(titleLabel);
$.groundCover.text = groundCover + " %";
$.comments.text = comments;


/* Listeners */



/* Functions */

// Valid inputs get saved to the database and this screen closes.
function doneBtnClick(){
	//remove the temp photo - used for photo preview 
	var tempPhoto = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
	if(tempPhoto.exists){
		tempPhoto.deleteFile();
	}
	$.modalNav.close();
	Ti.App.fireEvent("app:refreshPlotObservations");
}

// Exit this screen without saving
function cancelBtnClick(){
	//remove the temp photo - used for photo preview 
	var tempPhoto = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
	if(tempPhoto.exists){
		tempPhoto.deleteFile();
	}
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