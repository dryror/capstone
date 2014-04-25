function makeCSV(siteID) {
	//Query the database based on the siteID selected
	var db = Ti.Database.open('ltemaDB');
	
	var rows = db.execute('SELECT prk.park_name, tct.transect_name, plt.plot_name, ' +
	   'plt.utm_zone, plt.utm_easting, plt.utm_northing, plt.stake_deviation, ' +
	   'plt.distance_deviation, plt.utc, tct.surveyor, pob.observation, 	   pob."count", pob.comments, pob.ground_cover, ' +
	   '(SELECT media_name FROM media, transect WHERE transect.media_id = media.media_id) AS transect_photo, ' +
	   '(SELECT media_name FROM media, plot WHERE plot.media_id = media.media_id) AS plot_photo, ' +
	   '(SELECT media_name FROM media, plot_observation WHERE plot_observation.media_id = media.media_id) AS observation_photo ' +
	   'FROM park prk, transect tct, plot plt, plot_observation pob, site_survey svy, media med ' +
	   'WHERE svy.park_id = prk.park_id AND ' +
	   'svy.site_id = tct.site_id AND ' +
	   'tct.media_id = med.media_id AND ' +
	   'tct.transect_id = plt.transect_id AND ' +
	   'plt.plot_id = pob.plot_id AND ' +
	   'svy.site_id = ?', siteID);
	
	alert('Exported ' + rows.rowCount + ' rows');
	
	//Convert the result set into CSV
	
	
	//Write the CSV stings to Files
	
	rows.close();
	db.close();
	
	
}

makeCSV(1);

//exports.makeCSV = makeCSV;