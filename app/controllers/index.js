//Place holder for edit button
function editBtn(){
	alert('You Clicked the Edit Button');
}

//Place holder for add button
function addBtn(){
	//Navigation to addSiteSurvey
	var addSite = Alloy.createController("addSiteSurvey").getView();
	$.navGroupWin.openWindow(addSite);
}

//Needed to add this to get to the next screen for testing
//Will be replaced once controller implemented
$.row1.addEventListener('click', function(event){
    var transects = Alloy.createController("transects").getView();
    $.navGroupWin.openWindow(transects);
}); 



//This should always happen last
$.navGroupWin.open();
