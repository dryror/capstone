<?php
// Server code to upload csv files and images to the webserver
// Requires a folder named upload in the same folder as this file

$maxFileSize = 5000000;
$allowedExts = array("gif", "jpeg", "jpg", "png", "csv");
$temp = explode(".", $_FILES["file"]["name"]);
$extension = end($temp);

if ((($_FILES["file"]["type"] == "image/gif")
|| ($_FILES["file"]["type"] == "image/jpeg")
|| ($_FILES["file"]["type"] == "text/csv")
|| ($_FILES["file"]["type"] == "image/jpg")
|| ($_FILES["file"]["type"] == "image/pjpeg")
|| ($_FILES["file"]["type"] == "image/x-png")
|| ($_FILES["file"]["type"] == "image/png"))
&& ($_FILES["file"]["size"] < $maxFileSize)
&& in_array($extension, $allowedExts)) {
  if ($_FILES["file"]["error"] > 0) {
  	echo $_FILES["file"]["name"];
  } else {
  	if (!file_exists('upload/' . $_POST["path"])) {
  	  mkdir('upload/' . $_POST["path"], 0755, true);
	}
	move_uploaded_file($_FILES["file"]["tmp_name"], "upload/" . $_POST["path"] . "/" . $_FILES["file"]["name"]);
	echo "success";
  }
} else {
  echo $_FILES["file"]["name"];
}
?>