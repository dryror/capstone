function doneBtn(){
	alert('You Clicked the Done Button');
}

function takePhoto(){
	//call camera module and set thumbnail
	var pic = require('camera');
	pic.getPhoto(function(myPhoto) {
		$.transectThumbnail.image = myPhoto;
	});
}
