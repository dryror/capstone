//Setup module to run Behave tests
require('behave').andSetup(this);

describe('Index screen', function() {

	var index = null;
	it('creates a index controller', function() {
		index = Alloy.createController('index');
		expect(index).notToBe(null);
	});

	it('creates a table for the user to see', function() {		
		expect(index.getView("tbl")).notToBe(undefined);
	});

	// go nuts! :-)

}); 