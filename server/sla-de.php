<?php
// http://stackoverflow.com/questions/20472698/apache-settings-and-php-headers-download-a-csv
  header('Content-Type: application/csv');
  header('Content-Disposition: attachment; filename=../data/tickets.csv');
  header('Pragma: no-cache');
  header('Content-Length: ' . filesize("../data/tickets.csv"));
  readfile("../data/tickets.csv");
?>
