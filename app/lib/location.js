function location(callback){
var longitude;
var latitude;
var error;
//Turn on the GPS
if (Ti.Geolocation.locationServicesEnabled) {
	    Ti.Geolocation.purpose = 'Determine Location';
	    Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_BEST;
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
				
				//callback(latitude, longitude, error);
				//Ti.API.info(e.coords);
	        }
	        callback(latitude, longitude, error);
	    });
	} else {
		 error = true;
		 //alert('Please enable location services');
		 //callback(latitude, longitude, error);
	}
	callback(latitude, longitude, error);
}
exports.location = location;