var args = arguments[0];

$.parkName.text = args.parkName;
$.siteID.text = args.siteID;
$.siteYear.text = args.siteYear;
$.protocolName.text = args.protocolName;

function editBtnClick(){
	alert("You clicked the edit button");
}
function backBtnClick(){
	$.modalWin.close();
}