// math
function sinSquared(x) {
  return Math.sin(x) * Math.sin(x);
}

function cosSquared(x) {
  return Math.cos(x) * Math.cos(x);
}

function tanSquared(x) {
  return Math.tan(x) * Math.tan(x);
}

function sec(x) {
  return 1.0 / Math.cos(x);
}
  
function deg2rad(x) {
  return x * (Math.PI / 180);
}
  
function rad2deg(x) {
  return x * (180 / Math.PI);
}
  
function chr(x) {
  var h = x.toString (16);
  if (h.length == 1)
    h = "0" + h;
  h = "%" + h;
  return unescape (h);
}
  
function ord(x) {
  var c = x.charAt(0);
  var i;
  for (i = 0; i < 256; ++ i) {
    var h = i.toString (16);
    if (h.length == 1)
      h = "0" + h;
    h = "%" + h;
    h = unescape (h);
    if (h == c)
      break;
  }
  return i;
}

// ================================================================== RefEll

function RefEll(maj, min) {
  this.maj = maj;
  this.min = min;
  this.ecc = ((maj * maj) - (min * min)) / (maj * maj);
}


// conversion

	
function LatLngToUTMRef(latitude, longitude, callback) {
  var wgs84 = new RefEll(6378137, 6356752.314);
  var UTM_F0   = 0.9996;
  var a = wgs84.maj;
  var eSquared = wgs84.ecc;

  var latitudeRad = latitude * (Math.PI / 180.0);
  var longitudeRad = longitude * (Math.PI / 180.0);
  var longitudeZone = Math.floor((longitude + 180.0) / 6.0) + 1;

  // Special zone for Norway
  if (latitude >= 56.0
    && latitude < 64.0
    && longitude >= 3.0
    && longitude < 12.0) {
    longitudeZone = 32;
  }

  // Special zones for Svalbard
  if (latitude >= 72.0 && latitude < 84.0) {
    if (longitude >= 0.0 && longitude < 9.0) {
      longitudeZone = 31;
    } else if (longitude >= 9.0 && longitude < 21.0) {
      longitudeZone = 33;
    } else if (longitude >= 21.0 && longitude < 33.0) {
      longitudeZone = 35;
    } else if (longitude >= 33.0 && longitude < 42.0) {
      longitudeZone = 37;
    }
  }

  var longitudeOrigin = (longitudeZone - 1) * 6 - 180 + 3;
  var longitudeOriginRad = longitudeOrigin * (Math.PI / 180.0);

  var UTMZone = getUTMLatitudeZoneLetter(latitude);

  ePrimeSquared = (eSquared) / (1 - eSquared);

  var n = a / Math.sqrt(1 - eSquared * Math.sin(latitudeRad) * Math.sin(latitudeRad));
  var t = Math.tan(latitudeRad) * Math.tan(latitudeRad);
  var c = ePrimeSquared * Math.cos(latitudeRad) * Math.cos(latitudeRad);
  var A = Math.cos(latitudeRad) * (longitudeRad - longitudeOriginRad);

  var M =
    a
      * ((1
        - eSquared / 4
        - 3 * eSquared * eSquared / 64
        - 5 * eSquared * eSquared * eSquared / 256)
        * latitudeRad
        - (3 * eSquared / 8
          + 3 * eSquared * eSquared / 32
          + 45 * eSquared * eSquared * eSquared / 1024)
          * Math.sin(2 * latitudeRad)
        + (15 * eSquared * eSquared / 256
          + 45 * eSquared * eSquared * eSquared / 1024)
          * Math.sin(4 * latitudeRad)
        - (35 * eSquared * eSquared * eSquared / 3072)
          * Math.sin(6 * latitudeRad));

  var UTMEasting =
    (UTM_F0
      * n
      * (A
        + (1 - t + c) * Math.pow(A, 3.0) / 6
        + (5 - 18 * t + t * t + 72 * c - 58 * ePrimeSquared)
          * Math.pow(A, 5.0)
          / 120)
      + 500000.0);

  var UTMNorthing =
    (UTM_F0
      * (M
        + n
          * Math.tan(latitudeRad)
          * (A * A / 2
            + (5 - t + (9 * c) + (4 * c * c)) * Math.pow(A, 4.0) / 24
            + (61 - (58 * t) + (t * t) + (600 * c) - (330 * ePrimeSquared))
              * Math.pow(A, 6.0)
              / 720)));

  // Adjust for the southern hemisphere
  if (latitude < 0) {
    UTMNorthing += 10000000.0;
  }
  
  // Round the UTM Easting & Northing
  var UTMEasting = Math.round(UTMEasting);
  var UTMNorthing = Math.round(UTMNorthing);
  
  //add utm zone letter
  	//var n_UTMZone = longitudeZone + UTMZone; 
  
  callback(UTMEasting, UTMNorthing, longitudeZone);
  //return "UTMEasting: " + UTMEasting + "\nUTMNorthing: " + UTMNorthing + "\nUTMZone: " + UTMZone + "\nlongitudeZone: " + longitudeZone;
}



//UTM ZONE LETTER 

function getUTMLatitudeZoneLetter(latitude) {
  if ((84 >= latitude) && (latitude >= 72)) return "X";
  else if (( 72 > latitude) && (latitude >=  64)) return "W";
  else if (( 64 > latitude) && (latitude >=  56)) return "V";
  else if (( 56 > latitude) && (latitude >=  48)) return "U";
  else if (( 48 > latitude) && (latitude >=  40)) return "T";
  else if (( 40 > latitude) && (latitude >=  32)) return "S";
  else if (( 32 > latitude) && (latitude >=  24)) return "R";
  else if (( 24 > latitude) && (latitude >=  16)) return "Q";
  else if (( 16 > latitude) && (latitude >=   8)) return "P";
  else if ((  8 > latitude) && (latitude >=   0)) return "N";
  else if ((  0 > latitude) && (latitude >=  -8)) return "M";
  else if (( -8 > latitude) && (latitude >= -16)) return "L";
  else if ((-16 > latitude) && (latitude >= -24)) return "K";
  else if ((-24 > latitude) && (latitude >= -32)) return "J";
  else if ((-32 > latitude) && (latitude >= -40)) return "H";
  else if ((-40 > latitude) && (latitude >= -48)) return "G";
  else if ((-48 > latitude) && (latitude >= -56)) return "F";
  else if ((-56 > latitude) && (latitude >= -64)) return "E";
  else if ((-64 > latitude) && (latitude >= -72)) return "D";
  else if ((-72 > latitude) && (latitude >= -80)) return "C";
  else return 'Z';
}

exports.LatLngToUTMRef = LatLngToUTMRef;
