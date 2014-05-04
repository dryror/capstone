//Setup module to run Behave tests
require('behave').andSetup(this);

describe('\nThe index screen', function() {

	var index;
	it('should create a controller', function() {
		index = Alloy.createController('index');
		expect(index).notToBe(null);
	});
	it('should create a table', function() {		
		expect(index.getView("tbl")).notToBe(undefined);
	});
	describe('\nThe modal with siteID 1', function () {
		var indexModal = Alloy.createController('siteSurveyModal', {siteID:1});
		it('should be created when the info icon is selected', function() {
			expect(indexModal).notToBe(undefined);
		});
		it('should have a park name of Kakwa Park', function() {
			expect(indexModal.parkName.text).toBe('Kakwa Park');
		});
		it('should have a year of 2014', function() {
			expect(indexModal.siteYear.text).toBe('2014');
		});
	});
	describe('\nThe addSiteSurvey screen', function() {
		var addSiteSurvey = Alloy.createController('addSiteSurvey');
		it('should be created when Add is selected ', function() {
			expect(addSiteSurvey).notToBe(undefined);
		});
		it('should have no park name selected', function() {
			expect(addSiteSurvey.parkSrch.value).toBe(undefined);
		});
		/*
		it('should not allow empty forms to be submitted', function() {
			Ti.App.fireEvent('click', addSiteSurvey.doneBtn);
			expect(addSiteSurvey.parkSrchError.visible).toBe(true);
		});
		*/
	});
	it('should create an export Modal when Export is selected', function() {
		exportModal = Alloy.createController('exportModal');
		expect(exportModal).notToBe(undefined);
	});
}); 