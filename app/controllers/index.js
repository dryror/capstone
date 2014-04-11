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


//This should always happen last
$.navGroupWin.open();
