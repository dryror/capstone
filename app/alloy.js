// The contents of this file will be executed before any of
// your view controllers are ever executed, including the index.
// You have access to all functionality on the `Alloy` namespace.
//
// This is a great place to do any initialization for your app
// or create any global variables/functions that you'd like to
// make available throughout your app. You can easily make things
// accessible globally by attaching them to the `Alloy.Globals`
// object. For example:
//
// Alloy.Globals.someGlobalFunction = function(){};

//install both the Application & Reference database
Ti.Database.install('ltema.sqlite', 'ltemaDB');
Ti.Database.install('taxonomy.sqlite', 'taxonomy');
/*
if( Ti.App.deployType !== 'production' )
{
	var behave = require('behave');

	//require your created specs
	//require('spec/ui');
	require('spec/addPlotTest');

	//run:tests
	behave.run();	
}
*/