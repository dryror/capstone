//Camera - takes a single photo
 
function getPhoto(callback) {
	Titanium.Media.showCamera({
		success : function(event) {
			// called when media returned from the camera
			Ti.API.debug('Our type was: ' + event.mediaType);
			if (event.mediaType == Ti.Media.MEDIA_TYPE_PHOTO) {
				
			// THE PHOTO TAKEN
			var myPhoto = event.media;
			/*
			// THE UTM IS CALLED HERE
			//get the location when the phone was taken - UTM
				var gps = require('gps');
				gps.getCurrentLocation(function(UTMEasting, UTMNorthing, n_UTMZone) {
					//alert("UTMEasting: " + UTMEasting + "\nUTMNorthing: " + UTMNorthing + "\nUTMZone: " + n_UTMZone);
					
					// CALLBACK - photo & utm information
					callback(myPhoto, UTMEasting, UTMNorthing, n_UTMZone); 
				});
			*/
				// CALLBACK - photo
				callback(myPhoto); 
					
			} else {
				alert("got the wrong type back =" + event.mediaType);
			}
		},
		cancel : function() {
			// called when user cancels taking a picture
		},
		error : function(error) {
			// called when there's an error
			var a = Titanium.UI.createAlertDialog({
				title : 'Camera'
			});
			if (error.code == Titanium.Media.NO_CAMERA) {
				a.setMessage('Please run this test on device');
			} else {
				a.setMessage('Unexpected error: ' + error.code);
			}
			a.show();
		},
		saveToPhotoGallery : false,
		allowEditing : false,
		mediaTypes : [Ti.Media.MEDIA_TYPE_PHOTO]
	});
}

exports.getPhoto = getPhoto;	