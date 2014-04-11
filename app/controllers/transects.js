//Place holder for edit button
function editBtn(){
	alert('You Clicked the Edit Button');
}

//Place holder for add button
function addBtn(){
	//Navigation to addTransect
	var addTransect = Alloy.createController("addTransect").getView();
	$.navGroupWin.openWindow(addTransect);
}

//Needed to add this to get to the next screen for testing
//Will be replaced once controller implemented
$.row1.addEventListener('click', function(event){
    var plots = Alloy.createController("plots").getView();
    $.navGroupWin.openWindow(plots);
}); 
