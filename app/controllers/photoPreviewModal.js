/* Preview the transect photo just taken */

var temp=Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
//var temp=Ti.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory,'temp.png');
//alert(temp.resolve().toString());

var back=Titanium.UI.createImageView({
   //check if asect ratio
   image:temp,
   height:Ti.UI.FILL,
   width:Ti.UI.FILL
});
$.modalWin.add(back);


function backBtn(){
	$.modalNav.close();
}
