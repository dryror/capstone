function location(callback){
var longitude;
var latitude;
var accuracy;
var error;
//Turn on the GPS
if (Ti.Geolocation.locationServicesEnabled) {
	    Ti.Geolocation.purpose = 'Determine Location';
	    //Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;  //this line seems to be buggy
	    Titanium.Geolocation.accuracy = Titanium.Geolocation.ACCURACY_NEAREST_TEN_METERS;
	    Ti.Geolocation.distanceFilter = 0;
	    Ti.Geolocation.preferredProvider = Ti.Geolocation.PROVIDER_GPS;
		//error = false;
	    Ti.Geolocation.addEventListener('location', function(e) {
	        if (e.error) {
	        	error = true;
	        	//callback(latitude, longitude, error);
	            //alert('Error: ' + e.error);
	            //alert('Please make sure that location services is enabled');

	        } else {
	        	error = false;
	            longitude = e.coords.longitude;
				latitude = e.coords.latitude;
				accuracy = e.coords.accuracy;
				
				//callback(latitude, longitude, error);
				//Ti.API.info(e.coords);
	        }
	        callback(latitude, longitude, accuracy, error);
	    });
	} else {
		 error = true;
		 //alert('Please enable location services');
		 //callback(latitude, longitude, error);
	}
	callback(latitude, longitude, error);
}
exports.location = location;