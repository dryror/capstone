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


