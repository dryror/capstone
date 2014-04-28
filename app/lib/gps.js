//Location Services Dialog
var gpsDialog = Titanium.UI.createAlertDialog({
	title : 'Location Services Disabled',
	message : 'You currently have all location services for this device disabled. If you would like to proceed please reenable location services.',
	buttonNames : ['OK', 'Help'],
	ok : 0,
	help : 1
});

//How to enable location services
var helpDialog = Titanium.UI.createAlertDialog({
	title : 'Enable Location Services',
	message : 'To enable location services close the application and open' + ' Settings > Privacy > Location Services'
});

//Enable location services for LTEMA
var ltemaAccessDialog = Titanium.UI.createAlertDialog({
	title : 'No Location Service Access',
	message : "\"LTEMA\" needs Location Services enabled in order to access your current location.  Please check your device's Settings > Privacy > Location Services > LTEMA"
});

// GET CURRENT LOCATION
function getCurrentLocation(callback) {

	Titanium.Geolocation.purpose = 'Determine Location';
	Titanium.Geolocation.preferredProvider = Titanium.Geolocation.PROVIDER_GPS;
	Titanium.Geolocation.accuracy = Titanium.Geolocation.ACCURACY_BEST;

	var locationCallback = function(e) {
		if (!e.success || e.error) {
			//alert('error: ' + JSON.stringify(e.error));
		} else {
			// turn off the event listener.  It will be turned back on at the next time I call
			Titanium.Geolocation.removeEventListener('location', locationCallback);

			var longitude = e.coords.longitude;
			var latitude = e.coords.latitude;
			var altitude = e.coords.altitude;
			var heading = e.coords.heading;
			var accuracy = e.coords.accuracy;
			var speed = e.coords.speed;
			var timestamp = e.coords.timestamp;
			var altitudeAccuracy = e.coords.altitudeAccuracy;

			//Convert lat & long to UTM
			var utm = require('utm');
			utm.LatLngToUTMRef(latitude, longitude, function(UTMEasting, UTMNorthing, UTMZone, longitudeZone){
				//alert("UTMEasting: " + UTMEasting + "\nUTMNorthing: " + UTMNorthing + "\nUTMZone: " + UTMZone + "\nlongitudeZone: " + longitudeZone);
				callback(UTMEasting, UTMNorthing, UTMZone, longitudeZone);
			});
			
			
		}
	};

	//Check if Location Services is Enabled/Disabled
	if (Titanium.Geolocation.locationServicesEnabled == false) {
		gpsDialog.show();
		//notify user that location services is disabled
		return;
	}
	Titanium.Geolocation.getCurrentPosition(function(e) {
		if (!e.success || e.error) {
			ltemaAccessDialog.show();
			return;
		}
	});

	// this fires once
	//Titanium.Geolocation.getCurrentPosition(locationCallback);

	//fires each time the function is called - gets most current position
	Titanium.Geolocation.addEventListener('location', locationCallback);
}

//Event Listener - help info for enabling location services
gpsDialog.addEventListener('click', function(e) {
	if (e.index === e.source.help) {
		helpDialog.show();
	}
});

exports.getCurrentLocation = getCurrentLocation;
