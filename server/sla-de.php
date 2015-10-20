<?php
// http://stackoverflow.com/questions/20472698/apache-settings-and-php-headers-download-a-csv
  header('Content-Type: application/csv');
  header('Content-Disposition: attachment; filename=example.csv');
  header('Pragma: no-cache');
  header('Content-Length: ' . filesize("path and file name of csv to send"));
  readfile("name and path of CSV file you wish to send");
?>
